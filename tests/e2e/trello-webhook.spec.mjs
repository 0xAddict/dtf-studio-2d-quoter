/**
 * TDD spec: Trello webhook registration
 * Bead T3.3 — verifies webhook registered pointing to trello-webhook-sync.js URL
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE_DIR = path.resolve(__dir, '../../..', 'dtf-helsinki-site/.harness/sprints/sprint-trello-oms-v1/evidence');

const API_KEY = process.env.TRELLO_API_KEY || '284e8259a0bcb0f075b1ac6c8100fed1';
const API_TOKEN = process.env.TRELLO_API_TOKEN;
const EXPECTED_CALLBACK = 'https://dtf-studio-2d-quoter.netlify.app/.netlify/functions/trello-webhook-sync';

async function testWebhookRegistered() {
  if (!API_TOKEN) throw new Error('TRELLO_API_TOKEN not set');

  console.log('[T3.3] Checking webhook evidence file...');

  // Check evidence file exists
  const evidencePath = path.join(EVIDENCE_DIR, 'trello-webhook-id.json');
  let evidenceData;
  try {
    evidenceData = JSON.parse(readFileSync(evidencePath, 'utf-8'));
  } catch {
    throw new Error('trello-webhook-id.json not found in evidence — webhook not yet registered');
  }

  assert.ok(evidenceData.webhookId, 'Evidence must contain webhookId');
  assert.ok(evidenceData.callbackURL?.includes('trello-webhook-sync'), 'Evidence must reference trello-webhook-sync callback');

  // Verify via API
  const url = `https://api.trello.com/1/tokens/${API_TOKEN}/webhooks?key=${API_KEY}&token=${API_TOKEN}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Trello webhooks list failed: ${resp.status}`);
  const webhooks = await resp.json();

  const found = webhooks.find(w => w.callbackURL && w.callbackURL.includes('trello-webhook-sync'));
  assert.ok(found, `No webhook found pointing to trello-webhook-sync. Registered: ${webhooks.map(w=>w.callbackURL).join(', ')}`);
  assert.equal(found.id, evidenceData.webhookId, 'Webhook ID in evidence matches API');

  console.log('[PASS] T3.3 — Webhook registered, ID:', found.id);
}

testWebhookRegistered().catch(e => {
  console.error('[FAIL]', e.message);
  process.exit(1);
});
