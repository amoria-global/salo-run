import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

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

    if (contentType.startsWith('image/') || contentType.startsWith('application/octet-stream')) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: response.status,
        headers: {
          ...cors,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: response.status,
      headers: cors,
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
