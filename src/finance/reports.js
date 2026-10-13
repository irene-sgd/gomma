// Saved monthly reports (actuals vs forecast, frozen at the time the month was closed).
// Stored in D1 (binding FINANCE_DB). The snapshot is computed on the server from the sheets,
// never taken from the browser.
import { verifyAccess } from './access.js';
import { buildPayload } from './api.js';
import { readFinanceSheets } from './sheets.js';

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });

let schemaReady = false;
export const _resetSchema = () => { schemaReady = false; };

async function ensureSchema(db) {
  if (schemaReady) return;
  await db
    .prepare('CREATE TABLE IF NOT EXISTS month_reports (month TEXT PRIMARY KEY, saved_at TEXT NOT NULL, data TEXT NOT NULL)')
    .run();
  schemaReady = true;
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function listReports(db) {
  await ensureSchema(db);
  const { results } = await db.prepare('SELECT month, saved_at, data FROM month_reports ORDER BY month DESC').all();
  return results.map((r) => ({ month: r.month, savedAt: r.saved_at, data: JSON.parse(r.data) }));
}

export async function saveReport(db, month, data, now = new Date()) {
  await ensureSchema(db);
  const savedAt = now.toISOString();
  await db
    .prepare('INSERT INTO month_reports (month, saved_at, data) VALUES (?1, ?2, ?3) ON CONFLICT(month) DO UPDATE SET saved_at = ?2, data = ?3')
    .bind(month, savedAt, JSON.stringify(data))
    .run();
  return { month, savedAt, data };
}

export async function handleReports(request, env, deps = {}) {
  const access = await verifyAccess(request, env, deps);
  if (!access.ok) return reply({ error: 'unauthorized' }, access.status);
  if (!env.FINANCE_DB) return reply({ error: 'storage' }, 503);

  const url = new URL(request.url);
  const match = /^\/api\/finance\/reports(?:\/(\d{4}-\d{2}))?$/.exec(url.pathname);
  if (!match) return reply({ error: 'not found' }, 404);

  try {
    if (request.method === 'GET' && !match[1]) {
      return reply({ reports: await listReports(env.FINANCE_DB) });
    }
    if (request.method === 'PUT' && match[1]) {
      const origin = request.headers.get('Origin');
      if (origin && origin !== url.origin) return reply({ error: 'forbidden' }, 403);
      const month = match[1];
      if (!MONTH.test(month)) return reply({ error: 'month' }, 400);
      const payload = buildPayload(await (deps.read || readFinanceSheets)(env, deps), deps.now);
      const found = payload.months.find((m) => m.month === month);
      if (!found) return reply({ error: 'month not in forecast' }, 404);
      return reply(await saveReport(env.FINANCE_DB, month, found, deps.now));
    }
    return reply({ error: 'method' }, 405);
  } catch (err) {
    console.error('finance reports', err?.message);
    return reply({ error: 'unavailable' }, 502);
  }
}
