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

// A row of the Inbound Leads database (raw leads from the quote form).
export function readRow(page) {
  const p = page.properties || {};
  return {
    id: page.id,
    url: page.url,
    createdTime: page.created_time,
    companyName: text(p.Name),
    contactName: text(p['Contact Name']),
    contactEmail: p.Email?.email || '',
    project: text(p.Topic),
    website: p.Website?.url || '',
    founders: text(p.Founders),
    registrationNumber: text(p['Registration No.']),
    founded: p.Founded?.date?.start || '',
    session: text(p['Screening Session']),
    result: p['Screening Result']?.select?.name || '',
    flags: (p['Failed Flags']?.multi_select || []).map((f) => f.name),
    stage: p.Stage?.select?.name || '',
    crmIds: (p['Master CRM']?.relation || []).map((r) => r.id),
  };
}

// Re-read the row right before a write so two syncs running at once don't both record a result.
export async function stillActive(env, row) {
  const current = readRow(await ok(await notion(env, `pages/${row.id}`), 'read page'));
  return current.session === row.session && current.result === 'Not screened';
}

const query = (env, dataSourceId, filter, pageSize = 20) =>
  notion(env, `data_sources/${dataSourceId}/query`, {
    method: 'POST',
    body: { filter, page_size: pageSize },
  }).then((res) => ok(res, 'query'));

const inbox = (env, filter, pageSize) => query(env, env.INBOX_DATA_SOURCE_ID, filter, pageSize);

export async function findRecentDuplicate(env, lead) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const data = await inbox(
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
  const data = await inbox(
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
  const data = await inbox(env, {
    and: [
      { property: 'Screening Session', rich_text: { is_not_empty: true } },
      { property: 'Screening Result', select: { equals: 'Not screened' } },
    ],
  });
  return data.results.map(readRow);
}

export const sectionHeading = (content) => ({
  type: 'heading_2',
  heading_2: { rich_text: [{ type: 'text', text: { content } }] },
});

export async function createLeadPage(env, lead) {
  const properties = {
    Name: title(lead.companyName),
    Email: { email: lead.contactEmail },
    'Contact Name': rt(lead.contactName),
    Topic: rt(lead.project),
    Stage: sel('New'),
    'Screening Result': sel('Not screened'),
  };

  const page = await ok(
    await notion(env, 'pages', {
      method: 'POST',
      body: { parent: { type: 'data_source_id', data_source_id: env.INBOX_DATA_SOURCE_ID }, properties },
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

// ---- Master CRM: qualified leads only ----

export async function findCrmRow(env, row) {
  const data = await query(
    env,
    env.CRM_DATA_SOURCE_ID,
    {
      and: [
        { property: 'Email', email: { equals: row.contactEmail } },
        { property: 'Name', title: { equals: row.companyName } },
      ],
    },
    1
  );
  return data.results[0]?.id || null;
}

export async function createCrmRow(env, row) {
  const properties = {
    Name: title(row.companyName),
    Category: sel('Client'),
    Status: { status: { name: row.result === 'Pass' ? 'Confirmed' : 'Pending' } },
    Email: { email: row.contactEmail },
    'Contact Name': rt(row.contactName),
    Topic: rt(row.project),
    'Screening Result': sel(row.result),
    'Failed Flags': { multi_select: row.flags.map((name) => ({ name })) },
    'Screening Session': rt(row.session),
    'Master Project Dashboard': { relation: [{ id: env.PROJECT_PAGE_ID }] },
    'Area Category': { relation: [{ id: env.AREA_PAGE_ID }] },
  };
  if (row.website) properties.Website = { url: row.website };
  if (row.founders) properties.Founders = rt(row.founders);
  if (row.registrationNumber) properties['Registration No.'] = rt(row.registrationNumber);
  if (row.founded) properties.Founded = { date: { start: row.founded } };

  const children = [
    {
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { type: 'text', text: { content: 'Screening report and application: ' } },
          { type: 'text', text: { content: 'open the inbound lead', link: { url: row.url } } },
        ],
      },
    },
  ];

  const page = await ok(
    await notion(env, 'pages', {
      method: 'POST',
      body: { parent: { type: 'data_source_id', data_source_id: env.CRM_DATA_SOURCE_ID }, properties, children },
    }),
    'create CRM page'
  );
  return page.id;
}

export const markQualified = (env, row, crmId) =>
  updateLead(env, row.id, { Stage: sel('Qualified'), 'Master CRM': { relation: [{ id: crmId }] } });
