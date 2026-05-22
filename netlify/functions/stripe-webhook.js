/**
 * stripe-webhook — Netlify function (sprint-admin-v1, M2)
 *
 * Handles Stripe checkout.session.completed events.
 * Verifies webhook signature, then calls finalise-quote with path=stripe_success.
 *
 * BLOCKED: Returns 503 until STRIPE_WEBHOOK_SECRET is set in Netlify env.
 */

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // BLOCKED guard
  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured — webhook disabled');
    return new Response(JSON.stringify({ blocked: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();

  // Verify signature using Stripe's scheme (HMAC-SHA256)
  const isValid = await verifyStripeSignature(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    console.error('[stripe-webhook] Invalid signature');
    return new Response('Invalid signature', { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Only handle checkout.session.completed
  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ ok: true, ignored: true, type: event.type }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = event.data.object;
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    console.error('[stripe-webhook] No order_id in session metadata', session.id);
    return new Response('No order_id in metadata', { status: 400 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return new Response('Supabase not configured', { status: 503 });
  }

  // Call finalise-quote logic inline (avoid HTTP round-trip to own function)
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch order
  const { data: order, error: fetchErr } = await supabase
    .from('dtf_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchErr || !order) {
    console.error('[stripe-webhook] Order not found:', orderId);
    return new Response('Order not found', { status: 404 });
  }

  // Idempotency check
  if (order.payment_status === 'paid' && order.stripe_session_id === session.id) {
    console.log('[stripe-webhook] Already processed (idempotent):', session.id);
    return new Response(JSON.stringify({ ok: true, idempotent: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Apply: confirmed + paid
  const confirmedAt = order.confirmed_at ?? new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('dtf_orders')
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent ?? null,
      confirmed_at: confirmedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateErr) {
    console.error('[stripe-webhook] Update failed:', updateErr.message);
    return new Response('DB update failed', { status: 500 });
  }

  // Append status history
  await supabase.from('dtf_order_status_history').insert({
    order_id: orderId,
    from_status: order.status,
    to_status: 'confirmed',
    source: 'stripe_webhook',
    actor_id: null,
    metadata: { stripe_session_id: session.id, stripe_payment_intent: session.payment_intent },
  });

  // Admin notification
  await supabase.from('dtf_admin_notifications').insert({
    type: 'payment_received',
    order_id: orderId,
    payload: {
      order_id: orderId,
      customer_email: order.customer_email,
      payment_status: 'paid',
      stripe_session_id: session.id,
      quote_eur: order.quote_eur,
    },
  });

  console.log('[stripe-webhook] Order confirmed:', orderId, 'session:', session.id);

  return new Response(JSON.stringify({ ok: true, orderId, payment_status: 'paid' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * Verify Stripe webhook signature using Web Crypto API.
 * Stripe uses timestamp + HMAC-SHA256.
 */
async function verifyStripeSignature(payload, signature, secret) {
  try {
    const parts = signature.split(',').reduce((acc, part) => {
      const [k, v] = part.split('=');
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts['t'];
    const sigHash = parts['v1'];

    if (!timestamp || !sigHash) return false;

    // Tolerance: 5 minutes
    const tolerance = 300;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > tolerance) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(signedPayload);

    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, msgData);
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    return expected === sigHash;
  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
}

export const config = { path: '/api/stripe-webhook' };
