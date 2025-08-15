export const PERMISSIONS = {
  MANAGE_ROLES: 'manage_roles',
  MANAGE_FLAGS: 'manage_flags',
  VIEW_ANALYTICS_PRO: 'view_analytics_pro',
  ACCESS_CONCIERGE: 'access_concierge'
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];
