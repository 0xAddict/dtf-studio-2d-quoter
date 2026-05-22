/**
 * TDD spec: send-quote.js custom field + label wiring
 * Bead T3.2 — verifies send-quote.js contains custom field setting code + label application
 */

import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const SEND_QUOTE_PATH = new URL('../../netlify/functions/send-quote.js', import.meta.url).pathname;

function checkSendQuote() {
  const src = readFileSync(SEND_QUOTE_PATH, 'utf-8');

  // Must reference customFields endpoint or setCustomFieldOnCard
  assert.ok(
    src.includes('customField') || src.includes('custom_field'),
    'send-quote.js must reference customField API'
  );

  // Must reference labelIds (to apply labels)
  assert.ok(
    src.includes('idLabels') || src.includes('labelIds') || src.includes('setLabel') || src.includes('addLabelToCard'),
    'send-quote.js must apply labels to card'
  );

  // Must reference TRELLO_LIST_MAP env var
  assert.ok(
    src.includes('TRELLO_LIST_MAP'),
    'send-quote.js must read TRELLO_LIST_MAP env var'
  );

  // Must reference TRELLO_BOARD_ID env var
  assert.ok(
    src.includes('TRELLO_BOARD_ID'),
    'send-quote.js must read TRELLO_BOARD_ID env var'
  );

  console.log('[PASS] T3.2 — send-quote.js has custom field + label wiring');
}

checkSendQuote();
