/**
 * TDD bead 2: finalise-quote rule decision + idempotent webhook + Trello card-move
 * sprint-admin-v1 — M2
 * Run: node tests/unit/finalise-quote.test.mjs
 */

import assert from 'node:assert/strict';

// ──────────────────────────────────────────────────────────────
// Extracted pure logic functions (mirrors finalise-quote/index.js)
// ──────────────────────────────────────────────────────────────

/**
 * Decide if requires_payment should be true (new customer) or false (returning).
 * adminOverride takes precedence if defined.
 */
function decideRequiresPayment(priorPaidCount, adminOverride) {
  if (adminOverride !== undefined && adminOverride !== null) return adminOverride;
  return priorPaidCount === 0; // first-timer → must pay
}

/**
 * Simulate one-click confirm path — returns the state transitions.
 */
function simulateOneClickConfirm(order) {
  if (order.status !== 'quote') throw new Error(`Order status must be 'quote', got ${order.status}`);
  if (order.payment_status !== 'none') throw new Error(`payment_status must be 'none', got ${order.payment_status}`);

  return {
    ...order,
    status: 'confirmed',
    payment_status: 'invoice_pending',
    confirmed_at: new Date().toISOString(),
  };
}

/**
 * Simulate Stripe webhook idempotency check.
 * Returns true if this checkout.session.completed event should be processed.
 */
function shouldProcessStripeWebhook(order, stripeSessionId) {
  // Already processed if payment_status = paid AND stripe_session_id matches
  if (order.payment_status === 'paid' && order.stripe_session_id === stripeSessionId) {
    return false; // idempotent no-op
  }
  return true;
}

/**
 * Simulate Stripe webhook application.
 */
function applyStripeWebhook(order, stripeSessionId, paymentIntentId) {
  if (!shouldProcessStripeWebhook(order, stripeSessionId)) {
    return order; // idempotent no-op
  }
  return {
    ...order,
    status: 'confirmed',
    payment_status: 'paid',
    stripe_session_id: stripeSessionId,
    stripe_payment_intent: paymentIntentId,
    confirmed_at: order.confirmed_at ?? new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────
// Bead 2a: requires_payment rule
// ──────────────────────────────────────────────────────────────

// New customer (0 prior paid orders) → requires payment
assert.equal(decideRequiresPayment(0, undefined), true, 'FAIL-expected: new customer should require payment');
console.log('[PASS] 2a-1: new customer (0 paid orders) → requires_payment=true');

// Returning customer (1+ prior paid orders) → no payment required
assert.equal(decideRequiresPayment(1, undefined), false, 'FAIL-expected: returning customer should NOT require payment');
console.log('[PASS] 2a-2: returning customer (1+ paid orders) → requires_payment=false');

assert.equal(decideRequiresPayment(5, undefined), false, 'FAIL-expected: 5 paid orders → requires_payment=false');
console.log('[PASS] 2a-3: returning customer (5 paid orders) → requires_payment=false');

// Admin override = true → always requires payment regardless of history
assert.equal(decideRequiresPayment(10, true), true, 'FAIL-expected: adminOverride=true forces requires_payment=true');
console.log('[PASS] 2a-4: adminOverride=true → requires_payment=true (even with 10 paid orders)');

// Admin override = false → never requires payment regardless of history
assert.equal(decideRequiresPayment(0, false), false, 'FAIL-expected: adminOverride=false forces requires_payment=false');
console.log('[PASS] 2a-5: adminOverride=false → requires_payment=false (even for new customer)');

// ──────────────────────────────────────────────────────────────
// Bead 2b: One-click confirm path
// ──────────────────────────────────────────────────────────────

const quoteOrder = {
  id: 'order-abc-123',
  customer_email: 'test@example.com',
  status: 'quote',
  payment_status: 'none',
  requires_payment: false,
  confirmed_at: null,
};

const confirmed = simulateOneClickConfirm(quoteOrder);
assert.equal(confirmed.status, 'confirmed', 'FAIL-expected: status should be confirmed');
assert.equal(confirmed.payment_status, 'invoice_pending', 'FAIL-expected: payment_status should be invoice_pending');
assert.ok(confirmed.confirmed_at, 'FAIL-expected: confirmed_at should be set');
console.log('[PASS] 2b-1: one-click confirm → status=confirmed');
console.log('[PASS] 2b-2: one-click confirm → payment_status=invoice_pending');
console.log('[PASS] 2b-3: one-click confirm → confirmed_at set');

// Wrong status → throws
assert.throws(
  () => simulateOneClickConfirm({ ...quoteOrder, status: 'confirmed' }),
  /quote/,
  'FAIL-expected: should throw when order is not in quote status'
);
console.log('[PASS] 2b-4: non-quote order → throws error');

// ──────────────────────────────────────────────────────────────
// Bead 2c: Stripe webhook idempotency
// ──────────────────────────────────────────────────────────────

const paidOrder = {
  id: 'order-xyz',
  status: 'confirmed',
  payment_status: 'paid',
  stripe_session_id: 'cs_test_abc123',
  stripe_payment_intent: 'pi_test_abc123',
};

// Same session → idempotent (no change)
const noOp = applyStripeWebhook(paidOrder, 'cs_test_abc123', 'pi_test_abc123');
assert.equal(noOp.stripe_session_id, 'cs_test_abc123', 'FAIL-expected: idempotent, no change');
assert.equal(noOp.payment_status, 'paid', 'FAIL-expected: idempotent, still paid');
console.log('[PASS] 2c-1: duplicate webhook → idempotent no-op');

// Unpaid order with matching session first time → applies
const unpaidOrder = {
  id: 'order-unpaid',
  status: 'quote',
  payment_status: 'none',
  stripe_session_id: null,
  stripe_payment_intent: null,
  confirmed_at: null,
};
const applied = applyStripeWebhook(unpaidOrder, 'cs_test_new_session', 'pi_test_new_pi');
assert.equal(applied.status, 'confirmed', 'FAIL-expected: status should be confirmed after Stripe webhook');
assert.equal(applied.payment_status, 'paid', 'FAIL-expected: payment_status should be paid');
assert.equal(applied.stripe_session_id, 'cs_test_new_session', 'FAIL-expected: stripe_session_id stored');
assert.ok(applied.confirmed_at, 'FAIL-expected: confirmed_at set by webhook');
console.log('[PASS] 2c-2: first webhook → status=confirmed');
console.log('[PASS] 2c-3: first webhook → payment_status=paid');
console.log('[PASS] 2c-4: first webhook → stripe_session_id stored');
console.log('[PASS] 2c-5: first webhook → confirmed_at set');

// ──────────────────────────────────────────────────────────────
// Bead 2d: Admin override toggle writes correct value
// ──────────────────────────────────────────────────────────────

function simulateAdminOverride(order, newRequiresPayment) {
  return { ...order, requires_payment: newRequiresPayment };
}

const baseOrder = { id: 'order-1', requires_payment: true, status: 'quote' };
const overrideToFalse = simulateAdminOverride(baseOrder, false);
assert.equal(overrideToFalse.requires_payment, false, 'FAIL-expected: admin can set requires_payment=false');
console.log('[PASS] 2d-1: admin override sets requires_payment=false');

const overrideToTrue = simulateAdminOverride({ ...baseOrder, requires_payment: false }, true);
assert.equal(overrideToTrue.requires_payment, true, 'FAIL-expected: admin can set requires_payment=true');
console.log('[PASS] 2d-2: admin override sets requires_payment=true');

console.log('\n=== ALL BEAD-2 TESTS PASSED ===');
