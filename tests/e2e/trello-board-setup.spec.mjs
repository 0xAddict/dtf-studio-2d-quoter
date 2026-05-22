/**
 * TDD spec: Trello board setup verification
 * Bead T1.2 — verifies 7 Finnish lists exist on the DTF Orders board
 * Bead T2.2 — verifies 8 custom fields exist
 */

import assert from 'node:assert/strict';

const API_KEY = process.env.TRELLO_API_KEY || '284e8259a0bcb0f075b1ac6c8100fed1';
const API_TOKEN = process.env.TRELLO_API_TOKEN;
const BOARD_ID = process.env.TRELLO_BOARD_ID;

const EXPECTED_LISTS = [
  'Tilaus saapunut',
  'Suunnittelussa',
  'Tuotannossa',
  'Laadunvalvonta',
  'Lähetetty',
  'Toimitettu',
  'Peruttu',
];

const EXPECTED_CUSTOM_FIELDS = [
  'Asiakkaan nimi',
  'Sähköposti',
  'Tilaushinta EUR',
  'Arkkien määrä',
  'Materiaali',
  'Mitat (cm)',
  'Tilausnumero',
  'Lähde',
];

async function trelloGet(path) {
  const url = `https://api.trello.com/1${path}?key=${API_KEY}&token=${API_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Trello GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function testListsExist() {
  console.log('[T1.2] Testing 7 Finnish lists exist on board...');
  if (!BOARD_ID) throw new Error('TRELLO_BOARD_ID not set');
  const lists = await trelloGet(`/boards/${BOARD_ID}/lists`);
  const names = lists.filter(l => !l.closed).map(l => l.name);
  console.log('  Found lists:', names);
  for (const expected of EXPECTED_LISTS) {
    assert.ok(names.includes(expected), `Missing list: ${expected}`);
  }
  assert.equal(names.length, 7, `Expected 7 lists, got ${names.length}`);
  console.log('  [PASS] T1.2 — 7 Finnish lists exist');
  return lists;
}

async function testCustomFieldsExist() {
  console.log('[T2.2] Testing 8 custom fields exist on board...');
  if (!BOARD_ID) throw new Error('TRELLO_BOARD_ID not set');
  const fields = await trelloGet(`/boards/${BOARD_ID}/customFields`);
  const names = fields.map(f => f.name);
  console.log('  Found custom fields:', names);
  for (const expected of EXPECTED_CUSTOM_FIELDS) {
    assert.ok(names.includes(expected), `Missing custom field: ${expected}`);
  }
  assert.equal(fields.length, 8, `Expected 8 custom fields, got ${fields.length}`);
  console.log('  [PASS] T2.2 — 8 custom fields exist');
}

async function run() {
  if (!API_TOKEN || !BOARD_ID) {
    console.error('[SKIP] TRELLO_API_TOKEN or TRELLO_BOARD_ID not set — run after board creation');
    process.exit(1);
  }
  await testListsExist();
  await testCustomFieldsExist();
  console.log('\n[ALL PASS] Board setup verified.');
}

run().catch(e => {
  console.error('[FAIL]', e.message);
  process.exit(1);
});
