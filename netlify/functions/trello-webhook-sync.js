// Netlify Function: trello-webhook-sync
// Receives Trello webhook events (card moved between lists) and updates
// dtf_orders.status accordingly.
//
// Design §8.2 compliance:
//   1. resolveStatus() looks up dtf_trello_status_map table first; falls back
//      to hardcoded map only if table is empty.
//   2. On each successful status transition, inserts into dtf_order_status_history
//      with source='trello_webhook'.
//   3. On each successful status transition, inserts into dtf_admin_notifications
//      with type='trello_status_changed'.
//
// Trello setup:
//   Register webhook via Trello API:
//     POST https://api.trello.com/1/webhooks?key=KEY&token=TOKEN
//     Body: { idModel: <BOARD_ID>, callbackURL: <THIS_FUNCTION_URL>, description: "DTF Studio status sync" }
//   Trello sends HEAD first (verification) — return 200.
//   On card move: action type = "updateCard", data.listAfter.id changes.

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ── Hardcoded fallback map (list name → status) ────────────────────────────
// Used only if dtf_trello_status_map table has no active rows.
const FALLBACK_LIST_NAME_MAP = {
  'tilaus saapunut': 'new',
  'inbox':           'new',
  'ready':           'new',
  'suunnittelussa':  'in_design',
  'doing':           'in_design',
  'in progress':     'in_design',
  'in design':       'in_design',
  'tuotannossa':     'in_production',
  'production':      'in_production',
  'in production':   'in_production',
  'laadunvalvonta':  'in_production',
  'lähetetty':       'shipped',
  'shipped':         'shipped',
  'toimitettu':      'delivered',
  'done':            'delivered',
  'delivered':       'delivered',
  'peruttu':         'cancelled',
  'cancelled':       'cancelled',
};

// ── Load status map from Supabase ──────────────────────────────────────────
// Returns Map<listId, status> from dtf_trello_status_map.
// Returns empty Map if table has no active rows (triggers fallback).
async function loadStatusMapFromDB(supabase) {
  const { data, error } = await supabase
    .from('dtf_trello_status_map')
    .select('list_id, status')
    .eq('is_active', true);

  if (error) {
    console.warn('Failed to load dtf_trello_status_map:', error.message);
    return new Map();
  }

  const map = new Map();
  for (const row of (data || [])) {
    map.set(row.list_id, row.status);
  }
  return map;
}

// ── Resolve status ─────────────────────────────────────────────────────────
// Priority: DB table by list ID → env TRELLO_LIST_MAP by ID → fallback by name.
function resolveStatusFromMaps(listId, listName, dbMap, envIdMap) {
  // 1. DB table (design §8.2 primary path)
  if (dbMap.size > 0 && dbMap.has(listId)) {
    return dbMap.get(listId);
  }

  // 2. Env var ID map (runtime override for ad-hoc remapping)
  if (envIdMap && envIdMap[listId]) {
    return envIdMap[listId];
  }

  // 3. Fallback by list name (only if DB has no rows at all)
  if (dbMap.size === 0) {
    const normalized = (listName || '').trim().toLowerCase();
    return FALLBACK_LIST_NAME_MAP[normalized] || null;
  }

  return null;
}

// ── Trello webhook signature verification ──────────────────────────────────
function verifyTrelloSignature(body, callbackUrl, secret, signatureHeader) {
  if (!secret || !signatureHeader) return true; // skip if not configured
  const content = body + callbackUrl;
  const expected = crypto
    .createHmac('sha1', secret)
    .update(content)
    .digest('base64');
  return expected === signatureHeader;
}

// ── Handler (modern Netlify Functions v2 signature) ────────────────────────
export default async (req) => {
  // Trello sends HEAD (or GET) for webhook registration verification
  if (req.method === 'HEAD' || req.method === 'GET') {
    return new Response('OK', { status: 200 });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const SUPABASE_URL         = process.env.SUPABASE_URL         || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const TRELLO_SECRET        = process.env.TRELLO_WEBHOOK_SECRET;
  const CALLBACK_URL         = process.env.TRELLO_CALLBACK_URL;

  // Optionally parse env-provided list ID→status map (override/supplement)
  let envIdMap = null;
  try {
    if (process.env.TRELLO_LIST_MAP) {
      envIdMap = JSON.parse(process.env.TRELLO_LIST_MAP);
    }
  } catch {
    console.warn('Could not parse TRELLO_LIST_MAP env var');
  }

  // Read body text (needed for signature verification)
  const bodyText = await req.text();

  // Verify signature if configured
  const sig = req.headers.get('x-trello-webhook');
  if (TRELLO_SECRET && CALLBACK_URL && sig) {
    const valid = verifyTrelloSignature(bodyText, CALLBACK_URL, TRELLO_SECRET, sig);
    if (!valid) {
      console.warn('Trello signature mismatch');
      return new Response('Signature mismatch', { status: 401 });
    }
  }

  // Parse payload
  let payload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const action = payload?.action;

  // We only care about card moves
  if (action?.type !== 'updateCard') {
    return new Response('ignored', { status: 200 });
  }

  const listAfter    = action?.data?.listAfter;
  const card         = action?.data?.card;
  const trelloCardId = card?.id;
  const actionId     = action?.id;

  if (!listAfter || !trelloCardId) {
    return new Response('no list change', { status: 200 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('Supabase env vars missing — status sync skipped for card:', trelloCardId);
    return new Response('supabase-not-configured', { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Load status map from DB (design §8.2 — DB lookup is primary path)
  const dbMap = await loadStatusMapFromDB(supabase);

  const newStatus = resolveStatusFromMaps(listAfter.id, listAfter.name, dbMap, envIdMap);

  if (!newStatus) {
    console.log(`No status mapping for list "${listAfter.name}" (${listAfter.id}) — skipping`);
    return new Response('unmapped list', { status: 200 });
  }

  // Fetch current order to capture from_status before update
  const { data: orderRows, error: fetchErr } = await supabase
    .from('dtf_orders')
    .select('id, status, customer_email, quote_eur')
    .eq('trello_card_id', trelloCardId);

  if (fetchErr) {
    console.error('dtf_orders fetch error:', fetchErr);
    return new Response('DB fetch failed', { status: 500 });
  }

  if (!orderRows || orderRows.length === 0) {
    console.log(`No dtf_orders row found for trello_card_id=${trelloCardId}`);
    return new Response('no matching order', { status: 200 });
  }

  const updatedIds = [];

  for (const order of orderRows) {
    const fromStatus = order.status;
    const orderId    = order.id;

    // Skip if status hasn't changed (idempotency)
    if (fromStatus === newStatus) {
      console.log(`Order ${orderId} already at status "${newStatus}" — skipping`);
      continue;
    }

    // 1. Update dtf_orders.status
    const { error: updateErr } = await supabase
      .from('dtf_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateErr) {
      console.error(`dtf_orders update error for order ${orderId}:`, updateErr);
      continue;
    }

    // 2. Append dtf_order_status_history (design §8.2)
    const { error: histErr } = await supabase
      .from('dtf_order_status_history')
      .insert({
        order_id:    orderId,
        from_status: fromStatus,
        to_status:   newStatus,
        source:      'trello_webhook',
        actor_id:    null,
        metadata:    {
          trello_card_id: trelloCardId,
          list_id:        listAfter.id,
          list_name:      listAfter.name,
          action_id:      actionId,
        },
      });

    if (histErr) {
      console.error(`dtf_order_status_history insert error for order ${orderId}:`, histErr);
      // Non-fatal — continue to notifications
    }

    // 3. Insert dtf_admin_notifications (design §8.2)
    const { error: notifErr } = await supabase
      .from('dtf_admin_notifications')
      .insert({
        type:     'trello_status_changed',
        order_id: orderId,
        payload:  {
          from_status:     fromStatus,
          to_status:       newStatus,
          customer_email:  order.customer_email,
          quote_eur:       order.quote_eur,
          trello_card_id:  trelloCardId,
        },
      });

    if (notifErr) {
      console.error(`dtf_admin_notifications insert error for order ${orderId}:`, notifErr);
      // Non-fatal
    }

    updatedIds.push(orderId);
  }

  console.log(`Trello webhook: updated ${updatedIds.length} order(s) to "${newStatus}":`, updatedIds);

  return new Response(
    JSON.stringify({ updated: updatedIds.length, status: newStatus }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};

// ── Exports for unit testing ───────────────────────────────────────────────
export { resolveStatusFromMaps, loadStatusMapFromDB, FALLBACK_LIST_NAME_MAP };
