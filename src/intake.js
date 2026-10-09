import { json } from './http.js';
import { countRecentScreenings, createLeadPage, findRecentDuplicate } from './notion.js';
import { startScreening } from './screening.js';
import { validateLead } from './validate.js';

const MAX_BODY = 20000;

async function acquireLock(lead) {
  const data = new TextEncoder().encode(`${lead.contactEmail}|${lead.companyName.toLowerCase()}`);
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const key = new Request(`https://intake-lock.invalid/${hash}`);
  if (await caches.default.match(key)) return false;
  await caches.default.put(key, new Response('1', { headers: { 'Cache-Control': 'max-age=60' } }));
  return true;
}

async function autoScreen(env, pageId, lead) {
  const cap = Number(env.DAILY_AUTO_SCREEN_CAP);
  if ((await countRecentScreenings(env, cap)) >= cap) return;
  await startScreening(env, pageId, lead);
}

export async function handleIntake(request, env, ctx) {
  if (request.headers.get('Origin') !== env.ALLOWED_ORIGIN) return json({ error: 'forbidden' }, 403);
  const cors = { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN, Vary: 'Origin' };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...cors,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);
  if (env.INTAKE_ENABLED !== 'true' || !env.NOTION_TOKEN) return json({ error: 'unavailable' }, 503, cors);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const { success } = await env.INTAKE_LIMITER.limit({ key: ip });
  if (!success) return json({ error: 'rate_limited' }, 429, { ...cors, 'Retry-After': '60' });

  if (Number(request.headers.get('Content-Length')) > MAX_BODY) return json({ error: 'too_large' }, 413, cors);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: 'too_large' }, 413, cors);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid_json' }, 400, cors);
  }

  if (body && body.nickname) return json({ ok: true }, 202, cors); // honeypot: pretend success

  const { lead, errors } = validateLead(body);
  if (errors) return json({ error: 'validation', fields: errors }, 400, cors);

  try {
    if (!(await acquireLock(lead)) || (await findRecentDuplicate(env, lead))) {
      return json({ ok: true }, 202, cors);
    }
    const pageId = await createLeadPage(env, lead);
    if (env.AUTO_SCREEN === 'true') {
      ctx.waitUntil(autoScreen(env, pageId, lead).catch((e) => console.error('autoScreen', e.message)));
    }
  } catch (error) {
    console.error('intake', error.message);
    return json({ error: 'server_error' }, 500, cors);
  }
  return json({ ok: true }, 202, cors);
}
