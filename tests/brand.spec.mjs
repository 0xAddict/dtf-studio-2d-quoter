/**
 * sprint-quoter-branding-v1 — TDD brand tests
 * These tests FAIL against the old Hexea/Apple-HIG palette.
 * They PASS once the dtfstudio.fi brand tokens are applied.
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

// ── TEST 1: No dark slate / indigo / gradient classes in rendered HTML ────────
test('Q1.6 / button-style — no purple gradients, no rounded-full, no indigo bg', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // Check outer HTML of the quoter form for forbidden Tailwind classes
  const html = await page.content();

  // These classes must NOT appear in rendered markup
  expect(html).not.toMatch(/bg-indigo-[0-9]/);
  expect(html).not.toMatch(/from-indigo-[0-9]/);
  expect(html).not.toMatch(/to-indigo-[0-9]/);
  expect(html).not.toMatch(/bg-gradient-to-[a-z]/);
  expect(html).not.toMatch(/rounded-full/);
  expect(html).not.toMatch(/bg-slate-950/);
  expect(html).not.toMatch(/bg-slate-900/);
});

// ── TEST 2: Manila background (#f4e4bc) present ───────────────────────────────
test('Q1.2 — manila paper background applied (no gray/slate bg)', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });

  const bodyBg = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });

  // #f4e4bc = rgb(244, 228, 188)
  expect(bodyBg).toBe('rgb(244, 228, 188)');
});

// ── TEST 3: Mono kicker pattern present — uppercase letter-spacing ─────────────
test('Q1.8 — mono kicker present (TARJOUS / TILAUS / PALVELU pattern)', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });

  const html = await page.content();
  // At least one kicker label must be present
  const hasKicker = /TARJOUS|TILAUS|PALVELU|ASIAKAS|KOKO|MATERIAALI|KUVA/i.test(html);
  expect(hasKicker).toBe(true);
});

// ── TEST 4: Mobile 375×812 no horizontal overflow ─────────────────────────────
test('P3.2 — mobile 375×812 no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE, { waitUntil: 'networkidle' });

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});

// ── TEST 5: Brand crimson present in step indicators or section headers ────────
test('Q1.3 — crimson accent color present in page', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // Look for any element using crimson
  const hasCrimson = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const bg = style.backgroundColor;
      const border = style.borderColor;
      // #b22222 = rgb(178, 34, 34)
      if (
        color === 'rgb(178, 34, 34)' ||
        bg === 'rgb(178, 34, 34)' ||
        border === 'rgb(178, 34, 34)'
      ) {
        return true;
      }
    }
    return false;
  });

  expect(hasCrimson).toBe(true);
});
