// Business-only finance model. Pure functions: no I/O, no secrets.
// Everything not belonging to a Business account is dropped before any calculation.

export class FinanceDataError extends Error {}

export const LINES = ['Revenue', 'Operating costs', 'Tax reserve', 'Equipment fund', 'Owner salary', 'Owner transfers', 'Closing cash'];

const PASS_THROUGH_CATEGORIES = ['royalties', 'loan - sister'];
const PASS_THROUGH_TRANSFER_WORDS = /bitcoin|btc|binance/i;
const PERSONAL_CATEGORIES = ['entertainment', 'personal care', 'debt payment', 'credit card', 'royalties', 'healthcare', 'dining out', 'grocery'];
const TOLERANCE = 0.1;

const norm = (s) => String(s ?? '').trim().toLowerCase();

export function parseAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value ?? '').replace(/,/g, '').trim();
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Paid Date is D/M/YYYY text. Never routed through Date parsing of the sheet locale.
export function parseDMY(text) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(text ?? '').trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  if (mo < 1 || mo > 12 || d < 1 || d > last) return null;
  return { y, m: mo, d, iso: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`, month: `${y}-${String(mo).padStart(2, '0')}` };
}

// Bank style: x + the last 4 digits of the full number, as the bank's own statements disclose it
// (240-2-88117-0 -> x1170). Numbers with fewer than 4 digits show nothing.
export function maskAccount(number) {
  const digits = String(number ?? '').replace(/\D/g, '');
  return digits.length >= 4 ? `x${digits.slice(-4)}` : '';
}

function columnMap(header, required, label) {
  const index = new Map(header.map((h, i) => [norm(h), i]));
  const missing = required.filter((name) => !index.has(norm(name)));
  if (missing.length) throw new FinanceDataError(`${label}: missing column ${missing.join(', ')}`);
  return (row, name) => row[index.get(norm(name))] ?? '';
}

const ACCOUNT_COLUMNS = ['Name', 'Account Number', 'Opening Balance', 'Opening Date', 'Archived At'];
const LEDGER_COLUMNS = ['Transaction', 'Type', 'Amount', 'Category', 'Realm', 'Status', 'Paid Date', 'Notes', 'Account'];

// Column K carries scope; its header cell is blank in the live sheet.
export function parseAccounts(rows) {
  if (!rows?.length) throw new FinanceDataError('Accounts: empty');
  const [header, ...body] = rows;
  const get = columnMap(header, ACCOUNT_COLUMNS, 'Accounts');
  const scopeIdx = header.findIndex((h) => norm(h) === 'scope');
  const scopeAt = scopeIdx >= 0 ? scopeIdx : 10;
  return body
    .filter((r) => norm(get(r, 'Name')) !== '')
    .map((r) => ({
      name: String(get(r, 'Name')).trim(),
      scope: norm(r[scopeAt]) === 'business' ? 'Business' : 'Personal',
      archived: norm(get(r, 'Archived At')) !== '',
      openingBalance: parseAmount(get(r, 'Opening Balance')) ?? 0,
      openingDate: String(get(r, 'Opening Date')).trim(),
      mask: maskAccount(get(r, 'Account Number')),
    }));
}

export function businessAccounts(accounts) {
  return accounts.filter((a) => a.scope === 'Business' && !a.archived);
}

// Forecast comes from the GØMMA Studio Financial Model: one row per line, one column per month.
// Our seven lines are derived from its rows; "Operating costs" includes Collaborators (direct
// costs) so it compares like-for-like with ledger expenses.
const FORECAST_ROWS = {
  Revenue: ['Total revenue'],
  'Operating costs': ['Total operating costs', 'Collaborators'],
  'Tax reserve': ['Tax reserve'],
  'Equipment fund': ['Equipment fund'],
  'Owner salary': ['Owner salary'],
  'Owner transfers': ['Owner goal transfers'],
  'Closing cash': ['Closing studio cash'],
};
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function forecastMonth(cell) {
  if (typeof cell === 'number' && cell > 20000 && cell < 80000) {
    // Sheets date serial: days since 1899-12-30.
    return new Date(Date.UTC(1899, 11, 30) + Math.round(cell) * 86_400_000).toISOString().slice(0, 7);
  }
  const m = /^([A-Za-z]{3})[A-Za-z]*\s+(\d{4})$/.exec(String(cell ?? '').trim());
  const idx = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  return idx >= 0 ? `${m[2]}-${String(idx + 1).padStart(2, '0')}` : null;
}

// Handles numbers, "1,234", "(9,132)" and "-" (zero).
function forecastAmount(value) {
  if (typeof value === 'number') return value;
  const t = String(value ?? '').trim();
  if (t === '' || t === '-' || t === '\\-') return 0;
  const neg = /^\(.*\)$/.test(t);
  const n = parseAmount(t.replace(/[()$]/g, ''));
  return n === null ? null : neg ? -n : n;
}

export function parseForecast(rows) {
  if (!rows?.length) throw new FinanceDataError('Forecast: empty');
  const headerAt = rows.findIndex((r) => norm(r[0]) === 'month');
  if (headerAt < 0) throw new FinanceDataError('Forecast: no Month row');
  const cols = rows[headerAt].map((c, i) => [forecastMonth(c), i]).filter(([m]) => m);
  if (!cols.length) throw new FinanceDataError('Forecast: no month columns');

  const body = rows.slice(headerAt + 1);
  const find = (label) => {
    const r = body.find((row) => norm(row[0]) === norm(label));
    if (!r) throw new FinanceDataError(`Forecast: missing row "${label}"`);
    return r;
  };
  const out = {};
  for (const [month] of cols) out[month] = {};
  for (const [line, labels] of Object.entries(FORECAST_ROWS)) {
    const sources = labels.map((label) => {
      try { return find(label); } catch (err) { if (label === 'Collaborators') return null; throw err; }
    });
    for (const [month, i] of cols) {
      let total = 0;
      for (const src of sources) {
        if (!src) continue;
        const v = forecastAmount(src[i]);
        if (v === null) throw new FinanceDataError(`Forecast: unreadable value for ${src[0]} ${month}`);
        total += v;
      }
      out[month][line] = Math.round(total * 100) / 100;
    }
  }
  return out;
}

// Scope filter first, then parsing. Returns only fields that are safe to serialise.
export function businessRows(ledgerRows, accounts) {
  if (!ledgerRows?.length) throw new FinanceDataError('Ledger: empty');
  const [header, ...body] = ledgerRows;
  const get = columnMap(header, LEDGER_COLUMNS, 'Ledger');
  const byName = new Map(businessAccounts(accounts).map((a) => [norm(a.name), a]));
  if (!byName.size) throw new FinanceDataError('Accounts: no active Business account');

  // Personal account names must never appear, even inside a business transaction's label.
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const personal = accounts.filter((a) => a.name && !byName.has(norm(a.name)));
  const words = personal.filter((a) => !a.archived).map((a) => a.name.split(/\s+/)[0]).filter((w) => w.length >= 5);
  const hidden = [...personal.map((a) => a.name), ...words].sort((x, y) => y.length - x.length).map(esc);
  const redact = hidden.length ? (t) => t.replace(new RegExp(hidden.join('|'), 'gi'), 'personal') : (t) => t;

  const rows = [];
  for (const r of body) {
    const account = byName.get(norm(get(r, 'Account')));
    if (!account) continue;
    const date = parseDMY(get(r, 'Paid Date'));
    const amount = parseAmount(get(r, 'Amount'));
    if (!date || amount === null) throw new FinanceDataError(`Ledger: unreadable date or amount on a ${account.name} row (${get(r, 'Paid Date')})`);
    const type = String(get(r, 'Type')).trim();
    if (!['Revenue', 'Expense', 'Transfer In', 'Transfer Out'].includes(type)) throw new FinanceDataError(`Ledger: unknown type "${type}"`);
    rows.push({
      date: date.iso,
      month: date.month,
      type,
      amount,
      category: redact(String(get(r, 'Category')).trim()),
      realm: String(get(r, 'Realm')).trim(),
      transaction: redact(String(get(r, 'Transaction')).trim()),
      account: account.name,
      accountMask: account.mask,
      _text: norm(`${get(r, 'Transaction')} ${get(r, 'Category')} ${get(r, 'Notes')}`),
    });
  }
  return rows;
}

export const isPassThrough = (row) =>
  PASS_THROUGH_CATEGORIES.includes(norm(row.category)) || (row.type.startsWith('Transfer') && PASS_THROUGH_TRANSFER_WORDS.test(row._text));

// Personal-realm revenue (refunds of personal purchases, verification credits) is not business income.
export const isPersonalIncome = (row) => row.type === 'Revenue' && norm(row.realm) === 'personal';

export const isPersonalSpend = (row) =>
  row.type === 'Expense' && (norm(row.realm) === 'personal' || PERSONAL_CATEGORIES.includes(norm(row.category)));

export function transferLine(row) {
  if (row.type !== 'Transfer Out') return null;
  const t = row._text;
  if (/salary/.test(t) && !/borrow/.test(t)) return 'Owner salary';
  if (/norway/.test(t)) return 'Owner transfers';
  if (/\btax\b/.test(t)) return 'Tax reserve';
  if (/equipment/.test(t)) return 'Equipment fund';
  return null;
}

export function compare(actual, forecast) {
  const difference = round2(actual - forecast);
  const off = forecast === 0 ? actual !== 0 : Math.abs(actual - forecast) / Math.abs(forecast) > TOLERANCE;
  return { actual: round2(actual), forecast, difference, off };
}

const round2 = (n) => Math.round(n * 100) / 100;

// Actuals for one month from the ledger, keyed by line name. No forecast needed.
export function monthActuals(month, rows, accounts) {
  const kept = rows.filter((r) => !isPassThrough(r));
  const inMonth = kept.filter((r) => r.month === month);
  const sum = (arr) => arr.reduce((s, r) => s + r.amount, 0);

  const businessIncome = inMonth.filter((r) => r.type === 'Revenue' && !isPersonalIncome(r));
  const refunds = sum(businessIncome.filter((r) => norm(r.category) === 'refund'));
  const revenue = sum(businessIncome.filter((r) => norm(r.category) !== 'refund'));
  const businessExpenses = sum(inMonth.filter((r) => r.type === 'Expense' && !isPersonalSpend(r)));
  const transfers = Object.fromEntries(LINES.map((l) => [l, 0]));
  for (const r of inMonth) {
    const line = transferLine(r);
    if (line) transfers[line] += r.amount;
  }

  // Closing cash is the real balance: every row on a Business account, pass-through included.
  const monthEnd = `${month}-31`;
  let closing = 0;
  for (const a of businessAccounts(accounts)) {
    closing += a.openingBalance;
    for (const r of rows) {
      if (r.account !== a.name || r.date < a.openingDate || r.date > monthEnd) continue;
      closing += r.type === 'Revenue' || r.type === 'Transfer In' ? r.amount : -r.amount;
    }
  }

  return {
    Revenue: revenue,
    'Operating costs': businessExpenses - refunds + transfers['Equipment fund'],
    'Tax reserve': transfers['Tax reserve'],
    'Equipment fund': transfers['Equipment fund'],
    'Owner salary': transfers['Owner salary'],
    'Owner transfers': transfers['Owner transfers'],
    'Closing cash': closing,
  };
}

export function monthSummary(month, rows, accounts, forecast) {
  const f = forecast[month];
  if (!f) throw new FinanceDataError(`Forecast: no row for ${month}`);
  const actual = monthActuals(month, rows, accounts);
  const lines = LINES.map((line) => ({ line, ...compare(actual[line], f[line]) }));
  const off = lines.filter((l) => l.off).length;
  return { month, lines, onTrack: lines.length - off, off };
}

const addMonths = (month, delta) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

// Business health numbers from real ledger activity only (no forecast):
//  burn           average monthly operating costs plus owner salary
//  breakEven      monthly revenue that covers burn once the tax reserve share is set aside
//  runway         current cash in months of burn
//  concentration  the largest client's share of revenue (never the name)
// Burn averages up to the last 3 closed months; before any month has closed, the running month.
export function businessMetrics(rows, accounts, currentMonth) {
  const seen = [...new Set(rows.map((r) => r.month))].sort();
  const closed = seen.filter((m) => m < currentMonth).slice(-3);
  const window = closed.length ? closed : [currentMonth];

  const actuals = window.map((m) => monthActuals(m, rows, accounts));
  const avg = (key) => actuals.reduce((t, a) => t + a[key], 0) / actuals.length;
  const burn = avg('Operating costs') + avg('Owner salary');
  const revenueTotal = actuals.reduce((t, a) => t + a.Revenue, 0);
  const taxTotal = actuals.reduce((t, a) => t + a['Tax reserve'], 0);
  const taxShare = revenueTotal > 0 ? Math.min(taxTotal / revenueTotal, 0.9) : 0;
  const breakEven = burn / (1 - taxShare);

  const cash = monthActuals(currentMonth, rows, accounts)['Closing cash'];
  const runway = burn > 0 ? cash / burn : null;

  // Concentration: the 3 calendar months ending now, so a quiet month does not hide a client.
  const span = new Set([addMonths(currentMonth, -2), addMonths(currentMonth, -1), currentMonth]);
  const byClient = new Map();
  for (const r of rows) {
    if (!span.has(r.month) || r.type !== 'Revenue' || isPassThrough(r) || isPersonalIncome(r)) continue;
    if (norm(r.category) === 'refund') continue;
    byClient.set(r.transaction, (byClient.get(r.transaction) || 0) + r.amount);
  }
  const total = [...byClient.values()].reduce((t, v) => t + v, 0);
  const top = Math.max(0, ...byClient.values());
  const round = (n) => Math.round(n * 100) / 100;

  return {
    window,
    burn: round(burn),
    taxShare: Math.round(taxShare * 1000) / 1000,
    breakEven: round(breakEven),
    cash: round(cash),
    runway: runway === null ? null : Math.round(runway * 10) / 10,
    concentration: {
      share: total > 0 ? Math.round((top / total) * 1000) / 1000 : null,
      clients: byClient.size,
      months: [...span].sort(),
    },
  };
}

// Neutral labels for transfers: the free text on a transfer is often personal context.
const TRANSFER_LABEL = {
  'Owner salary': 'Owner salary',
  'Owner transfers': 'Owner transfer',
  'Tax reserve': 'Tax reserve',
  'Equipment fund': 'Equipment fund',
};

// Safe-to-serialise transactions for the recent list (no notes, no full account number).
export function publicTransactions(rows, limit = 50) {
  return rows
    .filter((r) => !isPassThrough(r) && !isPersonalSpend(r))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((r) => ({
      date: r.date,
      type: r.type,
      amount: r.amount,
      category: r.category,
      transaction: r.type.startsWith('Transfer') ? TRANSFER_LABEL[transferLine(r)] || r.type : r.transaction,
      account: r.account,
      accountMask: r.accountMask,
    }));
}
