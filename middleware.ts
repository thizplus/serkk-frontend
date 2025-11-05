import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/auth/callback'];
  const isPublicPath = publicPaths.includes(pathname);

  // Auth pages
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(pathname);

  // Protected paths that require authentication
  const protectedPaths = [
    '/create-post',
    '/edit-post',
    '/my-posts',
    '/profile/edit',
    '/notifications',
    '/saved',
  ];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // If user is logged in and tries to access auth pages, redirect to home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not logged in and tries to access protected page, redirect to login
  if (!token && isProtectedPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)' ,
  ],
};
