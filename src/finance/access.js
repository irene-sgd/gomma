// Verifies the Cloudflare Access JWT so the data endpoint refuses anything that bypasses the gate.
const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const json = (s) => JSON.parse(new TextDecoder().decode(b64u(s)));

let jwks = null;

async function keys(team, fetchImpl) {
  if (jwks && Date.now() - jwks.at < 3_600_000) return jwks.keys;
  const res = await fetchImpl(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('certs');
  jwks = { at: Date.now(), keys: (await res.json()).keys };
  return jwks.keys;
}

export const _resetAccessCache = () => { jwks = null; };

export async function verifyAccess(request, env, { fetchImpl = fetch } = {}) {
  const host = new URL(request.url).hostname;
  if (env.FINANCE_DEV_BYPASS === 'true' && (host === 'localhost' || host === '127.0.0.1')) return { ok: true };
  if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) return { ok: false, status: 503 };

  const token = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, status: 401 };
  try {
    const head = json(parts[0]);
    const claims = json(parts[1]);
    if (head.alg !== 'RS256') return { ok: false, status: 401 };
    const jwk = (await keys(env.CF_ACCESS_TEAM_DOMAIN, fetchImpl)).find((k) => k.kid === head.kid);
    if (!jwk) return { ok: false, status: 401 };
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    const aud = [].concat(claims.aud || []);
    const now = Math.floor(Date.now() / 1000);
    if (!valid || !aud.includes(env.CF_ACCESS_AUD) || claims.iss !== `https://${env.CF_ACCESS_TEAM_DOMAIN}` || !(claims.exp > now)) return { ok: false, status: 401 };
    if (env.FINANCE_ALLOWED_EMAIL && String(claims.email || '').toLowerCase() !== env.FINANCE_ALLOWED_EMAIL.toLowerCase()) return { ok: false, status: 403 };
    return { ok: true };
  } catch {
    return { ok: false, status: 401 };
  }
}
