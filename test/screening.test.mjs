import assert from 'node:assert/strict';
import { test } from 'node:test';

import { handleScreeningApi } from '../src/screening-api.js';
import { env, mockFetch, row } from './helpers.mjs';

const ACTIVE = /data_sources\/.+\/query$/;
const SESSION = /anthropic\.com\/v1\/sessions\/sesn_1$/;
const EVENTS = /anthropic\.com\/v1\/sessions\/sesn_1\/events/;
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();

const syncRequest = (token = 'ntn_user') =>
  new Request('https://dashboard.gomma.cc/api/screening/sync', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
const startRequest = (pageId, token = 'ntn_user') =>
  new Request('https://dashboard.gomma.cc/api/screening/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pageId }),
  });

const resultBlock = (results, extra = {}) => {
  const checks = results.map((result, i) => ({ n: i + 1, result }));
  return `## Verdict\n\n| Check | Result |\n|---|---|\n| 1 | ${results[0]} |\n\n\`\`\`json\n${JSON.stringify({ checks, registration_no: null, founded: null, ...extra })}\n\`\`\``;
};
const eight = (overrides = {}) => Array.from({ length: 8 }, (_, i) => overrides[i + 1] || 'PASS');

function syncRoutes({ session = { status: 'idle', created_at: ago(3) }, events, extraRows = [row()] }) {
  return [
    { method: 'GET', match: /data_sources\/[^/]+$/, reply: {} },
    { method: 'POST', match: ACTIVE, reply: { results: extraRows } },
    { method: 'GET', match: /\/v1\/pages\//, reply: extraRows[0] || row() },
    { method: 'GET', match: SESSION, reply: session },
    { method: 'GET', match: EVENTS, reply: { data: events || [], next_page: null } },
    { method: 'PATCH', match: /\/v1\/blocks\//, reply: {} },
    { method: 'PATCH', match: /\/v1\/pages\//, reply: {} },
  ];
}
const finished = (text) => [
  { type: 'agent.message', content: [{ type: 'text', text: 'Searching...' }], processed_at: '2026-10-09T10:00:01Z' },
  { type: 'agent.message', content: [{ type: 'text', text }], processed_at: '2026-10-09T10:00:09Z' },
  { type: 'session.status_idle', stop_reason: { type: 'end_turn' }, processed_at: '2026-10-09T10:00:10Z' },
];
const pageUpdate = (calls) => calls.filter((c) => c.method === 'PATCH' && /\/v1\/pages\//.test(c.url)).pop().body.properties;

test('sync: Pass confirms the lead and writes the summary under a Screening heading', async () => {
  const calls = mockFetch(syncRoutes({ events: finished(resultBlock(eight(), { registration_no: 'REG-9', founded: '2019-04-02' })) }));
  const res = await handleScreeningApi(syncRequest(), env(), 'sync');
  assert.deepEqual(await res.json(), { ok: true, checked: 1, running: 0, finished: 1, failed: 0, errors: 0 });

  const props = pageUpdate(calls);
  assert.equal(props['Screening Result'].select.name, 'Pass');
  assert.equal(props.Status.status.name, 'Confirmed');
  assert.deepEqual(props['Failed Flags'].multi_select, []);
  assert.equal(props['Registration No.'].rich_text[0].text.content, 'REG-9');
  assert.equal(props.Founded.date.start, '2019-04-02');
  const blocks = calls.find((c) => /\/v1\/blocks\//.test(c.url)).body.children;
  assert.equal(blocks[0].type, 'heading_2');
  assert.ok(blocks.some((b) => b.type === 'table'));
  assert.ok(!JSON.stringify(blocks).includes('"checks"'));
});

test('sync: Decline cancels the lead and ticks only the failed flags', async () => {
  const calls = mockFetch(syncRoutes({ events: finished(resultBlock(eight({ 5: 'FAIL', 7: 'FAIL', 3: 'UNCLEAR' }))) }));
  await handleScreeningApi(syncRequest(), env(), 'sync');
  const props = pageUpdate(calls);
  assert.equal(props['Screening Result'].select.name, 'Decline');
  assert.equal(props.Status.status.name, 'Canceled');
  assert.deepEqual(props['Failed Flags'].multi_select.map((f) => f.name), ['5 Right-wing', '7 Under 2.5 years']);
});

test('sync: Unclear leaves Status as Pending and keeps existing registration data', async () => {
  const existing = row({ 'Registration No.': { rich_text: [{ plain_text: 'MINE-1' }] }, Founded: { date: { start: '2018-01-01' } } });
  const calls = mockFetch(syncRoutes({ extraRows: [existing], events: finished(resultBlock(eight({ 4: 'UNCLEAR' }), { registration_no: 'AGENT-2', founded: '2020' })) }));
  await handleScreeningApi(syncRequest(), env(), 'sync');
  const props = pageUpdate(calls);
  assert.equal(props['Screening Result'].select.name, 'Unclear');
  assert.equal('Status' in props, false);
  assert.equal('Registration No.' in props, false);
  assert.equal('Founded' in props, false);
});

test('sync: a still-running session is left alone', async () => {
  const calls = mockFetch(syncRoutes({ session: { status: 'running', created_at: ago(2) } }));
  const summary = await (await handleScreeningApi(syncRequest(), env(), 'sync')).json();
  assert.equal(summary.running, 1);
  assert.ok(!calls.some((c) => c.method === 'PATCH'));
});

test('sync: a session past the timeout is interrupted and the row stays Pending with a note', async () => {
  const calls = mockFetch([
    ...syncRoutes({ session: { status: 'running', created_at: ago(20) } }),
    { method: 'POST', match: EVENTS, reply: {} },
  ]);
  const summary = await (await handleScreeningApi(syncRequest(), env(), 'sync')).json();
  assert.equal(summary.failed, 1);
  assert.ok(calls.some((c) => c.method === 'POST' && EVENTS.test(c.url) && c.body.events[0].type === 'user.interrupt'));
  const props = pageUpdate(calls);
  assert.equal(props['Screening Session'].rich_text.length, 0);
  assert.match(props.Note.rich_text[0].text.content, /timed out after 15 minutes/);
  assert.equal('Status' in props, false);
  assert.equal('Screening Result' in props, false);
});

test('sync: malformed agent output, budget stop and terminated sessions all fail safely', async () => {
  const cases = [
    [{ events: finished('I could not find a result block.') }, /no result block/],
    [{ events: [{ type: 'session.status_idle', stop_reason: { type: 'budget_reached' }, processed_at: '2026-10-09T10:00:10Z' }] }, /budget limit reached/],
    [{ session: { status: 'terminated', created_at: ago(2) } }, /ended without a result/],
  ];
  for (const [setup, pattern] of cases) {
    const calls = mockFetch(syncRoutes(setup));
    const summary = await (await handleScreeningApi(syncRequest(), env(), 'sync')).json();
    assert.equal(summary.failed, 1, String(pattern));
    assert.match(pageUpdate(calls).Note.rich_text[0].text.content, pattern);
  }
});

test('sync: a transient Anthropic error changes nothing and is retried on the next sync', async () => {
  const calls = mockFetch([...syncRoutes({}).filter((r) => r.match !== SESSION), { method: 'GET', match: SESSION, reply: { status: 500, body: {} } }]);
  const summary = await (await handleScreeningApi(syncRequest(), env(), 'sync')).json();
  assert.equal(summary.errors, 1);
  assert.ok(!calls.some((c) => c.method === 'PATCH'));
});

test('sync and start require a Notion key that can read the CRM', async () => {
  mockFetch([{ method: 'GET', match: /data_sources\//, reply: { status: 404, body: {} } }]);
  assert.equal((await handleScreeningApi(syncRequest(null), env(), 'sync')).status, 401);
  assert.equal((await handleScreeningApi(syncRequest('ntn_stranger'), env(), 'sync')).status, 403);
  assert.equal((await handleScreeningApi(new Request('https://x.test/api/screening/sync'), env(), 'sync')).status, 405);
});

const pageReply = (parentDs, properties) => ({ ...row(properties), parent: { type: 'data_source_id', data_source_id: parentDs } });

test('start: refuses rows outside the CRM, running rows and already-screened rows', async () => {
  const page = '3787286d055f80d7b363fffe0cec3bed';
  mockFetch([{ method: 'GET', match: /\/v1\/pages\//, reply: pageReply('ffffffff-0000-0000-0000-000000000000', {}) }]);
  assert.equal((await handleScreeningApi(startRequest(page), env(), 'start')).status, 403);

  mockFetch([{ method: 'GET', match: /\/v1\/pages\//, reply: pageReply(env().CRM_DATA_SOURCE_ID, {}) }]);
  assert.equal((await handleScreeningApi(startRequest(page), env(), 'start')).status, 409);

  mockFetch([{ method: 'GET', match: /\/v1\/pages\//, reply: pageReply(env().CRM_DATA_SOURCE_ID, { 'Screening Session': { rich_text: [] }, 'Screening Result': { select: { name: 'Pass' } } }) }]);
  assert.equal((await handleScreeningApi(startRequest(page), env(), 'start')).status, 409);

  assert.equal((await handleScreeningApi(startRequest('not-an-id'), env(), 'start')).status, 400);
});

test('start: an unscreened row gets one session and its session id recorded', async () => {
  const idle = { 'Screening Session': { rich_text: [] } };
  const calls = mockFetch([
    { method: 'GET', match: /\/v1\/pages\//, reply: pageReply(env().CRM_DATA_SOURCE_ID, idle) },
    { method: 'POST', match: /anthropic\.com\/v1\/sessions$/, reply: { id: 'sesn_9' } },
    { method: 'PATCH', match: /\/v1\/pages\//, reply: {} },
  ]);
  const res = await handleScreeningApi(startRequest('3787286d055f80d7b363fffe0cec3bed'), env(), 'start');
  assert.equal(res.status, 200);
  assert.equal(calls.filter((c) => c.url.endsWith('/v1/sessions')).length, 1);
  assert.equal(pageUpdate(calls)['Screening Session'].rich_text[0].text.content, 'sesn_9');
  // the caller's key is only used for the access check, never for writes
  assert.ok(calls.filter((c) => c.method === 'PATCH').every((c) => c.headers.Authorization === 'Bearer ntn_server'));
});

test('sync: a row another sync already finished is not written twice', async () => {
  const finishedElsewhere = row({ 'Screening Result': { select: { name: 'Pass' } } });
  const calls = mockFetch([
    ...syncRoutes({ events: finished(resultBlock(eight())) }).filter((r) => !/pages/.test(String(r.match))),
    { method: 'GET', match: /\/v1\/pages\//, reply: finishedElsewhere },
    { method: 'PATCH', match: /\/v1\/(pages|blocks)\//, reply: {} },
  ]);
  await handleScreeningApi(syncRequest(), env(), 'sync');
  assert.ok(!calls.some((c) => c.method === 'PATCH'));
});
