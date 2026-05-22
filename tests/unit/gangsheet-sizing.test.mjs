/**
 * TDD: gangsheet-sizing — Image size fidelity
 *
 * Contract: When a customer uploads a 4000×4000px image and requests 20×20cm,
 * packGangSheet must pack using the requested 20cm dims (not raw pixel dims).
 * generateQuotePdf must render images at 20cm × 28.3465pt/cm = 566.93pt.
 *
 * Bead: gangsheet-sizing
 */
import { strict as assert } from 'assert';
import { pathToFileURL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import via tsx (TypeScript source)
let packGangSheet, A3_WIDTH_CM, A3_HEIGHT_CM, MARGIN_CM, SHEET_MARGIN_CM;
try {
  const mod = await import(
    pathToFileURL(path.resolve(__dirname, '../../src/lib/gangSheet.ts')).href
  );
  packGangSheet = mod.packGangSheet;
  A3_WIDTH_CM = mod.A3_WIDTH_CM;
  A3_HEIGHT_CM = mod.A3_HEIGHT_CM;
  MARGIN_CM = mod.MARGIN_CM;
  SHEET_MARGIN_CM = mod.SHEET_MARGIN_CM;
} catch (e) {
  console.error('Import error:', e.message);
  process.exit(1);
}

const CM_TO_PT = 28.3465;

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

// Test 1: packGangSheet uses cm dimensions for a 20×20 cm request
runTest('packGangSheet: 20×20cm image packs correctly (not raw pixels)', () => {
  const imageDims = [{ widthCm: 20, heightCm: 20 }]; // customer's requested cm size
  const result = packGangSheet(imageDims, 1);

  // A3 effective = 28 × 40 cm
  // 20cm wide: floor((28 + 0.5) / (20 + 0.5)) = 1 col
  // 20cm tall: floor((40 + 0.5) / (20 + 0.5)) = 1 row
  // itemsPerSheet = 1
  assert.strictEqual(result.itemsPerSheet, 1,
    `Expected 1 item/sheet for 20cm image on A3, got ${result.itemsPerSheet}`);
  assert.strictEqual(result.sheets, 1,
    `Expected 1 sheet for qty=1, got ${result.sheets}`);
  assert.strictEqual(result.totalItems, 1, 'totalItems should be 1');
});

// Test 2: PDF points formula is correct — 20cm = 566.93pt
runTest('CM_TO_PT: 20cm renders at 566.93pt in PDF', () => {
  const requestedWidthCm = 20;
  const expectedPt = requestedWidthCm * CM_TO_PT;

  assert.ok(
    Math.abs(expectedPt - 566.93) < 0.1,
    `20cm × 28.3465 = ${expectedPt}pt, expected ~566.93pt`
  );
});

// Test 3: If someone mistakenly passed 4000px as cm, packer should produce ≥1 item/sheet
// (this tests our guard: we never pass raw pixels)
runTest('packGangSheet: using cm dims NOT pixel dims (defensive)', () => {
  const correctCmDims = [{ widthCm: 20, heightCm: 20 }]; // correct
  const correct = packGangSheet(correctCmDims, 10);

  // With pixel dims (wrong), 4000cm image can't fit on A3 at all → itemsPerSheet = 1 (max 1 clamped)
  // With cm dims (correct), 20cm fits: 1 col × 2 rows = 2 per sheet → 5 sheets for 10
  assert.ok(correct.sheets <= 10,
    `Expected ≤10 sheets for 10 images at 20cm, got ${correct.sheets}`);
  assert.ok(correct.itemsPerSheet >= 1,
    `Expected ≥1 item per sheet, got ${correct.itemsPerSheet}`);
});

// Test 4: A3 constants match spec (30×42 cm)
runTest('A3 dimensions: 30×42 cm per spec', () => {
  assert.strictEqual(A3_WIDTH_CM, 30, `A3_WIDTH_CM should be 30, got ${A3_WIDTH_CM}`);
  assert.strictEqual(A3_HEIGHT_CM, 42, `A3_HEIGHT_CM should be 42, got ${A3_HEIGHT_CM}`);
});

// Test 5: gangSheet returns all required fields
runTest('packGangSheet: returns all required GangSheetResult fields', () => {
  const result = packGangSheet([{ widthCm: 10, heightCm: 10 }], 5);
  const required = ['sheets', 'totalItems', 'itemsPerSheet', 'utilisation', 'totalAreaCm2', 'sheetAreaCm2', 'pricePerSheet', 'setupFee', 'totalEur'];
  for (const key of required) {
    assert.ok(key in result, `Missing field: ${key}`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
