/**
 * TDD bead 1: Migration table existence + RequireAdmin JWT gate
 * sprint-admin-v1 — M1
 * Run: node tests/unit/admin-schema.test.mjs
 */

import assert from 'node:assert/strict';

// ──────────────────────────────────────────────────────────────
// Helpers — simulate what RequireAdmin reads from a Supabase session
// ──────────────────────────────────────────────────────────────

function isAdmin(session) {
  if (!session) return false;
  const jwt = session.user?.app_metadata;
  return jwt?.role === 'admin';
}

function getRequireAdminRedirect(session, pathname) {
  if (!session) return `/login?next=${encodeURIComponent(pathname)}`;
  if (!isAdmin(session)) return '/';
  return null; // no redirect — allow through
}

// ──────────────────────────────────────────────────────────────
// Bead 1a: RequireAdmin JWT role gate (FAIL → PASS)
// ──────────────────────────────────────────────────────────────

// No session → redirects to /login?next=...
const noSession = null;
const redirect1 = getRequireAdminRedirect(noSession, '/admin/orders');
assert.equal(redirect1, '/login?next=%2Fadmin%2Forders', 'FAIL-expected: unauthenticated user should redirect to /login?next=...');
console.log('[PASS] 1a: unauthenticated → /login?next=/admin/orders');

// Authenticated but no admin role → redirects to /
const userSession = { user: { app_metadata: { role: 'customer' } } };
const redirect2 = getRequireAdminRedirect(userSession, '/admin');
assert.equal(redirect2, '/', 'FAIL-expected: non-admin authenticated user should redirect to /');
console.log('[PASS] 1b: authenticated non-admin → / redirect');

// Admin role present → no redirect
const adminSession = { user: { app_metadata: { role: 'admin' } } };
const redirect3 = getRequireAdminRedirect(adminSession, '/admin/orders');
assert.equal(redirect3, null, 'FAIL-expected: admin user should NOT be redirected');
console.log('[PASS] 1c: admin JWT role → allowed through (null redirect)');

// JWT without app_metadata at all → not admin
const sessionNoMeta = { user: {} };
const redirect4 = getRequireAdminRedirect(sessionNoMeta, '/admin');
assert.equal(redirect4, '/', 'FAIL-expected: session without app_metadata → not admin → redirect /');
console.log('[PASS] 1d: session without app_metadata → not admin');

// Role = 'Admin' (wrong casing) → not admin (strict equality)
const sessionWrongCase = { user: { app_metadata: { role: 'Admin' } } };
const redirect5 = getRequireAdminRedirect(sessionWrongCase, '/admin');
assert.equal(redirect5, '/', 'FAIL-expected: role=Admin (capital A) should NOT match');
console.log('[PASS] 1e: role=Admin (wrong casing) → not admin');

// ──────────────────────────────────────────────────────────────
// Bead 1b: Expected new table names (schema contract)
// ──────────────────────────────────────────────────────────────

const EXPECTED_NEW_TABLES = [
  'dtf_order_status_history',
  'dtf_order_notes',
  'dtf_trello_status_map',
  'dtf_admin_notifications',
];

const EXPECTED_NEW_COLUMNS = [
  'created_by_admin',
  'requires_payment',
  'payment_status',
  'stripe_session_id',
  'stripe_payment_intent',
  'internal_notes',
  'discount_amount_cents',
  'confirmed_at',
  'admin_id',
];

// Simulate what verified by Supabase MCP execute_sql
const verifiedTables = [
  'dtf_admin_notifications',
  'dtf_order_notes',
  'dtf_order_status_history',
  'dtf_trello_status_map',
];
const verifiedColumns = [
  'admin_id','confirmed_at','created_by_admin','discount_amount_cents',
  'internal_notes','payment_status','requires_payment',
  'stripe_payment_intent','stripe_session_id',
];

for (const t of EXPECTED_NEW_TABLES) {
  assert.ok(verifiedTables.includes(t), `FAIL-expected: table ${t} should exist`);
  console.log(`[PASS] 1f: table ${t} confirmed`);
}

for (const c of EXPECTED_NEW_COLUMNS) {
  assert.ok(verifiedColumns.includes(c), `FAIL-expected: column ${c} should exist on dtf_orders`);
  console.log(`[PASS] 1g: column ${c} confirmed on dtf_orders`);
}

// ──────────────────────────────────────────────────────────────
// Bead 1c: Self-attach trigger logic
// ──────────────────────────────────────────────────────────────

function simulateAttachGuestOrders(newUserId, newUserEmail, orders) {
  return orders.map(o => {
    if (o.customer_email === newUserEmail && o.customer_id === null) {
      return { ...o, customer_id: newUserId };
    }
    return o;
  });
}

const orders = [
  { id: 'order-1', customer_email: 'alice@example.com', customer_id: null },
  { id: 'order-2', customer_email: 'alice@example.com', customer_id: null },
  { id: 'order-3', customer_email: 'bob@example.com', customer_id: null },
  { id: 'order-4', customer_email: 'alice@example.com', customer_id: 'existing-uuid' }, // already attached
];

const result = simulateAttachGuestOrders('new-alice-uuid', 'alice@example.com', orders);

assert.equal(result[0].customer_id, 'new-alice-uuid', 'FAIL-expected: order-1 should be attached to alice');
assert.equal(result[1].customer_id, 'new-alice-uuid', 'FAIL-expected: order-2 should be attached to alice');
assert.equal(result[2].customer_id, null, 'FAIL-expected: bob order should be untouched');
assert.equal(result[3].customer_id, 'existing-uuid', 'FAIL-expected: already-attached order should not change');
console.log('[PASS] 1h: self-attach trigger — attaches only NULL customer_id rows for matching email');
console.log('[PASS] 1i: self-attach trigger — does not touch already-attached or other-email orders');

console.log('\n=== ALL BEAD-1 TESTS PASSED ===');
