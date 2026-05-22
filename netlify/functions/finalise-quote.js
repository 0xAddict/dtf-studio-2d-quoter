/**
 * finalise-quote — Netlify function (sprint-admin-v1, M2)
 *
 * Handles two paths:
 *   A) One-click confirm (requires_payment=false):
 *      POST { orderId, path: 'one_click' }
 *      → status=confirmed, payment_status=invoice_pending, creates Trello card
 *
 *   B) Admin override of requires_payment:
 *      POST { orderId, path: 'admin_override', requires_payment: bool }
 *      → updates requires_payment field only
 *
 * Rule: new customer (0 prior paid orders) → requires_payment=true
 *       returning customer (≥1 prior paid) → requires_payment=false
 *       admin can override per-quote
 *
 * Stripe: BLOCKED (STRIPE_SECRET_KEY missing) — Stripe path returns 503 + Finnish message.
 *         Implement stripe-checkout.js separately once key is available.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_API_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_CONFIRMED_LIST_ID = process.env.TRELLO_CONFIRMED_LIST_ID; // "Confirmed Orders" list

// ──────────────────────────────────────────────────────────────
// Rule: decideRequiresPayment
// ──────────────────────────────────────────────────────────────

async function decideRequiresPayment(supabase, customerEmail, adminOverride) {
  if (adminOverride !== undefined && adminOverride !== null) return adminOverride;

  const { count, error } = await supabase
    .from('dtf_orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_email', customerEmail)
    .eq('payment_status', 'paid');

  if (error) {
    console.error('decideRequiresPayment query error:', error.message);
    return true; // fail-safe: require payment on error
  }

  return (count ?? 0) === 0; // first-timer = requires payment
}

// ──────────────────────────────────────────────────────────────
// Trello: create card in Confirmed list
// ──────────────────────────────────────────────────────────────

async function createTrelloCard(order) {
  if (!TRELLO_API_KEY || !TRELLO_API_TOKEN || !TRELLO_CONFIRMED_LIST_ID) {
    console.warn('Trello credentials not configured — skipping card creation');
    return null;
  }

  const orderUrl = `https://supabase.com/dashboard/project/jqfudagohdkdtnplgtob/editor/dtf_orders?filter=id%3Aeq%3A${order.id}`;
  const cardName = `#${order.id.slice(0, 8).toUpperCase()} — ${order.customer_email} — €${order.quote_eur}`;
  const cardDesc = [
    `**Tilaus:** ${order.id}`,
    `**Asiakas:** ${order.customer_email}`,
    `**Hinta:** €${order.quote_eur}`,
    `**Arkkeja:** ${order.sheet_count}`,
    `**Maksu:** ${order.payment_status}`,
    '',
    `[Avaa Supabasessa](${orderUrl})`,
  ].join('\n');

  const params = new URLSearchParams({
    key: TRELLO_API_KEY,
    token: TRELLO_API_TOKEN,
    idList: TRELLO_CONFIRMED_LIST_ID,
    name: cardName,
    desc: cardDesc,
    pos: 'top',
  });

  const resp = await fetch(`https://api.trello.com/1/cards?${params}`, { method: 'POST' });
  if (!resp.ok) {
    console.error('Trello card creation failed:', resp.status, await resp.text());
    return null;
  }

  const card = await resp.json();
  return card.id;
}

// ──────────────────────────────────────────────────────────────
// Append status history row
// ──────────────────────────────────────────────────────────────

async function appendStatusHistory(supabase, orderId, fromStatus, toStatus, source, actorId, metadata) {
  const { error } = await supabase.from('dtf_order_status_history').insert({
    order_id: orderId,
    from_status: fromStatus,
    to_status: toStatus,
    source,
    actor_id: actorId ?? null,
    metadata: metadata ?? null,
  });
  if (error) console.error('appendStatusHistory error:', error.message);
}

// ──────────────────────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────────────────────

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
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

  const { orderId, path: actionPath, requires_payment: adminOverride, actor_id } = body;

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

  // ── Fetch order ──
  const { data: order, error: fetchErr } = await supabase
    .from('dtf_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchErr || !order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Path: admin_override ──
  if (actionPath === 'admin_override') {
    if (adminOverride === undefined || adminOverride === null) {
      return new Response(JSON.stringify({ error: 'requires_payment value required for admin_override path' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: updateErr } = await supabase
      .from('dtf_orders')
      .update({ requires_payment: adminOverride, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, orderId, requires_payment: adminOverride }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Path: one_click ──
  if (actionPath === 'one_click') {
    if (order.status !== 'quote') {
      return new Response(JSON.stringify({ error: `Order not in quote status (current: ${order.status})` }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Decide requires_payment using rule
    const requiresPayment = await decideRequiresPayment(supabase, order.customer_email, adminOverride);

    if (requiresPayment) {
      // Customer must go through Stripe — return flag so UI redirects to Stripe
      return new Response(JSON.stringify({
        ok: false,
        requires_payment: true,
        message: 'Tämä tilaus vaatii maksun vahvistukseksi. Siirry maksamaan Stripe Checkoutiin.',
      }), {
        status: 402, // Payment Required
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // One-click confirm: set status=confirmed, payment_status=invoice_pending
    const confirmedAt = new Date().toISOString();

    // Create Trello card first (we need card ID)
    const trelloCardId = await createTrelloCard({ ...order, payment_status: 'invoice_pending' });

    const updatePayload = {
      status: 'confirmed',
      payment_status: 'invoice_pending',
      confirmed_at: confirmedAt,
      updated_at: confirmedAt,
    };
    if (trelloCardId) updatePayload.trello_card_id = trelloCardId;

    const { error: updateErr } = await supabase
      .from('dtf_orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Append status history
    await appendStatusHistory(
      supabase, orderId, order.status, 'confirmed',
      'customer', actor_id ?? null,
      { path: 'one_click', trello_card_id: trelloCardId }
    );

    // Emit admin notification
    await supabase.from('dtf_admin_notifications').insert({
      type: 'payment_received',
      order_id: orderId,
      payload: {
        order_id: orderId,
        customer_email: order.customer_email,
        payment_status: 'invoice_pending',
        path: 'one_click',
        quote_eur: order.quote_eur,
      },
    });

    return new Response(JSON.stringify({
      ok: true,
      orderId,
      status: 'confirmed',
      payment_status: 'invoice_pending',
      trello_card_id: trelloCardId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Path: stripe_success (called by Stripe webhook after checkout.session.completed) ──
  // This path is implemented in stripe-checkout-webhook.js
  // Forwarded here for idempotency logic:
  if (actionPath === 'stripe_success') {
    const { stripe_session_id, stripe_payment_intent } = body;

    if (!stripe_session_id) {
      return new Response(JSON.stringify({ error: 'stripe_session_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Idempotency check: already processed?
    if (order.payment_status === 'paid' && order.stripe_session_id === stripe_session_id) {
      return new Response(JSON.stringify({ ok: true, idempotent: true, orderId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const confirmedAt = order.confirmed_at ?? new Date().toISOString();
    const trelloCardId = order.trello_card_id ?? await createTrelloCard({ ...order, payment_status: 'paid' });

    const updatePayload = {
      status: 'confirmed',
      payment_status: 'paid',
      stripe_session_id,
      stripe_payment_intent: stripe_payment_intent ?? null,
      confirmed_at: confirmedAt,
      updated_at: new Date().toISOString(),
    };
    if (trelloCardId && !order.trello_card_id) updatePayload.trello_card_id = trelloCardId;

    const { error: updateErr } = await supabase
      .from('dtf_orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await appendStatusHistory(
      supabase, orderId, order.status, 'confirmed',
      'stripe_webhook', null,
      { stripe_session_id, stripe_payment_intent }
    );

    await supabase.from('dtf_admin_notifications').insert({
      type: 'payment_received',
      order_id: orderId,
      payload: {
        order_id: orderId,
        customer_email: order.customer_email,
        payment_status: 'paid',
        stripe_session_id,
        quote_eur: order.quote_eur,
      },
    });

    return new Response(JSON.stringify({
      ok: true,
      orderId,
      status: 'confirmed',
      payment_status: 'paid',
      trello_card_id: trelloCardId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: `Unknown path: ${actionPath}. Use one_click, admin_override, or stripe_success.` }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = { path: '/api/finalise-quote' };
