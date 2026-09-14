import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Environment variables for secret routing
  const secretKey1 = process.env.SECRET_KEY1;
  const secretKey2 = process.env.SECRET_KEY2;

  // Protect API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Builder Panel Routing Logic (MOD-02)
  if (secretKey1 && secretKey2) {
    const builderRoute = `/${secretKey1}/${secretKey2}`;
    
    // If user accesses the correct secret builder route, rewrite internally to the actual dashboard path
    if (pathname === builderRoute || pathname.startsWith(`${builderRoute}/`)) {
      const internalPath = pathname.replace(builderRoute, '/builder');
      return NextResponse.rewrite(new URL(internalPath, request.url));
    }
    
    // Prevent direct access to /builder without the secret keys
    if (pathname.startsWith('/builder')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect Customer Dashboard
  if (pathname.startsWith('/dashboard')) {
    const customerSession = request.cookies.get('customer_session');
    if (!customerSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect root to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow all other routes to pass through (which will hit the License User Panel at /)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
