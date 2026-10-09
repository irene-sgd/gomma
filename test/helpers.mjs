export const env = () => ({
  ALLOWED_ORIGIN: 'https://gomma.cc',
  INTAKE_ENABLED: 'true',
  AUTO_SCREEN: 'false',
  NOTION_TOKEN: 'ntn_server',
  ANTHROPIC_API_KEY: 'sk-test',
  AGENT_ID: 'agent_1',
  AGENT_VERSION: '1',
  ENVIRONMENT_ID: 'env_1',
  CRM_DATA_SOURCE_ID: '3097286d-055f-8027-821c-000b6bbfb421',
  PROJECT_PAGE_ID: '3287286d-055f-80c0-9ca4-f9c214de534c',
  AREA_PAGE_ID: '31d7286d-055f-80ad-8253-fb00a192c8ef',
  SESSION_BUDGET_CENTS: '300',
  DAILY_AUTO_SCREEN_CAP: '25',
  SCREENING_TIMEOUT_MIN: '15',
  INTAKE_LIMITER: { limit: async () => ({ success: true }) },
});

export const goodLead = () => ({
  companyName: 'Aurora Collective',
  website: 'aurora-collective.org',
  country: 'Thailand',
  registrationNumber: '0105561000001',
  registrationDate: '2019-04-02',
  founders: 'Mali Chai, Ken Aoki',
  teamStructure: '6 people: 2 curators, 2 producers, 1 designer, 1 ops',
  projectType: 'Culture and social causes',
  budgetRange: '$15k-$50k',
  timeline: '3-6 months',
  contactName: 'Mali Chai',
  contactEmail: 'Mali@Aurora-Collective.org',
});

export function resetCaches() {
  const store = new Map();
  globalThis.caches = {
    default: {
      match: async (req) => store.get(req.url),
      put: async (req, res) => void store.set(req.url, res),
    },
  };
}

// routes: [{ method, match: RegExp, reply: object | (call) => object }]; reply may carry { status, body }
export function mockFetch(routes) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      method: init.method || 'GET',
      url: String(url),
      body: init.body ? JSON.parse(init.body) : undefined,
      headers: init.headers || {},
    };
    calls.push(call);
    const route = routes.find((r) => r.method === call.method && r.match.test(call.url));
    if (!route) return new Response('{}', { status: 404 });
    const out = typeof route.reply === 'function' ? route.reply(call) : route.reply;
    const wrapped = 'body' in out;
    return new Response(JSON.stringify(wrapped ? out.body : out), { status: wrapped ? out.status ?? 200 : 200 });
  };
  return calls;
}

export const intakeRequest = (body, { origin = 'https://gomma.cc', method = 'POST' } = {}) =>
  new Request('https://dashboard.gomma.cc/api/intake', {
    method,
    headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });

export const ctx = () => {
  const pending = [];
  return { waitUntil: (p) => pending.push(p), settle: () => Promise.all(pending) };
};

export const row = (overrides = {}) => ({
  id: 'row-1',
  created_time: '2026-10-09T09:00:00Z',
  properties: {
    Name: { title: [{ plain_text: 'Aurora Collective' }] },
    Website: { url: 'https://aurora-collective.org/' },
    Founders: { rich_text: [{ plain_text: 'Mali Chai' }] },
    'Registration No.': { rich_text: [] },
    Founded: { date: null },
    'Screening Session': { rich_text: [{ plain_text: 'sesn_1' }] },
    'Screening Result': { select: { name: 'Not screened' } },
    Status: { status: { name: 'Pending' } },
    ...overrides,
  },
});
