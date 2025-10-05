// Authentication Types - Shared across NovaOS applications
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
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  success: boolean;
  user?: NovaUser;
  error?: string;
}

// Role hierarchy for RBAC authorization
export const ROLE_HIERARCHY: Record<NovaRole, number> = {
  godmode: 100,
  superadmin: 80,
  admin: 60,
  creator: 40,
  user: 20,
};

// Core authentication and authorization utilities (without Next.js dependencies)
export class AuthUtils {
  static hasRole(userRole: NovaRole, requiredRole: NovaRole): boolean {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
  }

  static validateJWTStructure(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Validate each part is valid base64
      parts.forEach((part) => {
        const decoded = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
        JSON.parse(decoded);
      });

      return true;
    } catch {
      return false;
    }
  }

  static parseJWTPayload(token: string): JWTClaims | null {
    try {
      if (!this.validateJWTStructure(token)) return null;

      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as JWTClaims;
    } catch {
      return null;
    }
  }

  static isTokenExpired(claims: JWTClaims): boolean {
    if (!claims.exp) return true;
    return Date.now() >= claims.exp * 1000;
  }
}
