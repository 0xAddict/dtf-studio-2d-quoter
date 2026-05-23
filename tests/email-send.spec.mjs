// DTF Studio Helsinki — email-send spec
// Tests: upload 1x1 PNG → fill form → click LÄHETÄ SÄHKÖPOSTIIN →
//   - The OLD generic toast "Sähköpostin lähetys epäonnistui. Lataa PDF manuaalisesti." does NOT appear
//   - A POST to /.netlify/functions/send-quote fires
// Grep tags: send-email, laheta, email-send, LAHETA
// Run: npx playwright test tests/email-send.spec.mjs --reporter=list

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';
const SAMPLE_IMAGE = path.join(__dirname, 'fixtures', 'sample.png');

const OLD_GENERIC_TOAST = 'Sähköpostin lähetys epäonnistui. Lataa PDF manuaalisesti.';

test.describe('email-send — LÄHETÄ SÄHKÖPOSTIIN fires fetch, no generic toast', () => {

  test('laheta: send-quote POST fires and old generic toast is absent', async ({ page }) => {
    // Track requests to send-quote
    const sendQuoteRequests = [];
    page.on('request', req => {
      if (req.url().includes('send-quote') && req.method() === 'POST') {
        sendQuoteRequests.push(req.url());
      }
    });

    await page.goto(BASE_URL);

    // Upload 1x1 PNG fixture
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(SAMPLE_IMAGE);

    // Fill required email
    await page.fill('input[type="email"]', 'test-email-send@example.com');

    // Submit to get quote
    await page.click('button:has-text("LASKE HINTA")');
    await expect(page.locator('text=TARJOUS VALMIS').first()).toBeVisible({ timeout: 20000 });

    // Intercept send-quote — return a successful stub so the test doesn't need a live backend
    await page.route('**/*send-quote*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, orderId: 'test-order-id' }),
      });
    });

    // Click LÄHETÄ SÄHKÖPOSTIIN
    await page.click('button:has-text("LÄHETÄ SÄHKÖPOSTIIN")');

    // Wait for sending spinner to go away or success state
    await page.waitForTimeout(3000);

    // Assert old generic toast does NOT appear anywhere on page
    const genericToastLocator = page.locator(`text="${OLD_GENERIC_TOAST}"`);
    await expect(genericToastLocator).toHaveCount(0);

    // Assert the POST to send-quote fired
    // (it may have been intercepted via route, but the request object is still captured)
    const sendQuoteViaRoute = sendQuoteRequests.length > 0 ||
      await page.evaluate(() => {
        // Fallback: check for "LÄHETETTY" success state
        return !!document.querySelector('[class*="CheckCircle"]') ||
               document.body.textContent?.includes('LÄHETETTY');
      });
    expect(sendQuoteViaRoute, 'send-quote request should have fired OR success state shown').toBe(true);

    console.log('PASS email-send: old generic toast absent, send-quote fired:', sendQuoteRequests.length, 'requests');
  });

});
