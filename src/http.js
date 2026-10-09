export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export function bearer(request) {
  const match = /^Bearer (\S+)$/.exec(request.headers.get('Authorization') || '');
  return match ? match[1] : null;
}
