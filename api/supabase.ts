export const config = { runtime: 'edge' };

const SUPABASE_DOMAIN = '.supabase.co'; // acepta cualquier proyecto
const FORWARD_HEADERS = ['content-type', 'apikey', 'authorization', 'prefer', 'range', 'x-client-info'];

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(req.url);
  const targetUrl = url.searchParams.get('_url');

  if (!targetUrl || !targetUrl.includes(SUPABASE_DOMAIN)) {
    return new Response('Bad request', { status: 400 });
  }

  const headers = new Headers();
  for (const h of FORWARD_HEADERS) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? req.body : null;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    // @ts-ignore
    duplex: 'half',
  });

  const resHeaders = new Headers(response.headers);
  resHeaders.set('Access-Control-Allow-Origin', '*');
  resHeaders.delete('transfer-encoding');
  resHeaders.delete('connection');

  return new Response(response.body, {
    status: response.status,
    headers: resHeaders,
  });
}
