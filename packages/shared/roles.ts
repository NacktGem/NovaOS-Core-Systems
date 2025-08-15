export const ROLES = [
  'godmode',
  'super_admin_jules',
  'super_admin_nova',
  'admin_agent',
  'advisor',
  'moderator',
  'creator_standard',
  'creator_sovereign',
  'user_verified',
  'guest'
] as const;

export type Role = typeof ROLES[number];
