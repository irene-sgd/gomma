// Ledger and accounts from finance-dashboard's D1 database, through the LEDGER_DB binding.
// finance-dashboard owns that database and is its only writer (see its docs/lommi.md).
// The binding could write, so this module is the only code that touches it, and it only runs
// the fixed SELECTs below.
import { FinanceDataError } from './ledger.js';

// Only rows on active Business accounts leave the database; personal rows are never read.
export const LEDGER_SQL = `SELECT transaction_name, type, amount, category, realm, paid_date, notes, account
FROM ledger
WHERE deleted_at IS NULL
  AND account IN (SELECT name FROM accounts WHERE scope = 'Business' AND archived_at IS NULL)
ORDER BY paid_date, id`;

// Every account, personal ones included: their names are needed to redact them from labels.
export const ACCOUNTS_SQL = `SELECT name, account_number, opening_balance, opening_date, archived_at, scope
FROM accounts
ORDER BY sort_order, name`;

const LEDGER_HEADER = ['Transaction', 'Type', 'Amount', 'Category', 'Realm', 'Paid Date', 'Notes', 'Account'];
const ACCOUNTS_HEADER = ['Name', 'Account Number', 'Opening Balance', 'Opening Date', 'Archived At', 'Scope'];

// Returns the same header + rows tables the ledger model parses.
export async function readLedger(env) {
  const db = env.LEDGER_DB;
  if (!db) throw new FinanceDataError('LEDGER_DB binding is not set');
  let ledger, accounts;
  try {
    [ledger, accounts] = await db.batch([db.prepare(LEDGER_SQL), db.prepare(ACCOUNTS_SQL)]);
  } catch {
    throw new FinanceDataError('Ledger database unreadable');
  }
  return {
    ledger: [
      LEDGER_HEADER,
      ...ledger.results.map((r) => [r.transaction_name, r.type, r.amount, r.category, r.realm, r.paid_date ?? '', r.notes, r.account]),
    ],
    accounts: [
      ACCOUNTS_HEADER,
      ...accounts.results.map((r) => [r.name, r.account_number, r.opening_balance, r.opening_date, r.archived_at ?? '', r.scope ?? '']),
    ],
  };
}
