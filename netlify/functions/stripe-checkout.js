/**
 * stripe-checkout — Netlify function (sprint-admin-v1, M2)
 *
 * Creates a Stripe Checkout session for an order.
 * POST { orderId }
 *
 * BLOCKED: Returns 503 + Finnish message until STRIPE_SECRET_KEY is set in Netlify env.
 * UI shows: "Maksu ei ole vielä käytössä — käytä yhden klikkauksen vahvistusta"
 */

import { createClient } from '@supabase/supabase-js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.URL || 'https://kuva.dtfstudio.fi';

// BLOCKED guard — per approved-contract.md inline-input handling
if (!STRIPE_SECRET_KEY) {
  console.warn('[stripe-checkout] STRIPE_SECRET_KEY not configured — Stripe path disabled');
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // BLOCKED: return Finnish fallback until key available
  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({
      ok: false,
      blocked: true,
      message: 'Maksu ei ole vielä käytössä — käytä yhden klikkauksen vahvistusta',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { orderId } = body;
  if (!orderId) {
    return new Response(JSON.stringify({ error: 'orderId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch order
  const { data: order, error: fetchErr } = await supabase
    .from('dtf_orders')
    .select('id, customer_email, customer_name, quote_eur, sheet_count, status, payment_status')
    .eq('id', orderId)
    .single();

  if (fetchErr || !order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (order.status !== 'quote') {
    return new Response(JSON.stringify({ error: `Order not in quote status (current: ${order.status})` }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create Stripe Checkout session (one-time charge per order)
  const amountCents = Math.round(order.quote_eur * 100);
  const params = new URLSearchParams();
  params.set('payment_method_types[]', 'card');
  params.set('line_items[0][price_data][currency]', 'eur');
  params.set('line_items[0][price_data][product_data][name]', `DTF Studio tilaus #${order.id.slice(0, 8).toUpperCase()}`);
  params.set('line_items[0][price_data][product_data][description]', `${order.sheet_count} arkkia DTF-siirtokuvaa`);
  params.set('line_items[0][price_data][unit_amount]', String(amountCents));
  params.set('line_items[0][quantity]', '1');
  params.set('mode', 'payment');
  params.set('customer_email', order.customer_email);
  params.set('metadata[order_id]', order.id);
  params.set('success_url', `${APP_URL}/account/orders/${order.id}?stripe=success`);
  params.set('cancel_url', `${APP_URL}/account/orders/${order.id}?stripe=cancelled`);

  const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!stripeResp.ok) {
    const err = await stripeResp.json();
    console.error('Stripe session creation failed:', err);
    return new Response(JSON.stringify({ error: err.error?.message || 'Stripe error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await stripeResp.json();

  // Store stripe_session_id on order (pending confirmation)
  await supabase
    .from('dtf_orders')
    .update({ stripe_session_id: session.id, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  return new Response(JSON.stringify({
    ok: true,
    checkoutUrl: session.url,
    sessionId: session.id,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = { path: '/api/stripe-checkout' };
