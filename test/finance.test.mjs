import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  monthlyHistory,
  businessRows, compare, FinanceDataError, isPassThrough, maskAccount, monthSummary, parseAccounts, parseAmount, parseDMY, parseForecast, publicTransactions,
} from '../src/finance/ledger.js';
import { _resetCache, readFinanceSheets } from '../src/finance/sheets.js';

const ACCOUNTS = [
  ['ID', 'Name', 'Type', 'Currency', 'Institution', 'Account Number', 'Opening Balance', 'Opening Date', 'Created At', 'Archived At', ''],
  ['a1', 'Reserve', 'checking', 'THB', 'KBank', '240-2-88117-0', '1000', '2026-07-01', '', '', 'Business'],
  ['a2', 'KMake Kasikorn Wallet', 'checking', 'THB', 'KBank', 'XXX-X-XX850-4', '200.8', '2026-07-01', '', '', 'Personal'],
  ['a3', 'Test Wallet', 'checking', 'THB', 'TrueMoney', '', '1000', '2026-08-01', '', '2026-08-01T16:43:35Z', ''],
  ['a4', 'Old Business', 'checking', 'THB', 'X', '', '5', '2026-07-01', '', '2026-09-01', 'Business'],
];
const H = ['Transaction', 'Type', 'Amount', 'Category', 'Realm', 'Status', 'Payment Method', 'Paid Date', 'Notes', 'Account', 'Currency', 'Intent', 'Account Number'];
const row = (o) => [o.t ?? 'x', o.type, o.amount, o.cat ?? '', o.realm ?? 'Business', 'Completed', '', o.date ?? '5/10/2026', o.notes ?? '', o.acc ?? 'Reserve', 'THB', '', '100-8-46850-4'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthHead = (ym) => `${MON[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;
// values: Revenue, Operating costs, Tax reserve, Equipment fund, Owner salary, Owner transfers, Closing cash
const forecastWide = (months, valuesFor) => {
  const v = months.map(valuesFor);
  const row = (label, i, fmt = (n) => n) => [label, ...v.map((x) => fmt(x[i]))];
  return [
    ['Monthly forecast, Oct 2026 to Dec 2027 (THB)'], [],
    ['Month', ...months.map(monthHead), 'Total'],
    ['Revenue'], row('Total revenue', 0), ['Direct costs'], ['Collaborators', ...months.map(() => '-')],
    ['Operating costs'], row('Total operating costs', 1), row('Tax reserve', 2), row('Equipment fund', 3),
    row('Owner salary', 4), row('Owner goal transfers', 5), row('Closing studio cash', 6),
  ];
};
const forecastRows = (month, values) => forecastWide([month], () => values);

test('D/M/Y parsing is day first and rejects impossible dates', () => {
  assert.deepEqual(parseDMY('26/7/2026'), { y: 2026, m: 7, d: 26, iso: '2026-07-26', month: '2026-07' });
  assert.equal(parseDMY('1/7/2026').month, '2026-07');
  assert.equal(parseDMY('7/26/2026'), null);
  assert.equal(parseDMY('31/2/2026'), null);
  assert.equal(parseDMY('2026-07-26'), null);
  assert.equal(parseAmount('1,234.50'), 1234.5);
});

test('account numbers are masked to x + last 4, never full', () => {
  assert.equal(maskAccount('240-2-88117-0'), 'x1170');
  assert.equal(maskAccount('240-2-98118-3'), 'x1183');
  assert.equal(maskAccount('100-8-46850-4'), 'x8504');
  assert.equal(maskAccount('12'), '');
  assert.equal(maskAccount(''), '');
});

test('scope: Personal, archived and unscoped accounts never reach the rows', () => {
  const accounts = parseAccounts(ACCOUNTS);
  const rows = businessRows([H,
    row({ type: 'Revenue', amount: '100', acc: 'Reserve' }),
    row({ type: 'Expense', amount: '55', acc: 'KMake Kasikorn Wallet', realm: 'Personal' }),
    row({ type: 'Revenue', amount: '9', acc: 'Test Wallet' }),
    row({ type: 'Revenue', amount: '9', acc: 'Old Business' }),
    row({ type: 'Revenue', amount: '9', acc: 'Unknown' }),
  ], accounts);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].account, 'Reserve');
  const serialised = JSON.stringify(publicTransactions(rows));
  assert.ok(!serialised.includes('KMake') && !serialised.includes('88117-0') && !serialised.includes('46850'));
  assert.ok(serialised.includes('x1170'));
});

test('transfer labels are neutral business terms, never the free text', () => {
  const accounts = parseAccounts(ACCOUNTS);
  const rows = businessRows([H,
    row({ type: 'Transfer Out', amount: '25000', t: 'Transfer - Norway trip 2027 funding to KMake' }),
    row({ type: 'Transfer In', amount: '1000', t: 'Transfer - Debts repaid from KMake' }),
    row({ type: 'Expense', amount: '76', t: 'Transport - bolt', cat: 'Transport' }),
  ], accounts);
  const labels = publicTransactions(rows).map((t) => t.transaction).sort();
  assert.deepEqual(labels, ['Owner transfer', 'Transfer In', 'Transport - bolt']);
});

test('personal account names inside business transaction labels are redacted', () => {
  const accounts = parseAccounts(ACCOUNTS);
  const rows = businessRows([H, row({ type: 'Transfer Out', amount: '25000', t: 'Transfer - salary to KMake Kasikorn Wallet' }), row({ type: 'Transfer In', amount: '1', t: 'Debts repaid from kmake' })], accounts);
  const text = JSON.stringify(publicTransactions(rows));
  assert.ok(!/kmake/i.test(text));
  assert.ok(text.includes('Owner salary') && !text.includes('salary to'));
  assert.equal(monthSummary('2026-10', rows, accounts, parseForecast(forecastRows('2026-10', [0, 0, 0, 0, 0, 0, 0]))).lines.find((l) => l.line === 'Owner salary').actual, 25000);
});

test('missing column or no business account stops instead of guessing', () => {
  const accounts = parseAccounts(ACCOUNTS);
  assert.throws(() => businessRows([H.filter((h) => h !== 'Paid Date'), []], accounts), FinanceDataError);
  assert.throws(() => businessRows([H], parseAccounts([ACCOUNTS[0], ACCOUNTS[2]])), FinanceDataError);
});

test('pass-through money is excluded from income and cost lines', () => {
  const accounts = parseAccounts(ACCOUNTS);
  const rows = businessRows([H,
    row({ type: 'Revenue', amount: '5000', cat: 'Royalties' }),
    row({ type: 'Revenue', amount: '700', cat: 'Loan - Sister' }),
    row({ type: 'Transfer Out', amount: '300', cat: 'Crypto', notes: 'Binance top up' }),
    row({ type: 'Revenue', amount: '1000', cat: 'Project' }),
  ], accounts);
  assert.equal(rows.filter(isPassThrough).length, 3);
  const f = parseForecast(forecastRows('2026-10', [0, 0, 0, 0, 0, 0, 0]));
  const m = monthSummary('2026-10', rows, accounts, f);
  assert.equal(m.lines.find((l) => l.line === 'Revenue').actual, 1000);
});

test('personal spend from the business account is not an operating cost', () => {
  const accounts = parseAccounts(ACCOUNTS);
  const rows = businessRows([H,
    row({ type: 'Expense', amount: '400', cat: 'Software' }),
    row({ type: 'Expense', amount: '999', cat: 'Dining Out', realm: 'Personal' }),
    row({ type: 'Expense', amount: '888', cat: 'Software', realm: 'Personal' }),
    row({ type: 'Revenue', amount: '50', cat: 'Refund' }),
    row({ type: 'Transfer Out', amount: '1000', cat: 'Equipment', notes: 'equipment fund' }),
  ], accounts);
  const m = monthSummary('2026-10', rows, accounts, parseForecast(forecastRows('2026-10', [1, 1, 1, 1, 1, 1, 1])));
  const get = (n) => m.lines.find((l) => l.line === n).actual;
  assert.equal(get('Operating costs'), 400 - 50 + 1000);
  assert.equal(get('Revenue'), 0);
  assert.equal(get('Equipment fund'), 1000);
  assert.ok(!JSON.stringify(publicTransactions(rows)).includes('Dining'));
});

test('transfers route to salary / norway / tax; borrow is not salary', () => {
  const accounts = parseAccounts(ACCOUNTS);
  const rows = businessRows([H,
    row({ type: 'Transfer Out', amount: '25000', t: 'Owner salary' }),
    row({ type: 'Transfer Out', amount: '900', t: 'Repay borrowed salary advance' }),
    row({ type: 'Transfer Out', amount: '25000', t: 'To Norway' }),
    row({ type: 'Transfer Out', amount: '5000', t: 'Tax reserve' }),
  ], accounts);
  const m = monthSummary('2026-10', rows, accounts, parseForecast(forecastRows('2026-10', [0, 0, 0, 0, 0, 0, 0])));
  const get = (n) => m.lines.find((l) => l.line === n).actual;
  assert.deepEqual([get('Owner salary'), get('Owner transfers'), get('Tax reserve')], [25000, 25000, 5000]);
});

test('closing cash = opening + in - out on Business accounts up to month end', () => {
  const accounts = parseAccounts(ACCOUNTS);
  const rows = businessRows([H,
    row({ type: 'Revenue', amount: '500', date: '30/9/2026' }),
    row({ type: 'Expense', amount: '200', date: '31/10/2026' }),
    row({ type: 'Revenue', amount: '9999', date: '1/11/2026' }),
    row({ type: 'Revenue', amount: '9999', date: '30/6/2026' }),
  ], accounts);
  const m = monthSummary('2026-10', rows, accounts, parseForecast(forecastRows('2026-10', [0, 0, 0, 0, 0, 0, 1300])));
  assert.equal(m.lines.find((l) => l.line === 'Closing cash').actual, 1000 + 500 - 200);
});

test('forecast model: wide layout, (negatives), "-" zeros and collaborators folded into operating costs', () => {
  const rows = [
    ['Month', 'Oct 2026', 'Jan 2027', 'Total'],
    ['Total revenue', '53,387', '34,087', 1],
    ['Collaborators', '-', '4,680', 1],
    ['Total operating costs', 7180, 7180, 1],
    ['Tax reserve', 5338.7, 3408.7, 1],
    ['Equipment fund', 1000, 1000, 1],
    ['Owner salary', 25000, 25000, 1],
    ['Owner goal transfers', 25000, 25000, 1],
    ['Closing studio cash', '(7,361)', '(56,806)', ''],
  ];
  const f = parseForecast(rows);
  assert.deepEqual(Object.keys(f), ['2026-10', '2027-01']);
  assert.equal(f['2026-10']['Operating costs'], 7180);
  assert.equal(f['2027-01']['Operating costs'], 7180 + 4680);
  assert.equal(f['2026-10']['Closing cash'], -7361);
  assert.equal(f['2026-10'].Revenue, 53387);
  assert.equal(f['2027-01']['Tax reserve'], 3408.7);
  assert.throws(() => parseForecast(rows.filter((r) => r[0] !== 'Owner salary')), FinanceDataError);
  assert.throws(() => parseForecast([['Nope']]), FinanceDataError);
  // Date-typed month headers arrive as serial numbers: 46296 = 1 Oct 2026, 46388 = 1 Jan 2027.
  const serial = parseForecast([['Month', 46296, 46388], ...rows.slice(1).map((r) => [r[0], r[1], r[2]])]);
  assert.deepEqual(Object.keys(serial), ['2026-10', '2027-01']);
});

test('10% rule: strictly more than 10% off, zero forecast off for any non-zero', () => {
  assert.equal(compare(110, 100).off, false);
  assert.equal(compare(110.01, 100).off, true);
  assert.equal(compare(89, 100).off, true);
  assert.equal(compare(0, 0).off, false);
  assert.equal(compare(1, 0).off, true);
  assert.equal(compare(-8000, -7360.7).off, false);
  assert.equal(compare(-9000, -7360.7).off, true);
  assert.equal(compare(90, 100).difference, -10);
});

test('on track and off counts add up to the seven lines', () => {
  const accounts = parseAccounts(ACCOUNTS);
  const rows = businessRows([H, row({ type: 'Revenue', amount: '100' })], accounts);
  const m = monthSummary('2026-10', rows, accounts, parseForecast(forecastRows('2026-10', [100, 0, 0, 0, 0, 0, 1100])));
  assert.equal(m.onTrack + m.off, 7);
  assert.equal(m.onTrack, 7);
});

test('sheets client: GET only, readonly scope, ledger+Accounts from master, Forecast from the model', async () => {
  _resetCache();
  const { privateKey } = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign']);
  const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', privateKey)).toString('base64');
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', body: init.body ? String(init.body) : '' });
    const u = String(url);
    if (u.includes('oauth2')) return Response.json({ access_token: 't' });
    if (u.includes('batchGet') && u.includes('/fid/')) return Response.json({ valueRanges: [{ values: forecastRows('2026-10', [0, 0, 0, 0, 0, 0, 0]) }] });
    if (u.includes('batchGet')) return Response.json({ valueRanges: [{ values: [H] }, { values: ACCOUNTS }] });
    return Response.json({ sheets: ['Untitled', 'Summary', 'Accounts', 'Plan', 'Investments'].map((title) => ({ properties: { title } })) });
  };
  const env = { GOOGLE_SHEETS_SPREADSHEET_ID: 'sid', GOOGLE_FORECAST_SPREADSHEET_ID: 'fid', GOOGLE_SERVICE_ACCOUNT_EMAIL: 'sa@x.iam', GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----\n${pkcs8}\n-----END PRIVATE KEY-----` };
  await readFinanceSheets(env, { fetchImpl });
  const sheets = calls.filter((c) => c.url.includes('sheets.googleapis.com'));
  assert.ok(sheets.every((c) => c.method === 'GET'));
  const jwt = calls.find((c) => c.url.includes('oauth2')).body;
  const claim = JSON.parse(Buffer.from(decodeURIComponent(jwt.split('assertion=')[1]).split('.')[1], 'base64url'));
  assert.equal(claim.scope, 'https://www.googleapis.com/auth/spreadsheets.readonly');
  const batches = sheets.filter((c) => c.url.includes('batchGet')).map((c) => decodeURIComponent(c.url));
  const batch = batches.join(' ');
  for (const banned of ['Summary', 'Plan', 'Investments']) assert.ok(!batch.includes(banned));
  assert.ok(batches.some((b) => b.includes('/sid/') && b.includes("'Untitled'") && b.includes("'Accounts'") && !b.includes('Forecast')));
  assert.ok(batches.some((b) => b.includes('/fid/') && b.includes("'Forecast'")));
  const n = calls.length;
  await readFinanceSheets(env, { fetchImpl });
  assert.equal(calls.length, n, 'second read served from cache');
});

// ---- API + Access ----
import { handleFinance, buildPayload } from '../src/finance/api.js';
import { _resetAccessCache } from '../src/finance/access.js';

const readStub = async () => ({ ledger: [H, row({ type: 'Revenue', amount: '1000', cat: 'Project' }), row({ type: 'Expense', amount: '9', acc: 'KMake Kasikorn Wallet', realm: 'Personal' })], accounts: ACCOUNTS, forecast: forecastRows('2026-10', [1, 1, 1, 1, 1, 1, 1]) });
const apiReq = (host = 'dashboard.gomma.cc', hdr = {}) => new Request(`https://${host}/api/finance`, { headers: hdr });

test('finance API fails closed without Access configuration', async () => {
  const res = await handleFinance(apiReq(), {}, { read: readStub });
  assert.equal(res.status, 503);
});

test('finance API rejects a missing or forged Access token', async () => {
  _resetAccessCache();
  const env = { CF_ACCESS_TEAM_DOMAIN: 't.cloudflareaccess.com', CF_ACCESS_AUD: 'aud' };
  assert.equal((await handleFinance(apiReq(), env, { read: readStub })).status, 401);
  const forged = `${btoa('{"alg":"RS256","kid":"k"}')}.${btoa('{"aud":["aud"]}')}.AAAA`;
  const fetchImpl = async () => Response.json({ keys: [] });
  assert.equal((await handleFinance(apiReq('dashboard.gomma.cc', { 'Cf-Access-Jwt-Assertion': forged }), env, { read: readStub, fetchImpl })).status, 401);
});

test('finance API accepts a validly signed Access token for the right audience', async () => {
  _resetAccessCache();
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 'k1' };
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const sign = async (claims) => {
    const body = `${b({ alg: 'RS256', kid: 'k1' })}.${b(claims)}`;
    const sig = Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(body))).toString('base64url');
    return `${body}.${sig}`;
  };
  const env = { CF_ACCESS_TEAM_DOMAIN: 't.cloudflareaccess.com', CF_ACCESS_AUD: 'aud', FINANCE_ALLOWED_EMAIL: 'me@x.com' };
  const base = { aud: ['aud'], iss: 'https://t.cloudflareaccess.com', exp: Math.floor(Date.now() / 1000) + 600, email: 'me@x.com' };
  const fetchImpl = async () => Response.json({ keys: [jwk] });
  const ok = await handleFinance(apiReq('dashboard.gomma.cc', { 'Cf-Access-Jwt-Assertion': await sign(base) }), env, { read: readStub, fetchImpl });
  assert.equal(ok.status, 200);
  const text = await ok.text();
  assert.ok(!text.includes('KMake') && !text.includes('88117-0'));
  const wrongAud = await handleFinance(apiReq('dashboard.gomma.cc', { 'Cf-Access-Jwt-Assertion': await sign({ ...base, aud: ['x'] }) }), env, { read: readStub, fetchImpl });
  assert.equal(wrongAud.status, 401);
  const otherUser = await handleFinance(apiReq('dashboard.gomma.cc', { 'Cf-Access-Jwt-Assertion': await sign({ ...base, email: 'evil@x.com' }) }), env, { read: readStub, fetchImpl });
  assert.equal(otherUser.status, 403);
  const expired = await handleFinance(apiReq('dashboard.gomma.cc', { 'Cf-Access-Jwt-Assertion': await sign({ ...base, exp: 1 }) }), env, { read: readStub, fetchImpl });
  assert.equal(expired.status, 401);
});

test('dev bypass only works on localhost', async () => {
  const env = { FINANCE_DEV_BYPASS: 'true' };
  assert.equal((await handleFinance(apiReq('localhost'), env, { read: readStub })).status, 200);
  assert.equal((await handleFinance(apiReq('dashboard.gomma.cc'), env, { read: readStub })).status, 503);
});

test('payload marks past / current / future months', () => {
  const data = { ledger: [H], accounts: ACCOUNTS, forecast: forecastWide(['2026-09', '2026-10', '2026-11'], () => [1, 1, 1, 1, 1, 1, 1]) };
  const p = buildPayload(data, new Date('2026-10-13T05:00:00Z'));
  assert.deepEqual(p.months.map((m) => m.status), ['past', 'current', 'future']);
});

// ---- saved monthly reports (D1) ----
import { handleReports, _resetSchema } from '../src/finance/reports.js';

function fakeD1() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      let args = [];
      const stmt = {
        bind: (...a) => { args = a; return stmt; },
        run: async () => {
          if (/INSERT INTO month_reports/.test(sql)) rows.set(args[0], { month: args[0], saved_at: args[1], data: args[2] });
          return { success: true };
        },
        all: async () => ({ results: [...rows.values()].sort((a, b) => b.month.localeCompare(a.month)) }),
      };
      return stmt;
    },
  };
}
const localReq = (path, method = 'GET', hdr = {}) => new Request(`http://localhost${path}`, { method, headers: hdr });
const reportRead = async () => ({ ledger: [H, row({ type: 'Revenue', amount: '1000', cat: 'Project' })], accounts: ACCOUNTS, forecast: forecastRows('2026-10', [1000, 0, 0, 0, 0, 0, 0]) });
const dev = (db) => ({ FINANCE_DEV_BYPASS: 'true', FINANCE_DB: db });

test('reports: refuses without Access, and says so when storage is not configured', async () => {
  _resetSchema();
  assert.equal((await handleReports(new Request('https://dashboard.gomma.cc/api/finance/reports'), { CF_ACCESS_TEAM_DOMAIN: 't', CF_ACCESS_AUD: 'a', FINANCE_DB: fakeD1() })).status, 401);
  assert.equal((await handleReports(localReq('/api/finance/reports'), { FINANCE_DEV_BYPASS: 'true' })).status, 503);
});

test('reports: saving stores a server-computed snapshot, and re-saving updates it', async () => {
  _resetSchema();
  const db = fakeD1();
  const put = await handleReports(localReq('/api/finance/reports/2026-10', 'PUT'), dev(db), { read: reportRead });
  assert.equal(put.status, 200);
  const saved = await put.json();
  assert.equal(saved.month, '2026-10');
  assert.equal(saved.data.lines.find((l) => l.line === 'Revenue').actual, 1000);
  const list = await (await handleReports(localReq('/api/finance/reports'), dev(db))).json();
  assert.equal(list.reports.length, 1);
  assert.equal(list.reports[0].data.lines.find((l) => l.line === 'Revenue').forecast, 1000);
  await handleReports(localReq('/api/finance/reports/2026-10', 'PUT'), dev(db), { read: reportRead });
  assert.equal(db.rows.size, 1);
});

test('reports: unknown month, wrong method and cross-origin writes are rejected', async () => {
  _resetSchema();
  const db = fakeD1();
  assert.equal((await handleReports(localReq('/api/finance/reports/2031-01', 'PUT'), dev(db), { read: reportRead })).status, 404);
  assert.equal((await handleReports(localReq('/api/finance/reports/2026-10', 'DELETE'), dev(db))).status, 405);
  assert.equal((await handleReports(localReq('/api/finance/reports/2026-10', 'PUT', { Origin: 'https://evil.example' }), dev(db), { read: reportRead })).status, 403);
  assert.equal(db.rows.size, 0);
});

// ---- two business accounts (Reserve + Budget Wallet) ----
test('a second Business account adds to cash, and moves between them change neither profit nor total cash', () => {
  const accounts = parseAccounts([
    ACCOUNTS[0],
    ACCOUNTS[1],
    ['a5', 'Budget Wallet', 'checking', 'THB', 'KBank', '240-2-98118-3', '500', '2026-10-01', '', '', 'Business'],
    ACCOUNTS[2],
  ]);
  const rows = businessRows([H,
    row({ type: 'Revenue', amount: '1000', cat: 'Project', acc: 'Reserve' }),
    row({ type: 'Transfer Out', amount: '300', cat: 'Internal Transfer', t: 'To Budget Wallet', acc: 'Reserve' }),
    row({ type: 'Transfer In', amount: '300', cat: 'Internal Transfer', t: 'From Reserve', acc: 'Budget Wallet' }),
    row({ type: 'Expense', amount: '50', cat: 'Software', acc: 'Budget Wallet' }),
  ], accounts);
  assert.equal(accounts.find((a) => a.name === 'Budget Wallet').mask, 'x1183');
  const m = monthSummary('2026-10', rows, accounts, parseForecast(forecastRows('2026-10', [0, 0, 0, 0, 0, 0, 0])));
  const get = (n) => m.lines.find((l) => l.line === n).actual;
  assert.equal(get('Revenue'), 1000);
  assert.equal(get('Operating costs'), 50);
  assert.equal(get('Closing cash'), 1000 + 500 + 1000 - 50);
});

test('personal-realm revenue and refunds never count as business income or reduce business costs', () => {
  const accounts = parseAccounts(ACCOUNTS);
  const rows = businessRows([H,
    row({ type: 'Revenue', amount: '1000', cat: 'Client Payment' }),
    row({ type: 'Revenue', amount: '179', cat: 'Refund', realm: 'Personal' }),
    row({ type: 'Revenue', amount: '1', cat: 'Other', realm: 'Personal' }),
    row({ type: 'Revenue', amount: '50', cat: 'Refund', realm: 'Business' }),
    row({ type: 'Expense', amount: '400', cat: 'Software' }),
  ], accounts);
  const m = monthSummary('2026-10', rows, accounts, parseForecast(forecastRows('2026-10', [0, 0, 0, 0, 0, 0, 0])));
  const get = (n) => m.lines.find((l) => l.line === n).actual;
  assert.equal(get('Revenue'), 1000);
  assert.equal(get('Operating costs'), 400 - 50);
  // The money is real, so cash still includes every row.
  assert.equal(get('Closing cash'), 1000 + 1000 + 179 + 1 + 50 - 400);
});

test('history: one entry per month, business rows only, clients anonymous, gaps filled', () => {
  const accounts = parseAccounts(ACCOUNTS);
  const rows = businessRows([H,
    row({ type: 'Revenue', amount: '48000', cat: 'Client Payment', t: 'Client Payment - ALPHA', date: '31/8/2026' }),
    row({ type: 'Revenue', amount: '12000', cat: 'Client Payment', t: 'Client Payment - BETA', date: '31/8/2026' }),
    row({ type: 'Expense', amount: '300', cat: 'Transport', date: '10/8/2026' }),
    row({ type: 'Expense', amount: '999', cat: 'Dining Out', realm: 'Personal', date: '10/8/2026' }),
    row({ type: 'Revenue', amount: '999', cat: 'Refund', realm: 'Personal', date: '11/8/2026' }),
    // nothing in September
    row({ type: 'Revenue', amount: '30000', cat: 'Client Payment', t: 'Client Payment - ALPHA', date: '29/10/2026' }),
    row({ type: 'Transfer Out', amount: '25000', t: 'Owner salary', date: '1/10/2026' }),
  ], accounts);
  const h = monthlyHistory(rows, accounts, '2026-10');
  assert.deepEqual(h.map((m) => m.month), ['2026-08', '2026-09', '2026-10']);
  assert.deepEqual(h.map((m) => m.status), ['past', 'past', 'current']);
  assert.equal(h[0].revenue, 60000);
  assert.equal(h[0].operatingCosts, 300);
  assert.deepEqual(h[0].spend, { Transport: 300 });
  assert.deepEqual(h[0].clients, { c1: 48000, c2: 12000 });
  assert.deepEqual(h[1].clients, {});
  assert.deepEqual(h[2].clients, { c1: 30000 });
  assert.equal(h[2].ownerSalary, 25000);
  assert.ok(!JSON.stringify(h).includes('ALPHA'));
  assert.equal(h[2].closingCash, 1000 + 60000 - 300 + 30000 - 25000);
});
