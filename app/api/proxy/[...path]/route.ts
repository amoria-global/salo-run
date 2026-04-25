import { NextRequest, NextResponse } from 'next/server';

// In production both vars resolve to https://backend.connekyt.com.
// In local dev they decouple so the frontend can route every API call through
// this same-origin proxy (NEXT_PUBLIC_API_URL=http://localhost:3001/api/proxy)
// while the proxy itself still talks to the live backend (BACKEND_API_URL).
// Without this split, setting NEXT_PUBLIC_API_URL to the proxy URL would make
// the proxy try to call itself recursively.
const API_BASE_URL = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL) as string;

const ALLOWED_ORIGINS = new Set<string>([
  'https://connekyt.com',
  'https://www.connekyt.com',
  'https://dashboard.connekyt.com',
  'http://localhost:3000',
  'http://localhost:3001',
]);

// Only proxy paths under these prefixes; anything else → 403
const ALLOWED_PATH_PREFIXES = [
  'api/remote/',
  'uploads/',
];

const REQUEST_TIMEOUT_MS = 30_000;

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'GET');
}
export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'POST');
}
export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'PUT');
}
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'PATCH');
}
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'DELETE');
}

function corsHeadersFor(origin: string | null): Record<string, string> {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    };
  }
  return {};
}

function isPathAllowed(path: string): boolean {
  if (path.includes('..') || path.includes('\\') || path.includes('\0')) return false;
  return ALLOWED_PATH_PREFIXES.some(prefix => path.startsWith(prefix));
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const origin = request.headers.get('origin');
  const cors = corsHeadersFor(origin);

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  const path = pathSegments.join('/');
  if (!isPathAllowed(path)) {
    return NextResponse.json(
      { error: 'Path not allowed by proxy', path },
      { status: 403, headers: cors }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    const url = new URL(path, baseUrl);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const headers: HeadersInit = {};
    const authHeader = request.headers.get('authorization');
    if (authHeader) headers['Authorization'] = authHeader;
    // Forward the browser's cookies to the backend so it can read the
    // amoria_auth HttpOnly session cookie (for the cookie-based auth
    // rollout). All cookies carried here are already scoped to
    // dashboard.connekyt.com, so there's no leak of other-origin state.
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) headers['Cookie'] = cookieHeader;
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (method !== 'GET' && method !== 'DELETE') {
      const bodyContentType = request.headers.get('content-type') || '';
      if (bodyContentType.includes('application/json')) {
        try {
          const body = await request.json();
          fetchOptions.body = JSON.stringify(body);
          headers['Content-Type'] = 'application/json';
        } catch {
          // No JSON body — continue without body
        }
      } else if (bodyContentType) {
        const rawBody = await request.arrayBuffer();
        if (rawBody.byteLength > 0) {
          fetchOptions.body = rawBody;
          headers['Content-Type'] = bodyContentType;
        }
      }
    }

    const response = await fetch(url.toString(), fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    // Build response headers: CORS + any Set-Cookie echoed from the backend.
    // In production the backend sets Domain=.connekyt.com so the cookie is
    // shared across connekyt.com, dashboard.connekyt.com, backend.connekyt.com.
    // In local dev the proxy's host is localhost — a Domain=.connekyt.com
    // attribute on a Set-Cookie returned from localhost gets rejected by the
    // browser as a cross-domain cookie. Strip the Domain attribute in that
    // case so the cookie becomes host-only on `localhost`. Host-only cookies
    // match by hostname only (port-agnostic), so a cookie set during login on
    // localhost:3000 will also be sent to localhost:3001 — exactly what we
    // need to bridge landing → dashboard locally.
    const proxyHost = (request.headers.get('host') || '').toLowerCase();
    const isLocalhost = proxyHost.startsWith('localhost') || proxyHost.startsWith('127.0.0.1');
    const responseHeaders = new Headers(cors);
    const setCookies = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];
    for (const sc of setCookies) {
      const rewritten = isLocalhost ? sc.replace(/;\s*Domain=[^;]+/i, '') : sc;
      responseHeaders.append('Set-Cookie', rewritten);
    }

    if (contentType.startsWith('image/') || contentType.startsWith('application/octet-stream')) {
      responseHeaders.set('Content-Type', contentType);
      responseHeaders.set('Cache-Control', 'public, max-age=86400');
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      {
        error: aborted ? 'Upstream timeout' : 'Proxy request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: aborted ? 504 : 502, headers: cors }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const cors = corsHeadersFor(origin);
  return new NextResponse(null, {
    status: 204,
    headers: cors,
  });
}
