import { NextResponse } from 'next/server';

function isAllowedLocalOrigin(origin: string | null) {
  if (!origin) return false;
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

export function buildCorsHeaders(request: Request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  const origin = request.headers.get('origin');
  if (isAllowedLocalOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Vary', 'Origin');
  }

  return headers;
}

export function optionsWithCors(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request),
  });
}

export function jsonWithCors(
  request: Request,
  data: unknown,
  init: ConstructorParameters<typeof NextResponse.json>[1] = {}
) {
  const response = NextResponse.json(data, init);
  const corsHeaders = buildCorsHeaders(request);
  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}

export function textWithCors(
  request: Request,
  body: string,
  init: ConstructorParameters<typeof NextResponse>[1] = {}
) {
  const response = new NextResponse(body, init);
  const corsHeaders = buildCorsHeaders(request);
  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}

export function devOnlyGuard(request: Request) {
  if (process.env.NODE_ENV === 'development') {
    return null;
  }
  return textWithCors(request, 'Editor available only in development.', {
    status: 403,
  });
}
