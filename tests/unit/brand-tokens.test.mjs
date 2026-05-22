/**
 * TDD: brand-tokens — Static file analysis
 * These tests validate brand token presence/absence in source files.
 * They FAIL if old Hexea dark-mode classes remain.
 *
 * Bead: brand-tokens
 */
import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`FAIL: ${name} — ${e.message}`);
    failed++;
  }
}

// ── Test 1: Q1.1 — logo.png exists ────────────────────────────────────────
runTest('Q1.1 — public/brand/logo.png exists', () => {
  const logoPath = path.join(ROOT, 'public/brand/logo.png');
  assert.ok(fs.existsSync(logoPath), `logo.png not found at ${logoPath}`);
  const stat = fs.statSync(logoPath);
  assert.ok(stat.size > 10000, `logo.png too small (${stat.size} bytes) — copy failed?`);
});

// ── Test 2: Q1.2 — AccountPage has no dark-mode slate/indigo ──────────────
runTest('Q1.2 — AccountPage: no bg-slate-9xx or bg-gradient or glass', () => {
  const src = readFile('components/AccountPage.tsx');
  assert.ok(!src.includes('bg-slate-950'), 'AccountPage should not have bg-slate-950');
  assert.ok(!src.includes('bg-slate-900'), 'AccountPage should not have bg-slate-900');
  assert.ok(!src.includes('dark:from-slate-9'), 'AccountPage should not have dark:from-slate-9xx');
  assert.ok(!src.includes('bg-gradient-to-b from-gray'), 'AccountPage should not have gray gradient bg');
  assert.ok(!src.includes('class="glass'), 'AccountPage should not use glassmorphism .glass');
});

// ── Test 3: Q1.3 — AccountPage has brand tokens ───────────────────────────
runTest('Q1.3 — AccountPage: has manila/ink/crimson brand tokens', () => {
  const src = readFile('components/AccountPage.tsx');
  // Should use CSS variables or brand classes
  const hasManila = src.includes('--paper') || src.includes('#f4e4bc') || src.includes('paper');
  const hasInk = src.includes('--ink') || src.includes('#1a1a1a') || src.includes('var(--ink)');
  assert.ok(hasManila || hasInk, 'AccountPage should reference brand tokens (--paper or --ink)');
});

// ── Test 4: Q1.2 — OrderDetailPage has no dark slate/indigo ──────────────
runTest('Q1.2 — OrderDetailPage: no bg-slate-9xx or bg-gradient or glass', () => {
  const src = readFile('components/OrderDetailPage.tsx');
  assert.ok(!src.includes('bg-slate-950'), 'OrderDetailPage should not have bg-slate-950');
  assert.ok(!src.includes('bg-slate-900'), 'OrderDetailPage should not have bg-slate-900');
  assert.ok(!src.includes('dark:from-slate-9'), 'OrderDetailPage should not have dark:from-slate-9xx');
  assert.ok(!src.includes('bg-gradient-to-b from-gray'), 'OrderDetailPage should not have gray gradient');
  assert.ok(!src.includes('class="glass'), 'OrderDetailPage should not use glassmorphism');
});

// ── Test 5: Q1.5 — No purple/indigo gradients in main pages ──────────────
runTest('Q1.5 — No indigo/purple gradients in AccountPage or OrderDetailPage', () => {
  const account = readFile('components/AccountPage.tsx');
  const orderDetail = readFile('components/OrderDetailPage.tsx');
  for (const [name, src] of [['AccountPage', account], ['OrderDetailPage', orderDetail]]) {
    assert.ok(!src.includes('from-indigo-'), `${name}: should not have from-indigo-`);
    assert.ok(!src.includes('to-indigo-'), `${name}: should not have to-indigo-`);
    assert.ok(!src.includes('bg-indigo-'), `${name}: should not have bg-indigo-`);
    assert.ok(!src.includes('rounded-full'), `${name}: should not have rounded-full`);
  }
});

// ── Test 6: Q2.1 — send-quote.js email template has logo + brand ─────────
runTest('Q2.1 — send-quote.js: email HTML has logo img + mono kicker + Konala footer', () => {
  const src = readFile('netlify/functions/send-quote.js');
  assert.ok(
    src.includes('logo.png') || src.includes('logo'),
    'send-quote.js email template should reference logo.png'
  );
  assert.ok(
    src.includes('KONALA') || src.includes('Konala') || src.includes('konala'),
    'send-quote.js email template should reference Konala location'
  );
  assert.ok(
    src.includes('DTF STUDIO') || src.includes('dtfstudio'),
    'send-quote.js should have DTF Studio kicker in email'
  );
});

// ── Test 7: Q2.2 — generateQuotePdf has brand logo embed ─────────────────
runTest('Q2.2 — generateQuotePdf: has logo embed + manila bg + crimson rule', () => {
  const src = readFile('src/lib/generateQuotePdf.ts');
  assert.ok(
    src.includes('embedPng') || src.includes('logo'),
    'generateQuotePdf should embed logo via embedPng'
  );
  assert.ok(
    src.includes('0.957') || src.includes('f4e4bc') || src.includes('manila') || src.includes('0.96'),
    'generateQuotePdf should use manila bg (rgb ~0.957, 0.894, 0.737)'
  );
  // Crimson rule: rgb(0.698, 0.133, 0.133) = #b22222
  assert.ok(
    src.includes('0.698') || src.includes('b22222') || src.includes('crimson') || src.includes('0.133'),
    'generateQuotePdf should use crimson accent'
  );
});

// ── Test 8: Q3.2 — generateQuotePdf uses cm→pt for drawImage ─────────────
runTest('Q3.2 — generateQuotePdf: drawImage uses cmToPt (widthCm × 28.3465)', () => {
  const src = readFile('src/lib/generateQuotePdf.ts');
  assert.ok(
    src.includes('widthCm') && src.includes('CM_TO_PT'),
    'generateQuotePdf should use widthCm × CM_TO_PT for drawImage sizing'
  );
  // Must NOT use raw pixel img.width
  assert.ok(
    !src.includes('img.width') && !src.includes('embeddedImg.width'),
    'generateQuotePdf should not use raw img.width — must use cm→pt conversion'
  );
});

// ── Test 9: Q4.1 — send-quote.js produces admin PRODUCTION attachment ─────
runTest('Q4.1 — send-quote.js: generates dtfstudio-PRODUCTION-{id}.pdf for admin', () => {
  const src = readFile('netlify/functions/send-quote.js');
  assert.ok(
    src.includes('PRODUCTION') || src.includes('production'),
    'send-quote.js should create a PRODUCTION attachment for admin'
  );
  assert.ok(
    src.includes('adminAttachments') || src.includes('adminEmail') || src.includes('admin'),
    'send-quote.js should send separate admin email'
  );
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
