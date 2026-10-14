import { verifyAccess } from './access.js';
import { businessMetrics, businessRows, isPassThrough, isPersonalSpend, monthSummary, parseAccounts, parseForecast, publicTransactions } from './ledger.js';
import { readFinanceSheets } from './sheets.js';

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });

const bangkokMonth = (now = new Date()) => new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 7);

export function buildPayload({ ledger, accounts, forecast }, now = new Date()) {
  const accs = parseAccounts(accounts);
  const rows = businessRows(ledger, accs);
  const fc = parseForecast(forecast);
  const current = bangkokMonth(now);
  const months = Object.keys(fc).sort().map((month) => ({
    ...monthSummary(month, rows, accs, fc),
    status: month < current ? 'past' : month === current ? 'current' : 'future',
  }));
  // Operating spend to date by category: business expenses only, never personal or pass-through money.
  const elapsed = new Set(months.filter((m) => m.status !== 'future').map((m) => m.month));
  const byCategory = new Map();
  for (const r of rows) {
    if (r.type !== 'Expense' || !elapsed.has(r.month) || isPassThrough(r) || isPersonalSpend(r)) continue;
    const key = r.category || 'Other';
    byCategory.set(key, (byCategory.get(key) || 0) + r.amount);
  }
  const spend = [...byCategory]
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);

  return { generatedAt: now.toISOString(), currentMonth: current, months, spend, metrics: businessMetrics(rows, accs, current), transactions: publicTransactions(rows, 100) };
}

export async function handleFinance(request, env, deps = {}) {
  if (request.method !== 'GET') return reply({ error: 'method' }, 405);
  const access = await verifyAccess(request, env, deps);
  if (!access.ok) return reply({ error: 'unauthorized' }, access.status);
  try {
    const data = await (deps.read || readFinanceSheets)(env, deps);
    return reply(buildPayload(data));
  } catch (err) {
    console.error('finance', err?.message);
    return reply({ error: 'unavailable', detail: err?.constructor?.name === 'FinanceDataError' ? err.message : undefined }, 502);
  }
}
