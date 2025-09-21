import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface IdentityClaims {
  sub: string;
  email: string;
  username: string;
  role: 'GODMODE' | 'SUPER_ADMIN' | 'ADMIN_AGENT' | 'CREATOR_STANDARD' | 'VERIFIED_USER' | 'GUEST';
  platform: 'novaos' | 'blackrose' | 'gypsycove' | 'all';
  family_id?: string; // For GypsyCove family grouping
  creator_id?: string; // For BlackRose creator features
  permissions: string[];
  issued_at: number;
  expires_at: number;
}

export interface AuthContext {
  claims: IdentityClaims;
  isAuthenticated: boolean;
  hasRole: (_role: string) => boolean;
  hasPermission: (_permission: string) => boolean;
  canAccessPlatform: (_platform: string) => boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<string, number> = {
  GODMODE: 6,
  SUPER_ADMIN: 5,
  ADMIN_AGENT: 4,
  CREATOR_STANDARD: 3,
  VERIFIED_USER: 2,
  GUEST: 1,
};

// Platform-specific permissions
const PLATFORM_PERMISSIONS: Record<string, string[]> = {
  novaos: ['agent.manage', 'agent.execute', 'system.configure', 'user.manage', 'platform.admin'],
  blackrose: [
    'creator.dashboard',
    'creator.analytics',
    'creator.content',
    'revenue.view',
    'revenue.manage',
  ],
  gypsycove: [
    'family.manage',
    'education.access',
    'education.create',
    'safety.configure',
    'parental.controls',
  ],
};

export async function verifyToken(token: string): Promise<IdentityClaims | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    // Validate required fields
    if (!decoded.sub || !decoded.email || !decoded.role) {
      return null;
    }

    // Check token expiration
    if (decoded.expires_at && Date.now() / 1000 > decoded.expires_at) {
      return null;
    }

    const claims: IdentityClaims = {
      sub: decoded.sub,
      email: decoded.email,
      username: decoded.username || decoded.email.split('@')[0],
      role: decoded.role,
      platform: decoded.platform || 'all',
      family_id: decoded.family_id,
      creator_id: decoded.creator_id,
      permissions: decoded.permissions || [],
      issued_at: decoded.issued_at || decoded.iat,
      expires_at: decoded.expires_at || decoded.exp,
    };

    return claims;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function createAuthContext(claims: IdentityClaims | null): AuthContext {
  if (!claims) {
    return {
      claims: {
        sub: '',
        email: '',
        username: '',
        role: 'GUEST',
        platform: 'all',
        permissions: [],
        issued_at: 0,
        expires_at: 0,
      },
      isAuthenticated: false,
      hasRole: () => false,
      hasPermission: () => false,
      canAccessPlatform: () => false,
    };
  }

  return {
    claims,
    isAuthenticated: true,
    hasRole: (requiredRole: string) => {
      const userRoleLevel = ROLE_HIERARCHY[claims.role] || 0;
      const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0;
      return userRoleLevel >= requiredRoleLevel;
    },
    hasPermission: (permission: string) => {
      return (
        claims.permissions.includes(permission) ||
        claims.role === 'GODMODE' ||
        claims.role === 'SUPER_ADMIN'
      );
    },
    canAccessPlatform: (platform: string) => {
      return claims.platform === 'all' || claims.platform === platform || claims.role === 'GODMODE';
    },
  };
}

export async function authenticate(request: NextRequest): Promise<AuthContext> {
  // Check for JWT token in Authorization header
  const authHeader = request.headers.get('authorization');
  let token = '';

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Check for token in cookies (for web requests)
    const cookieToken = request.cookies.get('auth_token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) {
    return createAuthContext(null);
  }

  const claims = await verifyToken(token);
  return createAuthContext(claims);
}

// Middleware function for Next.js API routes
export function withAuth(
  handler: (_request: NextRequest, _context: AuthContext) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    requiredRole?: string;
    requiredPermissions?: string[];
    allowedPlatforms?: string[];
  } = {}
) {
  return async (request: NextRequest) => {
    const authContext = await authenticate(request);

    // Check authentication requirement
    if (options.requireAuth && !authContext.isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Check role requirement
    if (options.requiredRole && !authContext.hasRole(options.requiredRole)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient privileges',
        },
        { status: 403 }
      );
    }

    // Check permissions
    if (options.requiredPermissions) {
      const hasAllPermissions = options.requiredPermissions.every((perm) =>
        authContext.hasPermission(perm)
      );
      if (!hasAllPermissions) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required permissions',
          },
          { status: 403 }
        );
      }
    }

    // Check platform access
    if (options.allowedPlatforms) {
      const hasAccess = options.allowedPlatforms.some((platform) =>
        authContext.canAccessPlatform(platform)
      );
      if (!hasAccess) {
        return NextResponse.json(
          {
            success: false,
            error: 'Platform access denied',
          },
          { status: 403 }
        );
      }
    }

    return handler(request, authContext);
  };
}

// Helper function to create JWT tokens
export function createToken(claims: Partial<IdentityClaims>): string {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 24 * 60 * 60; // 24 hours

  const tokenClaims = {
    sub: claims.sub,
    email: claims.email,
    username: claims.username,
    role: claims.role || 'GUEST',
    platform: claims.platform || 'all',
    family_id: claims.family_id,
    creator_id: claims.creator_id,
    permissions: claims.permissions || [],
    iat: now,
    exp: now + expiresIn,
    issued_at: now,
    expires_at: now + expiresIn,
  };

  return jwt.sign(tokenClaims, JWT_SECRET);
}

// Platform-specific permission helpers
export function getDefaultPermissions(role: string, platform: string): string[] {
  const platformPerms = PLATFORM_PERMISSIONS[platform] || [];

  switch (role) {
    case 'GODMODE':
      return Object.values(PLATFORM_PERMISSIONS).flat();
    case 'SUPER_ADMIN':
      return platformPerms;
    case 'ADMIN_AGENT':
      return platformPerms.filter((p) => !p.includes('manage') || p === 'user.manage');
    case 'CREATOR_STANDARD':
      return platform === 'blackrose' ? platformPerms.filter((p) => !p.includes('manage')) : [];
    case 'VERIFIED_USER':
      return platformPerms.filter((p) => p.includes('access') || p.includes('view'));
    default:
      return [];
  }
}

// Shared authentication status endpoint
export async function GET(request: NextRequest) {
  const authContext = await authenticate(request);

  return NextResponse.json({
    success: true,
    authenticated: authContext.isAuthenticated,
    user: authContext.isAuthenticated
      ? {
          id: authContext.claims.sub,
          email: authContext.claims.email,
          username: authContext.claims.username,
          role: authContext.claims.role,
          platform: authContext.claims.platform,
          permissions: authContext.claims.permissions,
          family_id: authContext.claims.family_id,
          creator_id: authContext.claims.creator_id,
        }
      : null,
  });
}
