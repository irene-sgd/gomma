export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type, Notion-Version',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE'
        }
      });
    }

    // Proxy Notion API calls only
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

    return new Response('Notion proxy — use /v1/ endpoints', { status: 200 });
  }
}
