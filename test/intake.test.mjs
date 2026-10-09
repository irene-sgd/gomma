import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { handleIntake } from '../src/intake.js';
import { ctx, env, goodLead, intakeRequest, mockFetch, resetCaches } from './helpers.mjs';

const NOTION_QUERY = /data_sources\/.+\/query$/;
const routes = (extra = []) => [
  { method: 'POST', match: NOTION_QUERY, reply: { results: [] } },
  { method: 'POST', match: /\/v1\/pages$/, reply: { id: 'page-new' } },
  { method: 'PATCH', match: /\/v1\/pages\//, reply: {} },
  ...extra,
];

beforeEach(resetCaches);

test('rejects a missing or foreign origin before doing anything', async () => {
  const calls = mockFetch(routes());
  assert.equal((await handleIntake(intakeRequest(goodLead(), { origin: null }), env(), ctx())).status, 403);
  assert.equal((await handleIntake(intakeRequest(goodLead(), { origin: 'https://evil.example' }), env(), ctx())).status, 403);
  assert.equal(calls.length, 0);
});

test('preflight returns CORS headers locked to gomma.cc', async () => {
  const res = await handleIntake(intakeRequest(null, { method: 'OPTIONS' }), env(), ctx());
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://gomma.cc');
  assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
});

test('honeypot gets a fake success and creates nothing', async () => {
  const calls = mockFetch(routes());
  const res = await handleIntake(intakeRequest({ ...goodLead(), nickname: 'bot' }), env(), ctx());
  assert.equal(res.status, 202);
  assert.equal(calls.length, 0);
});

test('rate limit returns 429 with Retry-After', async () => {
  mockFetch(routes());
  const limited = { ...env(), INTAKE_LIMITER: { limit: async () => ({ success: false }) } };
  const res = await handleIntake(intakeRequest(goodLead()), limited, ctx());
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('Retry-After'), '60');
});

test('validation errors return 400 with per-field messages and create nothing', async () => {
  const calls = mockFetch(routes());
  const res = await handleIntake(intakeRequest({ ...goodLead(), website: 'http://localhost' }), env(), ctx());
  assert.equal(res.status, 400);
  assert.ok((await res.json()).fields.website);
  assert.equal(calls.length, 0);
});

test('oversized and non-JSON bodies are refused', async () => {
  mockFetch(routes());
  const big = await handleIntake(intakeRequest({ ...goodLead(), founders: 'x'.repeat(30000) }), env(), ctx());
  assert.equal(big.status, 413);
  const bad = new Request('https://dashboard.gomma.cc/api/intake', { method: 'POST', headers: { Origin: 'https://gomma.cc' }, body: '{nope' });
  assert.equal((await handleIntake(bad, env(), ctx())).status, 400);
});

test('a declared oversized body is refused before it is read', async () => {
  mockFetch(routes());
  const req = new Request('https://dashboard.gomma.cc/api/intake', { method: 'POST', headers: { Origin: 'https://gomma.cc', 'Content-Length': '50000' }, body: '{}' });
  assert.equal((await handleIntake(req, env(), ctx())).status, 413);
});

test('missing secrets or disabled intake returns 503', async () => {
  mockFetch(routes());
  assert.equal((await handleIntake(intakeRequest(goodLead()), { ...env(), NOTION_TOKEN: '' }, ctx())).status, 503);
  assert.equal((await handleIntake(intakeRequest(goodLead()), { ...env(), INTAKE_ENABLED: 'false' }, ctx())).status, 503);
});

test('a valid lead creates one linked CRM row and does not start the agent by default', async () => {
  const calls = mockFetch(routes());
  const res = await handleIntake(intakeRequest(goodLead()), env(), ctx());
  assert.equal(res.status, 202);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://gomma.cc');

  const create = calls.filter((c) => c.method === 'POST' && c.url.endsWith('/v1/pages'));
  assert.equal(create.length, 1);
  const { parent, properties, children } = create[0].body;
  assert.deepEqual(parent, { type: 'data_source_id', data_source_id: env().CRM_DATA_SOURCE_ID });
  assert.equal(properties.Category.select.name, 'Client');
  assert.equal(properties.Status.status.name, 'Pending');
  assert.equal(properties['Screening Result'].select.name, 'Not screened');
  assert.equal(properties['Master Project Dashboard'].relation[0].id, env().PROJECT_PAGE_ID);
  assert.equal(properties['Area Category'].relation[0].id, env().AREA_PAGE_ID);
  assert.equal(properties['Project Type'].select.name, 'Culture and social causes');
  assert.equal(properties.Founded.date.start, '2019-04-02');
  assert.equal(properties.Email.email, 'mali@aurora-collective.org');
  assert.equal(children[0].type, 'heading_2');
  assert.ok(!calls.some((c) => c.url.includes('anthropic.com')));
});

test('a double submit creates one row (lock) and a recent duplicate in Notion creates none', async () => {
  const calls = mockFetch(routes());
  await handleIntake(intakeRequest(goodLead()), env(), ctx());
  await handleIntake(intakeRequest(goodLead()), env(), ctx());
  assert.equal(calls.filter((c) => c.url.endsWith('/v1/pages') && c.method === 'POST').length, 1);

  resetCaches();
  const dupCalls = mockFetch([{ method: 'POST', match: NOTION_QUERY, reply: { results: [{ id: 'existing' }] } }, ...routes()]);
  const res = await handleIntake(intakeRequest(goodLead()), env(), ctx());
  assert.equal(res.status, 202);
  assert.equal(dupCalls.filter((c) => c.url.endsWith('/v1/pages') && c.method === 'POST').length, 0);
});

test('AUTO_SCREEN starts one budget-capped session and records it on the row', async () => {
  const calls = mockFetch(
    routes([{ method: 'POST', match: /anthropic\.com\/v1\/sessions$/, reply: { id: 'sesn_new' } }])
  );
  const c = ctx();
  await handleIntake(intakeRequest(goodLead()), { ...env(), AUTO_SCREEN: 'true' }, c);
  await c.settle();

  const session = calls.find((x) => x.url.endsWith('/v1/sessions'));
  assert.deepEqual(session.body.agent, { type: 'agent', id: 'agent_1', version: 1 });
  assert.equal(session.body.environment_id, 'env_1');
  assert.deepEqual(session.body.budget.max_list_cost, { amount: '300', currency: 'USD' });
  assert.equal(session.body.metadata.crm_page_id, 'page-new');
  assert.equal(session.headers['anthropic-beta'], 'managed-agents-2026-04-01');
  const update = calls.find((x) => x.method === 'PATCH' && x.url.endsWith('/pages/page-new'));
  assert.equal(update.body.properties['Screening Session'].rich_text[0].text.content, 'sesn_new');
});

test('AUTO_SCREEN stops at the daily cap but still keeps the lead', async () => {
  const calls = mockFetch([
    { method: 'POST', match: NOTION_QUERY, reply: (call) => (call.body.page_size === 25 ? { results: new Array(25).fill({}) } : { results: [] }) },
    { method: 'POST', match: /\/v1\/pages$/, reply: { id: 'page-new' } },
  ]);
  const c = ctx();
  const res = await handleIntake(intakeRequest(goodLead()), { ...env(), AUTO_SCREEN: 'true' }, c);
  await c.settle();
  assert.equal(res.status, 202);
  assert.ok(!calls.some((x) => x.url.includes('anthropic.com')));
});

test('agent start failure leaves the row Pending with a note and still returns success', async () => {
  const calls = mockFetch(routes([{ method: 'POST', match: /anthropic\.com\/v1\/sessions$/, reply: { status: 500, body: {} } }]));
  const c = ctx();
  const res = await handleIntake(intakeRequest(goodLead()), { ...env(), AUTO_SCREEN: 'true' }, c);
  await c.settle();
  assert.equal(res.status, 202);
  const note = calls.filter((x) => x.method === 'PATCH').pop().body.properties.Note.rich_text[0].text.content;
  assert.match(note, /could not start/);
  const notionBodies = calls.filter((x) => x.url.includes('notion.com')).map((x) => JSON.stringify(x.body || {}));
  assert.ok(notionBodies.every((body) => !body.includes('sk-test')));
});

test('a Notion failure returns 500 without leaking details', async () => {
  mockFetch([
    { method: 'POST', match: NOTION_QUERY, reply: { results: [] } },
    { method: 'POST', match: /\/v1\/pages$/, reply: { status: 400, body: { message: 'secret detail' } } },
  ]);
  const res = await handleIntake(intakeRequest(goodLead()), env(), ctx());
  assert.equal(res.status, 500);
  assert.deepEqual(await res.json(), { error: 'server_error' });
});
