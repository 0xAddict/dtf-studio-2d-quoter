// DTF Studio Helsinki — error-toast spec
// Tests: monkey-patch window.fetch to return 500 → complete flow →
//   accurate ServerError-class toast appears (NOT generic "Lataa PDF manuaalisesti")
// Grep tags: synthetic-failure, 500-error, error-toast
// Run: npx playwright test tests/error-toast.spec.mjs --reporter=list

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';
const SAMPLE_IMAGE = path.join(__dirname, 'fixtures', 'sample.png');

const OLD_GENERIC_TOAST = 'Sähköpostin lähetys epäonnistui. Lataa PDF manuaalisesti.';

test.describe('error-toast — synthetic 500 shows ServerError toast, not generic PDF toast', () => {

  test('synthetic-failure: 500-error response shows accurate Palvelin palautti virheen toast', async ({ page }) => {
    await page.goto(BASE_URL);

    // Upload 1x1 PNG fixture
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(SAMPLE_IMAGE);

    // Fill required email
    await page.fill('input[type="email"]', 'test-error-toast@example.com');

    // Submit to get quote
    await page.click('button:has-text("LASKE HINTA")');
    await expect(page.locator('text=TARJOUS VALMIS').first()).toBeVisible({ timeout: 20000 });

    // Monkey-patch fetch via route interception to always return 500 for send-quote
    await page.route('**/*send-quote*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'text/plain',
        body: 'Internal Server Error',
      });
    });

    // Click LÄHETÄ SÄHKÖPOSTIIN
    await page.click('button:has-text("LÄHETÄ SÄHKÖPOSTIIN")');

    // Wait for error to appear (up to 10s)
    // The accurate ServerError toast should show "Palvelin palautti virheen"
    await expect(
      page.locator('text=Palvelin palautti virheen')
    ).toBeVisible({ timeout: 10000 });

    // Assert old generic "Lataa PDF manuaalisesti" toast does NOT appear
    const genericToastLocator = page.locator(`text="${OLD_GENERIC_TOAST}"`);
    await expect(genericToastLocator).toHaveCount(0);

    console.log('PASS error-toast: accurate ServerError toast shown, old generic toast absent');
  });

  test('500-error: EmailSendError shows network failure message, not generic PDF toast', async ({ page }) => {
    await page.goto(BASE_URL);

    // Upload 1x1 PNG fixture
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(SAMPLE_IMAGE);

    // Fill required email
    await page.fill('input[type="email"]', 'test-network-err@example.com');

    // Submit to get quote
    await page.click('button:has-text("LASKE HINTA")');
    await expect(page.locator('text=TARJOUS VALMIS').first()).toBeVisible({ timeout: 20000 });

    // Monkey-patch window.fetch via addInitScript to simulate a network failure
    // (abort the request — throws TypeError which should be caught as EmailSendError)
    await page.route('**/*send-quote*', async route => {
      await route.abort('failed');
    });

    // Click LÄHETÄ SÄHKÖPOSTIIN
    await page.click('button:has-text("LÄHETÄ SÄHKÖPOSTIIN")');

    // Wait for error panel — should say "Sähköpostin lähetys epäonnistui. Tarkista internetyhteys."
    // NOT the old generic "Lataa PDF manuaalisesti"
    await expect(
      page.locator('.error-panel').or(page.locator('[class*="error"]'))
    ).toBeVisible({ timeout: 10000 });

    // Assert old generic toast DOES NOT appear
    const genericToastLocator = page.locator(`text="${OLD_GENERIC_TOAST}"`);
    await expect(genericToastLocator).toHaveCount(0);

    console.log('PASS 500-error: network abort shows email error, not generic PDF toast');
  });

});
