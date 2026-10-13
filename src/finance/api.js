import { verifyAccess } from './access.js';
import { businessRows, monthSummary, parseAccounts, parseForecast, publicTransactions } from './ledger.js';
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
  return { generatedAt: now.toISOString(), currentMonth: current, months, transactions: publicTransactions(rows, 100) };
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
