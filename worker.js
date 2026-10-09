import { handleEstimate } from './src/estimate.js';
import { handleIntake } from './src/intake.js';
import { handleScreeningApi } from './src/screening-api.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/intake') return handleIntake(request, env, ctx);
    if (url.pathname === '/api/estimate') return handleEstimate(request, env);
    if (url.pathname === '/api/screening/start') return handleScreeningApi(request, env, 'start');
    if (url.pathname === '/api/screening/sync') return handleScreeningApi(request, env, 'sync');
    if (url.pathname === '/api/leads/qualify') return handleScreeningApi(request, env, 'qualify');

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type, Notion-Version',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE'
        }
      });
    }

    if (url.pathname.startsWith('/v1/')) {
      const notionUrl = 'https://api.notion.com' + url.pathname + url.search;
      const res = await fetch(notionUrl, {
        method: request.method,
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: request.method !== 'GET' ? request.body : undefined,
      });
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response('Not found', { status: 404 });
  }
}
