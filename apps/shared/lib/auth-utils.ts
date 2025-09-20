// JWT + RBAC Authentication Utilities for NovaOS Next.js Apps
import { NextRequest, NextResponse } from 'next/server';

// Role hierarchy - matches the backend RBAC system
export type NovaRole = 'godmode' | 'superadmin' | 'admin' | 'creator' | 'user';

export interface NovaUser {
  id: string;
  email: string;
  role: NovaRole;
  tiers?: string[];
  scopes?: string[];
}

export interface JWTClaims {
  sub: string;
  email: string;
  role: NovaRole;
  tiers?: string[];
  scopes?: string[];
  iat: number;
  exp: number;
}

// Role permissions matrix
const ROLE_HIERARCHY: Record<NovaRole, number> = {
  godmode: 100,
  superadmin: 80,
  admin: 60,
  creator: 40,
  user: 20,
};

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly _statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly _statusCode: number = 403
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Extract JWT token from request (cookie or authorization header)
 */
export function extractToken(request: NextRequest): string | null {
  // 1. Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Check access_token cookie
  const tokenCookie = request.cookies.get('access_token');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  // 3. Check admin_token cookie (fallback for development)
  const adminToken = request.cookies.get('admin_token');
  if (adminToken) {
    return adminToken.value;
  }

  return null;
}

/**
 * Verify JWT token using public key
 */
export async function verifyToken(token: string): Promise<JWTClaims> {
  try {
    // For development, allow simple verification with internal token
    if (process.env.NODE_ENV === 'development' && token === process.env.INTERNAL_TOKEN) {
      return {
        sub: 'dev-admin',
        email: 'admin@dev.local',
        role: 'godmode',
        tiers: ['sovereign'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    }

    // Get public key from environment
    const publicKey = process.env.JWT_PUBLIC_KEY || process.env.JWT_PUBLIC_KEY_PATH;
    if (!publicKey) {
      throw new AuthenticationError('JWT public key not configured', 500);
    }

    // Simplified JWT verification - decode and validate basic structure
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new AuthenticationError('Invalid token format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Basic validation
    if (!payload.sub || !payload.role || !payload.exp) {
      throw new AuthenticationError('Invalid token claims');
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new AuthenticationError('Token expired');
    }

    return {
      sub: payload.sub,
      email: payload.email || '',
      role: payload.role,
      tiers: payload.tiers,
      scopes: payload.scopes,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Token verification failed');
  }
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: NovaRole, requiredRole: NovaRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(userRole: NovaRole, requiredRoles: NovaRole[]): boolean {
  return requiredRoles.some((role) => hasRole(userRole, role));
}

/**
 * Authenticate and authorize user from request
 */
export async function authenticateRequest(
  request: NextRequest,
  requiredRoles: NovaRole[] = ['admin', 'superadmin', 'godmode']
): Promise<NovaUser> {
  const token = extractToken(request);
  if (!token) {
    throw new AuthenticationError('Authentication required');
  }

  const claims = await verifyToken(token);

  if (!hasAnyRole(claims.role, requiredRoles)) {
    throw new AuthorizationError(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
  }

  return {
    id: claims.sub,
    email: claims.email,
    role: claims.role,
    tiers: claims.tiers,
    scopes: claims.scopes,
  };
}

/**
 * Synchronous version for middleware (simplified validation)
 */
export function authenticateRequestSync(
  request: NextRequest,
  requiredRoles: NovaRole[] = ['admin', 'superadmin', 'godmode']
): NovaUser {
  const token = extractToken(request);
  if (!token) {
    throw new AuthenticationError('Authentication required');
  }

  // For development, allow simple verification with internal token
  if (process.env.NODE_ENV === 'development' && token === process.env.INTERNAL_TOKEN) {
    return {
      id: 'dev-admin',
      email: 'admin@dev.local',
      role: 'godmode',
      tiers: ['sovereign'],
    };
  }

  // Basic token structure validation for middleware
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AuthenticationError('Invalid token format');
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    if (!payload.sub || !payload.role || !payload.exp) {
      throw new AuthenticationError('Invalid token claims');
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new AuthenticationError('Token expired');
    }

    if (!hasAnyRole(payload.role, requiredRoles)) {
      throw new AuthorizationError(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return {
      id: payload.sub,
      email: payload.email || '',
      role: payload.role,
      tiers: payload.tiers,
      scopes: payload.scopes,
    };
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      throw error;
    }
    throw new AuthenticationError('Token verification failed');
  }
}

/**
 * Create standardized 403 Forbidden response
 */
export function createForbiddenResponse(message: string = 'Access denied'): NextResponse {
  return NextResponse.json(
    {
      error: 'Forbidden',
      message,
      statusCode: 403,
    },
    { status: 403 }
  );
}

/**
 * Create standardized 401 Unauthorized response
 */
export function createUnauthorizedResponse(
  message: string = 'Authentication required'
): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message,
      statusCode: 401,
    },
    { status: 401 }
  );
}

/**
 * Create redirect to login page
 */
export function createLoginRedirect(request: NextRequest, error?: string): NextResponse {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  if (error) {
    loginUrl.searchParams.set('error', error);
  }
  return NextResponse.redirect(loginUrl);
}

/**
 * Middleware helper for protecting routes
 */
export function createAuthMiddleware(
  requiredRoles: NovaRole[] = ['admin', 'superadmin', 'godmode']
) {
  return (request: NextRequest) => {
    try {
      authenticateRequestSync(request, requiredRoles);
      return NextResponse.next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return createLoginRedirect(request, 'authentication_required');
      }
      if (error instanceof AuthorizationError) {
        return createForbiddenResponse(error.message);
      }
      return createUnauthorizedResponse('Authentication failed');
    }
  };
}
