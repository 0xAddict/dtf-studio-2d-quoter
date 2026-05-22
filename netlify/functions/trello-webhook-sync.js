// Netlify Function: trello-webhook-sync
// Receives Trello webhook events (card moved between lists) and updates
// dtf_orders.status accordingly.
//
// Trello setup (document these in evidence/trello-webhook.md):
//   1. Register webhook via Trello API:
//      POST https://api.trello.com/1/webhooks?key=KEY&token=TOKEN
//      Body: { idModel: <BOARD_ID>, callbackURL: <THIS_FUNCTION_URL>, description: "DTF Studio status sync" }
//   2. Trello sends HEAD first (verification) — return 200.
//   3. On card move: action type = "updateCard", data.listAfter.id changes.
//
// List → Status mapping (configure TRELLO_LIST_MAP env var as JSON):
//   { "<listId>": "new", "<listId2>": "in_design", ... }
// Fallback hard-coded map is also present below — override via env.

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ── Status mapping ─────────────────────────────────────────────────────────
// Trello list name → dtf_orders status value
const DEFAULT_LIST_NAME_MAP = {
  'inbox':         'new',
  'ready':         'new',
  'doing':         'in_design',
  'in progress':   'in_design',
  'in design':     'in_design',
  'production':    'in_production',
  'in production': 'in_production',
  'shipped':       'shipped',
  'done':          'delivered',
  'delivered':     'delivered',
  'cancelled':     'cancelled',
  'peruutettu':    'cancelled',
};

function resolveStatus(listName, listIdMap) {
  // Try ID map first (most reliable)
  if (listIdMap) {
    for (const [id, status] of Object.entries(listIdMap)) {
      if (id === listName) return status;
    }
  }
  // Fall back to name-based lookup
  const normalized = listName.trim().toLowerCase();
  return DEFAULT_LIST_NAME_MAP[normalized] || null;
}

// ── Trello webhook signature verification ─────────────────────────────────
function verifyTrelloSignature(body, callbackUrl, secret, signatureHeader) {
  if (!secret || !signatureHeader) return true; // skip if not configured
  const content = body + callbackUrl;
  const expected = crypto
    .createHmac('sha1', secret)
    .update(content)
    .digest('base64');
  return expected === signatureHeader;
}

// ── Handler ────────────────────────────────────────────────────────────────

export const handler = async (event) => {
  // Trello sends HEAD (or GET) for webhook registration verification
  if (event.httpMethod === 'HEAD' || event.httpMethod === 'GET') {
    return { statusCode: 200, body: 'OK' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SUPABASE_URL         = process.env.SUPABASE_URL         || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const TRELLO_SECRET        = process.env.TRELLO_WEBHOOK_SECRET; // optional signing secret
  const CALLBACK_URL         = process.env.TRELLO_CALLBACK_URL;   // this function's own URL

  // Optionally parse env-provided list ID→status map
  let listIdMap = null;
  try {
    if (process.env.TRELLO_LIST_MAP) {
      listIdMap = JSON.parse(process.env.TRELLO_LIST_MAP);
    }
  } catch {
    console.warn('Could not parse TRELLO_LIST_MAP');
  }

  // Verify signature if configured
  const sig = event.headers['x-trello-webhook'];
  if (TRELLO_SECRET && CALLBACK_URL && sig) {
    const valid = verifyTrelloSignature(event.body || '', CALLBACK_URL, TRELLO_SECRET, sig);
    if (!valid) {
      console.warn('Trello signature mismatch');
      return { statusCode: 401, body: 'Signature mismatch' };
    }
  }

  // Parse payload
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const action = payload?.action;

  // We only care about card moves
  if (action?.type !== 'updateCard') {
    return { statusCode: 200, body: 'ignored' };
  }

  const listAfter  = action?.data?.listAfter;
  const card       = action?.data?.card;
  const trelloCardId = card?.id;

  if (!listAfter || !trelloCardId) {
    return { statusCode: 200, body: 'no list change' };
  }

  // Resolve target status
  const newStatus = resolveStatus(listAfter.id, listIdMap)
    ?? resolveStatus(listAfter.name, null);

  if (!newStatus) {
    console.log(`No status mapping for list "${listAfter.name}" (${listAfter.id}) — skipping`);
    return { statusCode: 200, body: 'unmapped list' };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    // Return 200 so Trello doesn't retry — log warning for observability
    console.warn('Supabase env vars missing — status sync skipped for card:', trelloCardId, '→', newStatus);
    return { statusCode: 200, body: 'supabase-not-configured' };
  }

  // Update dtf_orders where trello_card_id matches
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data, error } = await supabase
    .from('dtf_orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('trello_card_id', trelloCardId)
    .select('id, status');

  if (error) {
    console.error('dtf_orders status update error:', error);
    return { statusCode: 500, body: 'DB update failed' };
  }

  if (!data || data.length === 0) {
    console.log(`No dtf_orders row found for trello_card_id=${trelloCardId}`);
    return { statusCode: 200, body: 'no matching order' };
  }

  console.log(`Updated ${data.length} order(s) to status "${newStatus}":`, data.map(r => r.id));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updated: data.length, status: newStatus }),
  };
};
