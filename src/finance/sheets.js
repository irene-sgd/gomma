// Read-only Google Sheets access. Only GET requests, only the readonly scope.
import { FinanceDataError } from './ledger.js';

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const API = 'https://sheets.googleapis.com/v4/spreadsheets';
const TTL_MS = 120_000;

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (s) => new TextEncoder().encode(s);

async function accessToken(env, fetchImpl) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = b64url(enc(JSON.stringify({ iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })));
  const pem = String(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY).replace(/\\n/g, '\n').replace(/-----[^-]+-----|\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc(`${header}.${claim}`));
  const res = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claim}.${b64url(sig)}` }),
  });
  if (!res.ok) throw new FinanceDataError('Sheets auth failed');
  return (await res.json()).access_token;
}

async function get(url, token, fetchImpl) {
  const res = await fetchImpl(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new FinanceDataError(`Sheets read failed (${res.status})`);
  return res.json();
}

const quote = (title) => `'${title.replace(/'/g, "''")}'`;
let cache = null;

// Ledger + Accounts come from the Master Finance sheet; the forecast comes from the Financial Model.
// Nothing else is requested.
export async function readFinanceSheets(env, { fetchImpl = fetch, now = Date.now } = {}) {
  if (cache && now() - cache.at < TTL_MS) return cache.value;
  const id = env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const forecastId = env.GOOGLE_FORECAST_SPREADSHEET_ID;
  if (!id) throw new FinanceDataError('GOOGLE_SHEETS_SPREADSHEET_ID is not set');
  if (!forecastId) throw new FinanceDataError('GOOGLE_FORECAST_SPREADSHEET_ID is not set');
  const token = await accessToken(env, fetchImpl);

  const meta = await get(`${API}/${id}?fields=sheets.properties.title`, token, fetchImpl);
  const titles = (meta.sheets || []).map((s) => s.properties.title);
  const ledger = titles[0];
  if (!titles.includes('Accounts')) throw new FinanceDataError('Missing tab: Accounts');

  const range = (t) => `ranges=${encodeURIComponent(quote(t))}`;
  const main = await get(`${API}/${id}/values:batchGet?${range(ledger)}&${range('Accounts')}&valueRenderOption=FORMATTED_VALUE`, token, fetchImpl);
  let model;
  try {
    model = await get(`${API}/${forecastId}/values:batchGet?${range('Forecast')}&valueRenderOption=UNFORMATTED_VALUE`, token, fetchImpl);
  } catch {
    throw new FinanceDataError('Forecast sheet unreadable (is it shared with the service account, and is there a Forecast tab?)');
  }
  const [l, a] = main.valueRanges.map((v) => v.values || []);
  const value = { ledger: l, accounts: a, forecast: model.valueRanges[0].values || [] };
  cache = { at: now(), value };
  return value;
}

export const _resetCache = () => { cache = null; };
