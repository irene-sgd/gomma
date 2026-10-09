const API = 'https://api.notion.com/v1';
const VERSION = '2025-09-03';
const MAX = 2000;

export const rt = (text) => ({
  rich_text: text ? [{ type: 'text', text: { content: String(text).slice(0, MAX) } }] : [],
});
export const sel = (name) => ({ select: { name } });
const title = (text) => ({ title: [{ type: 'text', text: { content: String(text).slice(0, MAX) } }] });

export function notion(env, path, { method = 'GET', body, token } = {}) {
  return fetch(`${API}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token || env.NOTION_TOKEN}`,
      'Notion-Version': VERSION,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function ok(res, what) {
  if (!res.ok) throw new Error(`Notion ${what} failed (${res.status})`);
  return res.json();
}

const text = (prop) => (prop?.rich_text || prop?.title || []).map((t) => t.plain_text).join('');

export function readRow(page) {
  const p = page.properties || {};
  return {
    id: page.id,
    createdTime: page.created_time,
    companyName: text(p.Name),
    website: p.Website?.url || '',
    founders: text(p.Founders),
    registrationNumber: text(p['Registration No.']),
    founded: p.Founded?.date?.start || '',
    session: text(p['Screening Session']),
    result: p['Screening Result']?.select?.name || '',
    status: p.Status?.status?.name || '',
  };
}

// Re-read the row right before a write so two syncs running at once don't both record a result.
export async function stillActive(env, row) {
  const current = readRow(await ok(await notion(env, `pages/${row.id}`), 'read page'));
  return current.session === row.session && current.result === 'Not screened';
}

const query = (env, filter, pageSize = 20) =>
  notion(env, `data_sources/${env.CRM_DATA_SOURCE_ID}/query`, {
    method: 'POST',
    body: { filter, page_size: pageSize },
  }).then((res) => ok(res, 'query'));

export async function findRecentDuplicate(env, lead) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const data = await query(
    env,
    {
      and: [
        { property: 'Email', email: { equals: lead.contactEmail } },
        { property: 'Name', title: { equals: lead.companyName } },
        { timestamp: 'created_time', created_time: { on_or_after: since } },
      ],
    },
    1
  );
  return data.results.length > 0;
}

export async function countRecentScreenings(env, limit) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const data = await query(
    env,
    {
      and: [
        { property: 'Screening Session', rich_text: { is_not_empty: true } },
        { timestamp: 'created_time', created_time: { on_or_after: since } },
      ],
    },
    limit
  );
  return data.results.length;
}

export async function activeScreenings(env) {
  const data = await query(env, {
    and: [
      { property: 'Screening Session', rich_text: { is_not_empty: true } },
      { property: 'Screening Result', select: { equals: 'Not screened' } },
    ],
  });
  return data.results.map(readRow);
}

const heading = (content) => ({
  type: 'heading_2',
  heading_2: { rich_text: [{ type: 'text', text: { content } }] },
});
const bullet = (label, value) => ({
  type: 'bulleted_list_item',
  bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `${label}: ${value || '—'}`.slice(0, MAX) } }] },
});

export const sectionHeading = heading;

export async function createLeadPage(env, lead) {
  const properties = {
    Name: title(lead.companyName),
    Category: sel('Client'),
    Status: { status: { name: 'Pending' } },
    'Screening Result': sel('Not screened'),
    Website: { url: lead.website },
    Email: { email: lead.contactEmail },
    'Contact Name': rt(lead.contactName),
    Country: rt(lead.country),
    Founders: rt(lead.founders),
    'Team Structure': rt(lead.teamStructure),
    'Project Type': sel(lead.projectType),
    'Budget Range': rt(lead.budgetRange),
    Timeline: rt(lead.timeline),
    'Master Project Dashboard': { relation: [{ id: env.PROJECT_PAGE_ID }] },
    'Area Category': { relation: [{ id: env.AREA_PAGE_ID }] },
  };
  if (lead.registrationNumber) properties['Registration No.'] = rt(lead.registrationNumber);
  if (lead.registrationDate) properties.Founded = { date: { start: lead.registrationDate } };

  const children = [
    heading('Application'),
    bullet('Company', lead.companyName),
    bullet('Website', lead.website),
    bullet('Country', lead.country),
    bullet('Registration number', lead.registrationNumber),
    bullet('Registration date', lead.registrationDate),
    bullet('Founders', lead.founders),
    bullet('Team structure', lead.teamStructure),
    bullet('Project type', lead.projectType),
    bullet('Budget range', lead.budgetRange),
    bullet('Timeline', lead.timeline),
    bullet('Contact', `${lead.contactName} <${lead.contactEmail}>`),
  ];

  const page = await ok(
    await notion(env, 'pages', {
      method: 'POST',
      body: { parent: { type: 'data_source_id', data_source_id: env.CRM_DATA_SOURCE_ID }, properties, children },
    }),
    'create page'
  );
  return page.id;
}

export async function updateLead(env, pageId, properties) {
  await ok(await notion(env, `pages/${pageId}`, { method: 'PATCH', body: { properties } }), 'update page');
}

export async function appendBlocks(env, pageId, blocks) {
  for (let i = 0; i < blocks.length; i += 90) {
    await ok(
      await notion(env, `blocks/${pageId}/children`, { method: 'PATCH', body: { children: blocks.slice(i, i + 90) } }),
      'append blocks'
    );
  }
}
