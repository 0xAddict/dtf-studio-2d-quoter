// DTF Studio Helsinki — btoa-pdf fix spec
// Tests: upload 1x1 PNG → click "LATAA PDF" → PDF downloads, no console RangeError.
// Grep tags: btoa-pdf, PDF download, pdf-download, lataa-pdf
// Run: npx playwright test tests/btoa-pdf.spec.mjs --reporter=list

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';
const SAMPLE_IMAGE = path.join(__dirname, 'fixtures', 'sample.png');

test.describe('btoa-pdf — PDF download, no RangeError', () => {

  test('btoa-pdf: PDF downloads without console RangeError after fix', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto(BASE_URL);

    // Upload 1x1 PNG fixture
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(SAMPLE_IMAGE);

    // Fill required email
    await page.fill('input[type="email"]', 'test-btoa@example.com');

    // Submit to get quote
    await page.click('button:has-text("LASKE HINTA")');
    await expect(page.locator('text=TARJOUS VALMIS').first()).toBeVisible({ timeout: 20000 });

    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Click "LATAA PDF"
    await page.click('button:has-text("LATAA PDF")');

    const download = await downloadPromise;
    const suggestedFilename = download.suggestedFilename();

    // Assert PDF downloaded with correct filename pattern
    expect(suggestedFilename).toMatch(/dtfstudio-quote-.*\.pdf/);

    // Assert no RangeError (stack overflow) in console
    const rangeErrors = consoleErrors.filter(e => /RangeError|Maximum call stack/i.test(e));
    expect(rangeErrors, `Console RangeErrors found: ${rangeErrors.join(', ')}`).toHaveLength(0);

    console.log('PASS btoa-pdf: PDF downloaded, filename:', suggestedFilename, ', no RangeError');
  });

});
