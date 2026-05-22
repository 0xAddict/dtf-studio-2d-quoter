/**
 * TDD bead 5: Customer LTV aggregation, file pagination+search, notification mark-read
 * sprint-admin-v1 — M5
 * Run: node tests/unit/admin-customers-files.test.mjs
 */

import assert from 'node:assert/strict';

// ──────────────────────────────────────────────────────────────
// Bead 5a: Customer LTV aggregation
// ──────────────────────────────────────────────────────────────

function computeCustomerLTV(orders) {
  const map = new Map();
  for (const o of orders) {
    if (!map.has(o.customer_email)) {
      map.set(o.customer_email, {
        email: o.customer_email,
        totalOrders: 0,
        ltv: 0,
        lastOrderDate: null,
        lastOrderStatus: null,
      });
    }
    const rec = map.get(o.customer_email);
    rec.totalOrders++;
    if (o.payment_status === 'paid') {
      rec.ltv += Number(o.quote_eur);
    }
    if (!rec.lastOrderDate || new Date(o.created_at) > new Date(rec.lastOrderDate)) {
      rec.lastOrderDate = o.created_at;
      rec.lastOrderStatus = o.status;
    }
  }
  // Sort by LTV desc
  return Array.from(map.values()).sort((a, b) => b.ltv - a.ltv);
}

const ORDERS = [
  { id: '1', customer_email: 'alice@ex.com', payment_status: 'paid', quote_eur: 48, created_at: '2026-05-01T10:00:00Z', status: 'delivered' },
  { id: '2', customer_email: 'alice@ex.com', payment_status: 'paid', quote_eur: 95, created_at: '2026-05-10T10:00:00Z', status: 'shipped' },
  { id: '3', customer_email: 'alice@ex.com', payment_status: 'none', quote_eur: 30, created_at: '2026-05-15T10:00:00Z', status: 'quote' },
  { id: '4', customer_email: 'bob@ex.com', payment_status: 'paid', quote_eur: 200, created_at: '2026-04-01T10:00:00Z', status: 'delivered' },
  { id: '5', customer_email: 'charlie@ex.com', payment_status: 'invoice_pending', quote_eur: 60, created_at: '2026-05-20T10:00:00Z', status: 'confirmed' },
];

const ltv = computeCustomerLTV(ORDERS);

assert.equal(ltv.length, 3, 'FAIL-expected: 3 distinct customers');
console.log('[PASS] 5a-1: 3 distinct customers');

// alice has LTV = 48+95 = 143 (only paid orders)
const alice = ltv.find(c => c.email === 'alice@ex.com');
assert.equal(alice.ltv, 143, 'FAIL-expected: alice LTV = 143');
assert.equal(alice.totalOrders, 3, 'FAIL-expected: alice total orders = 3');
console.log('[PASS] 5a-2: alice LTV=143 (paid only)');
console.log('[PASS] 5a-3: alice totalOrders=3 (all orders)');

// alice's last order is the most recent
assert.equal(alice.lastOrderDate, '2026-05-15T10:00:00Z', 'FAIL-expected: alice last order date');
assert.equal(alice.lastOrderStatus, 'quote', 'FAIL-expected: alice last order status = quote');
console.log('[PASS] 5a-4: alice lastOrderDate correct');
console.log('[PASS] 5a-5: alice lastOrderStatus=quote');

// bob has LTV = 200, sorted first
assert.equal(ltv[0].email, 'bob@ex.com', 'FAIL-expected: bob sorted first by LTV');
assert.equal(ltv[0].ltv, 200, 'FAIL-expected: bob LTV=200');
console.log('[PASS] 5a-6: bob sorted first (LTV=200 > alice 143)');

// charlie has no paid orders → LTV=0
const charlie = ltv.find(c => c.email === 'charlie@ex.com');
assert.equal(charlie.ltv, 0, 'FAIL-expected: charlie LTV=0 (invoice_pending not paid)');
console.log('[PASS] 5a-7: charlie LTV=0 (invoice_pending not counted)');

// ──────────────────────────────────────────────────────────────
// Bead 5b: File browser pagination + search
// ──────────────────────────────────────────────────────────────

function buildFileIndex(orders) {
  const files = [];
  for (const o of orders) {
    const fileList = o.files ?? [];
    for (const f of fileList) {
      files.push({ orderId: o.id, customerEmail: o.customer_email, ...f });
    }
  }
  return files;
}

function filterFiles(files, { search, customerEmail, page = 1, pageSize = 20 }) {
  let filtered = [...files];
  if (customerEmail) {
    filtered = filtered.filter(f => f.customerEmail === customerEmail);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.customerEmail.toLowerCase().includes(q) ||
      f.orderId.toLowerCase().includes(q)
    );
  }
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  return { data: filtered.slice(start, start + pageSize), total };
}

const ORDERS_WITH_FILES = [
  { id: 'ord-1', customer_email: 'alice@ex.com', files: [{ name: 'design-1.png', url: 'https://cdn/1.png' }, { name: 'design-2.png', url: 'https://cdn/2.png' }] },
  { id: 'ord-2', customer_email: 'bob@ex.com', files: [{ name: 'logo.png', url: 'https://cdn/3.png' }] },
  { id: 'ord-3', customer_email: 'alice@ex.com', files: [{ name: 'banner.svg', url: 'https://cdn/4.svg' }] },
];

const allFiles = buildFileIndex(ORDERS_WITH_FILES);
assert.equal(allFiles.length, 4, 'FAIL-expected: 4 total files');
console.log('[PASS] 5b-1: buildFileIndex returns 4 files');

// Search by filename
const pngFiles = filterFiles(allFiles, { search: 'png' });
assert.equal(pngFiles.data.length, 3, 'FAIL-expected: 3 .png files');
assert.equal(pngFiles.total, 3, 'FAIL-expected: total=3');
console.log('[PASS] 5b-2: search by .png → 3 results');

// Filter by customer
const aliceFiles = filterFiles(allFiles, { customerEmail: 'alice@ex.com' });
assert.equal(aliceFiles.data.length, 3, 'FAIL-expected: 3 files for alice');
console.log('[PASS] 5b-3: customer filter → alice has 3 files');

// Pagination
const manyFiles = Array.from({ length: 55 }, (_, i) => ({
  orderId: `ord-${i}`, customerEmail: 'c@ex.com', name: `file-${i}.png`, url: `https://cdn/${i}.png`,
}));
const page1 = filterFiles(manyFiles, { page: 1, pageSize: 20 });
assert.equal(page1.data.length, 20, 'FAIL-expected: 20 per page');
assert.equal(page1.total, 55, 'FAIL-expected: total=55');

const page3 = filterFiles(manyFiles, { page: 3, pageSize: 20 });
assert.equal(page3.data.length, 15, 'FAIL-expected: page 3 has 15 remaining');
console.log('[PASS] 5b-4: file pagination 20/page');
console.log('[PASS] 5b-5: file pagination page 3 → 15 remaining');

// ──────────────────────────────────────────────────────────────
// Bead 5c: Notification mark-read flow
// ──────────────────────────────────────────────────────────────

function markNotificationRead(notifications, id, readAt) {
  return notifications.map(n => n.id === id ? { ...n, read_at: readAt } : n);
}

function markAllRead(notifications, readAt) {
  return notifications.map(n => n.read_at ? n : { ...n, read_at: readAt });
}

function countUnread(notifications) {
  return notifications.filter(n => !n.read_at).length;
}

const NOTIFS = [
  { id: 1, type: 'new_quote', read_at: null, created_at: '2026-05-22T10:00:00Z' },
  { id: 2, type: 'payment_received', read_at: null, created_at: '2026-05-22T09:00:00Z' },
  { id: 3, type: 'trello_status_changed', read_at: '2026-05-22T08:00:00Z', created_at: '2026-05-22T07:00:00Z' },
];

assert.equal(countUnread(NOTIFS), 2, 'FAIL-expected: 2 unread');
console.log('[PASS] 5c-1: countUnread=2');

const afterMark = markNotificationRead(NOTIFS, 1, '2026-05-22T11:00:00Z');
assert.equal(afterMark[0].read_at, '2026-05-22T11:00:00Z', 'FAIL-expected: notification 1 marked read');
assert.equal(afterMark[1].read_at, null, 'FAIL-expected: notification 2 still unread');
console.log('[PASS] 5c-2: mark single notification read');
console.log('[PASS] 5c-3: other notifications unaffected');

const afterMarkAll = markAllRead(NOTIFS, '2026-05-22T11:00:00Z');
assert.equal(countUnread(afterMarkAll), 0, 'FAIL-expected: 0 unread after mark all');
// Previously read notification (id=3) read_at unchanged
assert.equal(afterMarkAll[2].read_at, '2026-05-22T08:00:00Z', 'FAIL-expected: already-read notification read_at unchanged');
console.log('[PASS] 5c-4: mark-all-read → 0 unread');
console.log('[PASS] 5c-5: already-read notifications read_at unchanged');

console.log('\n=== ALL BEAD-5 TESTS PASSED ===');
