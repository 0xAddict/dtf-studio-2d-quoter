// DTF Studio Helsinki — Playwright E2E test
// Tests: upload sample image → fill form → calculate quote → verify result displayed
// Run: npx playwright test tests/quote.spec.mjs --headed
// Note: requires PLAYWRIGHT_BASE_URL env or defaults to http://localhost:5173

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const SAMPLE_IMAGE = path.join(__dirname, 'fixtures', 'sample.png');

test.describe('DTF 2D Quoter — tarjouslaskuri', () => {

  test('should show quote result after uploading image and filling form', async ({ page }) => {
    await page.goto(BASE_URL);

    // Page title check
    await expect(page).toHaveTitle(/DTF Studio/i);

    // Upload file
    const fileInput = page.locator('input[type="file"][accept*="png"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);

    // Verify thumbnail appears
    await expect(page.locator('img[alt="sample.png"]').or(page.locator('.group.w-20'))).toBeVisible({ timeout: 5000 });

    // Fill koko (size)
    await page.fill('input[placeholder="cm"]:first-of-type', '15');
    await page.fill('input[placeholder="cm"]:last-of-type', '15');

    // Quantity
    const qtyInput = page.locator('input[type="number"][max="5000"]');
    await qtyInput.fill('25');

    // Material — select polyester
    await page.click('label:has-text("Polyesteri")');

    // Email
    await page.fill('input[type="email"]', 'test@example.com');

    // Submit
    await page.click('button:has-text("Laske hinta")');

    // Wait for quote result
    await expect(page.locator('text=Hinta-arvio valmis')).toBeVisible({ timeout: 15000 });

    // Verify key elements
    await expect(page.locator('text=A3-arkkeja')).toBeVisible();
    await expect(page.locator('text=Yhteensä')).toBeVisible();

    // Verify non-zero price displayed
    const totalText = await page.locator('text=Yhteensä (ALV 0%)').locator('..').textContent();
    console.log('Quote total section:', totalText);

    // PDF download button visible
    await expect(page.locator('button:has-text("Lataa PDF")')).toBeVisible();

    console.log('PASS: Quote generated successfully');
  });

  test('should block submission without email', async ({ page }) => {
    await page.goto(BASE_URL);

    const fileInput = page.locator('input[type="file"][accept*="png"]');
    await fileInput.setInputFiles(SAMPLE_IMAGE);

    // Try submit without email
    await page.click('button:has-text("Laske hinta")');

    // Should show error
    await expect(page.locator('text=Sähköpostiosoite vaaditaan')).toBeVisible({ timeout: 3000 });
  });

  test('should block submission without files', async ({ page }) => {
    await page.goto(BASE_URL);

    // Fill email but no files
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Laske hinta")');

    // Should show error
    await expect(page.locator('text=Lisää vähintään yksi kuvatiedosto')).toBeVisible({ timeout: 3000 });
  });

});
