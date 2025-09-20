import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateRequestSync,
  createLoginRedirect,
  createForbiddenResponse,
  AuthenticationError,
  AuthorizationError,
  NovaRole,
} from '../shared/lib/auth-utils';

// Web-Shell Admin Protection Middleware
// Secures admin interface with JWT + RBAC

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes with their required roles
  const protectedRoutes = [
    { path: '/admin', roles: ['admin', 'superadmin', 'godmode'] as NovaRole[] },
  ];

  // Check if current path needs protection
  const protectedRoute = protectedRoutes.find((route) => pathname.startsWith(route.path));

  if (protectedRoute) {
    try {
      // Authenticate and authorize the request
      authenticateRequestSync(request, protectedRoute.roles);

      // Add security headers for admin routes
      const response = NextResponse.next();

      // Security headers to prevent indexing and caching of admin interfaces
      response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
      response.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      );
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'no-referrer');

      // Custom header to indicate this is a protected route
      response.headers.set('X-WebShell-Protected', 'true');

      return response;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return createLoginRedirect(request, 'admin_access_required');
      }
      if (error instanceof AuthorizationError) {
        return createForbiddenResponse(
          `Admin Access Denied. Required roles: ${protectedRoute.roles.join(', ')}`
        );
      }
      return createForbiddenResponse('Authentication failed');
    }
  }

  // Allow request to proceed for non-protected routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
