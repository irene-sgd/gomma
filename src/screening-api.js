import { bearer, json } from './http.js';
import { notion, readRow } from './notion.js';
import { pollScreenings, startScreening } from './screening.js';

const normalize = (id) => String(id || '').replace(/-/g, '').toLowerCase();

// Staff-only: the caller proves access by reading the CRM with their own Notion key.
export async function handleScreeningApi(request, env, action) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const token = bearer(request);
  if (!token) return json({ error: 'unauthorized' }, 401);
  if (!env.NOTION_TOKEN || !env.ANTHROPIC_API_KEY) return json({ error: 'unavailable' }, 503);

  if (action === 'sync') {
    const access = await notion(env, `data_sources/${env.CRM_DATA_SOURCE_ID}`, { token });
    if (!access.ok) return json({ error: 'forbidden' }, 403);
    return json({ ok: true, ...(await pollScreenings(env)) });
  }

  const { pageId } = await request.json().catch(() => ({}));
  if (!/^[0-9a-f-]{32,36}$/i.test(pageId || '')) return json({ error: 'invalid_request' }, 400);

  const res = await notion(env, `pages/${pageId}`, { token });
  if (!res.ok) return json({ error: 'forbidden' }, 403);
  const page = await res.json();
  if (normalize(page.parent?.data_source_id) !== normalize(env.CRM_DATA_SOURCE_ID)) {
    return json({ error: 'forbidden' }, 403);
  }

  const row = readRow(page);
  if (row.session) return json({ error: 'already_running' }, 409);
  if (row.result !== 'Not screened') return json({ error: 'already_screened' }, 409);

  const started = await startScreening(env, row.id, row);
  return started.ok ? json({ ok: true }) : json({ error: 'start_failed' }, 502);
}
