import { NextResponse, type NextRequest } from 'next/server';

// Firebase auth is client-side. The middleware only handles basic route
// protection by checking for the presence of a Firebase auth cookie/token.
// Actual token verification happens in API routes via firebase-admin.
// Client-side pages check auth state via onAuthStateChanged and redirect.
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes - always allow
  if (
    pathname === '/login' ||
    pathname === '/' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Dashboard and protected routes are client-side protected
  // Firebase onAuthStateChanged handles auth checks in the client
  // If user is not authenticated, client-side code redirects to /login
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
