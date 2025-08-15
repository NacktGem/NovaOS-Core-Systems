import crypto from 'crypto';

export const COOKIE_NAMES = {
  session: 'novaos_session',
  csrf: 'novaos_csrf'
} as const;

export function createCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyCsrfToken(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken) return false;
  return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
}
