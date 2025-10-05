import { NextRequest, NextResponse } from 'next/server';
import { NovaRole } from '../shared/types/auth-types';
import {
  authenticateRequest,
  createLoginRedirect,
  createForbiddenResponse,
  checkRolePermission,
} from '../shared/middleware/auth-middleware';

// NovaOS GodMode Protection Middleware
// Secures all administrative interfaces with JWT + RBAC

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes with their required roles
  const protectedRoutes: { path: string; requiredRole: NovaRole }[] = [
    { path: '/godmode', requiredRole: 'godmode' },
    { path: '/admin', requiredRole: 'admin' },
    { path: '/management', requiredRole: 'admin' },
  ];

  // Check if current path needs protection
  const protectedRoute = protectedRoutes.find((route) => pathname.startsWith(route.path));

  if (protectedRoute) {
    // Authenticate the request
    const { user, error } = await authenticateRequest(request);

    if (error || !user) {
      return createLoginRedirect(request, 'godmode_access_required');
    }

    // Check if user has required role
    if (!checkRolePermission(user.role, protectedRoute.requiredRole)) {
      return createForbiddenResponse(
        `GodMode Access Denied. Required role: ${protectedRoute.requiredRole} or higher`
      );
    }

    // Add security headers for admin routes
    const response = NextResponse.next();

    // Add user info to headers
    response.headers.set('X-User-ID', user.id);
    response.headers.set('X-User-Email', user.email);
    response.headers.set('X-User-Role', user.role);

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
    response.headers.set('X-NovaOS-Protected', 'true');

    return response;
  }

  // Allow request to proceed for non-protected routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/godmode/:path*', '/admin/:path*', '/management/:path*'],
};
