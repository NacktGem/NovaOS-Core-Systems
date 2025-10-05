// Next.js Middleware for NovaOS Authentication
import { NextRequest, NextResponse } from 'next/server';
import { NovaRole, NovaUser, AuthUtils } from '../types/auth-types';

// Extract JWT token from request
export function extractToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const tokenCookie = request.cookies.get('nova_token');
  if (tokenCookie?.value) {
    return tokenCookie.value;
  }

  // Check query params (less secure, for special cases)
  const tokenParam = request.nextUrl.searchParams.get('token');
  if (tokenParam) {
    return tokenParam;
  }

  return null;
}

// Verify JWT token with NovaOS Core API
export async function verifyTokenWithAPI(
  token: string
): Promise<{ user?: NovaUser; error?: string }> {
  try {
    const coreApiUrl = process.env.CORE_API_URL || 'http://localhost:8760';
    const response = await fetch(`${coreApiUrl}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return { error: `Token verification failed: ${response.status}` };
    }

    const data = await response.json();
    return { user: data.user };
  } catch (error) {
    console.error('Token verification error:', error);
    return { error: 'Token verification service unavailable' };
  }
}

// Authenticate request and extract user
export async function authenticateRequest(
  request: NextRequest
): Promise<{ user?: NovaUser; error?: string }> {
  const token = extractToken(request);

  if (!token) {
    return { error: 'No authentication token provided' };
  }

  // First, validate JWT structure
  if (!AuthUtils.validateJWTStructure(token)) {
    return { error: 'Invalid token format' };
  }

  // Parse JWT payload for basic validation
  const claims = AuthUtils.parseJWTPayload(token);
  if (!claims) {
    return { error: 'Invalid token payload' };
  }

  // Check if token is expired
  if (AuthUtils.isTokenExpired(claims)) {
    return { error: 'Token has expired' };
  }

  // Verify with Core API for real-time validation
  return await verifyTokenWithAPI(token);
}

// Check if user has required role
export function checkRolePermission(
  userRole: NovaRole,
  requiredRole: NovaRole,
  allowedTiers?: string[],
  userTiers?: string[]
): boolean {
  // Check role hierarchy
  if (!AuthUtils.hasRole(userRole, requiredRole)) {
    return false;
  }

  // Check tier restrictions if specified
  if (allowedTiers && allowedTiers.length > 0) {
    if (!userTiers || userTiers.length === 0) {
      return false;
    }
    return allowedTiers.some((tier) => userTiers.includes(tier));
  }

  return true;
}

// Create error responses
export function createForbiddenResponse(message: string = 'Access denied'): NextResponse {
  return NextResponse.json(
    {
      error: 'Forbidden',
      message,
      status: 403,
    },
    { status: 403 }
  );
}

export function createUnauthorizedResponse(
  message: string = 'Authentication required'
): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message,
      status: 401,
    },
    { status: 401 }
  );
}

// Create login redirect
export function createLoginRedirect(request: NextRequest, error?: string): NextResponse {
  const loginUrl = new URL('/login', request.url);
  if (error) {
    loginUrl.searchParams.set('error', error);
  }
  return NextResponse.redirect(loginUrl);
}

// Middleware factory for role-based protection
export function createRoleMiddleware(requiredRole: NovaRole, allowedTiers?: string[]) {
  return (request: NextRequest) => {
    // Allow public routes to pass through
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/') {
      return NextResponse.next();
    }

    return authenticateRequest(request).then(({ user, error }) => {
      if (error || !user) {
        return createLoginRedirect(request, error);
      }

      if (!checkRolePermission(user.role, requiredRole, allowedTiers, user.tiers)) {
        return createForbiddenResponse(`Requires ${requiredRole} role or higher`);
      }

      // Add user info to headers for downstream consumption
      const response = NextResponse.next();
      response.headers.set('X-User-ID', user.id);
      response.headers.set('X-User-Email', user.email);
      response.headers.set('X-User-Role', user.role);
      if (user.tiers) {
        response.headers.set('X-User-Tiers', user.tiers.join(','));
      }

      return response;
    });
  };
}
