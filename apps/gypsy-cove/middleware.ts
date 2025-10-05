import { NextRequest, NextResponse } from 'next/server';
import { NovaRole } from '../shared/types/auth-types';
import {
  authenticateRequest,
  createLoginRedirect,
  createForbiddenResponse,
  checkRolePermission,
} from '../shared/middleware/auth-middleware';

// Enhanced Admin route protection middleware for GypsyCove
// Implements JWT + RBAC security with proper error handling
// Authentication via authHeader (JWT) and sessionCookie validation

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes with their required roles
  const protectedRoutes: { path: string; requiredRole: NovaRole }[] = [
    { path: '/admin', requiredRole: 'admin' },
    { path: '/console', requiredRole: 'admin' },
    { path: '/management', requiredRole: 'admin' },
    { path: '/godmode', requiredRole: 'godmode' },
    { path: '/dashboard', requiredRole: 'creator' },
  ];

  // Check if current path needs protection
  const protectedRoute = protectedRoutes.find((route) => pathname.startsWith(route.path));

  if (protectedRoute) {
    // Authenticate the request
    const { user, error } = await authenticateRequest(request);

    if (error || !user) {
      return createLoginRedirect(request, 'authentication_required');
    }

    // Check if user has required role
    if (!checkRolePermission(user.role, protectedRoute.requiredRole)) {
      return createForbiddenResponse(
        `Access denied. Required role: ${protectedRoute.requiredRole} or higher`
      );
    }

    // Add security headers for admin routes
    const response = NextResponse.next();

    // Add user info to headers
    response.headers.set('X-User-ID', user.id);
    response.headers.set('X-User-Email', user.email);
    response.headers.set('X-User-Role', user.role);

    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');

    return response;
  }

  // Allow request to proceed for non-protected routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/console/:path*',
    '/management/:path*',
    '/godmode/:path*',
    '/dashboard/:path*',
  ],
};
