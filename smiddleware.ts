import { NextResponse } from 'next/server';

export function middleware(req: Request) {
  const url = new URL(req.url);
  if (process.env.NODE_ENV === 'development' && url.hostname === 'localhost') {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-forwarded-proto', 'https');
    requestHeaders.set('x-forwarded-host', 'google.com');
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  return NextResponse.next();
}
