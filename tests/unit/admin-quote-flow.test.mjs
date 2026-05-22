/**
 * TDD bead 3: Admin quote flows
 * sprint-admin-v1 — M3
 * Tests: admin mode extra fields written correctly, both flows produce correct rows.
 * Run: node tests/unit/admin-quote-flow.test.mjs
 */

import assert from 'node:assert/strict';

// ──────────────────────────────────────────────────────────────
// Pure logic: buildAdminOrderInsert
// Mirrors the logic in AdminNewQuotePage.tsx and DTFQuoter admin mode.
// ──────────────────────────────────────────────────────────────

function buildAdminOrderInsert({
  customerEmail,
  customerName = null,
  quoteEur,
  sheetCount,
  material = null,
  sizeCm = null,
  notes = null,
  internalNotes = null,
  discountAmountCents = 0,
  adminId,
  assignToEmail = null,
}) {
  if (!customerEmail) throw new Error('customerEmail required');
  if (!quoteEur || quoteEur <= 0) throw new Error('quoteEur must be positive');
  if (!sheetCount || sheetCount < 1) throw new Error('sheetCount must be >= 1');
  if (!adminId) throw new Error('adminId required for admin quote');

  return {
    customer_email: assignToEmail ?? customerEmail,
    customer_name: customerName,
    quote_eur: quoteEur,
    sheet_count: sheetCount,
    material,
    size_cm: sizeCm,
    notes,
    internal_notes: internalNotes,
    discount_amount_cents: discountAmountCents,
    admin_id: adminId,
    created_by_admin: true,
    status: 'quote',
    payment_status: 'none',
    requires_payment: true, // default — rule applied on finalise
  };
}

// ──────────────────────────────────────────────────────────────
// Bead 3a: canvas admin mode extra fields
// ──────────────────────────────────────────────────────────────

const baseParams = {
  customerEmail: 'admin@dtfstudio.fi',
  quoteEur: 48.50,
  sheetCount: 3,
  adminId: 'admin-uuid-123',
};

// Basic admin insert has created_by_admin=true
const row = buildAdminOrderInsert(baseParams);
assert.equal(row.created_by_admin, true, 'FAIL-expected: created_by_admin must be true');
console.log('[PASS] 3a-1: created_by_admin=true on admin insert');

// status must be quote, payment_status must be none
assert.equal(row.status, 'quote', 'FAIL-expected: status=quote');
assert.equal(row.payment_status, 'none', 'FAIL-expected: payment_status=none');
console.log('[PASS] 3a-2: status=quote on admin insert');
console.log('[PASS] 3a-3: payment_status=none on admin insert');

// admin_id is set
assert.equal(row.admin_id, 'admin-uuid-123', 'FAIL-expected: admin_id stored');
console.log('[PASS] 3a-4: admin_id stored');

// ──────────────────────────────────────────────────────────────
// Bead 3b: assign-to-email field
// ──────────────────────────────────────────────────────────────

const assignRow = buildAdminOrderInsert({
  ...baseParams,
  assignToEmail: 'customer@example.com',
});
assert.equal(assignRow.customer_email, 'customer@example.com', 'FAIL-expected: customer_email = assignToEmail');
console.log('[PASS] 3b-1: assign-to-email overrides customer_email');

// Without assignToEmail, uses customerEmail
const noAssignRow = buildAdminOrderInsert({ ...baseParams });
assert.equal(noAssignRow.customer_email, 'admin@dtfstudio.fi', 'FAIL-expected: falls back to customerEmail');
console.log('[PASS] 3b-2: no assign-to-email → uses customerEmail');

// ──────────────────────────────────────────────────────────────
// Bead 3c: internal_notes + discount_amount_cents
// ──────────────────────────────────────────────────────────────

const richRow = buildAdminOrderInsert({
  ...baseParams,
  internalNotes: 'Asiakas soitti — lisää rush-maksu',
  discountAmountCents: 500, // 5€ alennus
});
assert.equal(richRow.internal_notes, 'Asiakas soitti — lisää rush-maksu', 'FAIL-expected: internal_notes stored');
assert.equal(richRow.discount_amount_cents, 500, 'FAIL-expected: discount_amount_cents stored');
console.log('[PASS] 3c-1: internal_notes stored');
console.log('[PASS] 3c-2: discount_amount_cents stored');

// ──────────────────────────────────────────────────────────────
// Bead 3d: validation — missing required fields throw
// ──────────────────────────────────────────────────────────────

assert.throws(
  () => buildAdminOrderInsert({ ...baseParams, customerEmail: '' }),
  /customerEmail required/,
  'FAIL-expected: empty customerEmail should throw'
);
console.log('[PASS] 3d-1: empty customerEmail → throws');

assert.throws(
  () => buildAdminOrderInsert({ ...baseParams, quoteEur: 0 }),
  /quoteEur must be positive/,
  'FAIL-expected: zero quoteEur should throw'
);
console.log('[PASS] 3d-2: zero quoteEur → throws');

assert.throws(
  () => buildAdminOrderInsert({ ...baseParams, adminId: undefined }),
  /adminId required/,
  'FAIL-expected: missing adminId should throw'
);
console.log('[PASS] 3d-3: missing adminId → throws');

// ──────────────────────────────────────────────────────────────
// Bead 3e: phone order form (stripped — no canvas)
// Same insert path, just no sizeCm/gangSheetUrl
// ──────────────────────────────────────────────────────────────

function buildPhoneOrderInsert(params) {
  return buildAdminOrderInsert({ ...params, sizeCm: null });
}

const phoneRow = buildPhoneOrderInsert({
  customerEmail: 'tero@example.com',
  quoteEur: 100.00,
  sheetCount: 5,
  adminId: 'admin-uuid-123',
  internalNotes: 'Puhelintilaus 10:15',
});
assert.equal(phoneRow.created_by_admin, true, 'FAIL-expected: phone order has created_by_admin=true');
assert.equal(phoneRow.size_cm, null, 'FAIL-expected: phone order has no size_cm');
assert.ok(phoneRow.internal_notes?.includes('Puhelintilaus'), 'FAIL-expected: internal_notes stored');
console.log('[PASS] 3e-1: phone order → created_by_admin=true');
console.log('[PASS] 3e-2: phone order → size_cm=null (no canvas)');
console.log('[PASS] 3e-3: phone order → internal_notes stored');

console.log('\n=== ALL BEAD-3 TESTS PASSED ===');
