// Role-Based Access Control (RBAC) definitions and helper functions

export type StaffRole = 
  | 'admin' 
  | 'secretary';

export type FeatureKey =
  
  | 'resident_approval'
  | 'ecological_submissions'
  | 'name_change_requests'
  | 'view_reports'
  | 'certificate_requests'
  | 'manage_residents'
  | 'manage_households'
  | 'incidents'
  | 'announcements'
  | 'ecological_profile'
  | 'create_certificate'
  | 'settings'
  | 'monitoring_reports'
  | 'messages';

// Define which roles can access each feature
const ROLE_PERMISSIONS: Record<FeatureKey, StaffRole[]> = {
  // Admin-only features
  monitoring_reports: ['admin'],
  resident_approval: ['admin'],
  
  // Both admin and secretary
  ecological_submissions: ['admin', 'secretary'],
  name_change_requests: ['admin', 'secretary'],
  manage_residents: ['admin', 'secretary'],
  manage_households: ['admin', 'secretary'],
  announcements: ['admin', 'secretary'],
  view_reports: ['admin', 'secretary'],
  certificate_requests: ['admin', 'secretary'],
  ecological_profile: ['admin', 'secretary'],
  create_certificate: ['admin', 'secretary'],
  incidents: ['admin', 'secretary'],
  settings: ['admin', 'secretary'],
  messages: ['admin', 'secretary'],
};

// Role display names for UI
export const ROLE_DISPLAY_NAMES: Record<StaffRole, string> = {
  admin: 'Administrator',
  secretary: 'Secretary',
};

// Check if a role has permission for a feature
export const hasPermission = (role: string | undefined, feature: FeatureKey): boolean => {
  if (!role) return false;
  const allowedRoles = ROLE_PERMISSIONS[feature];
  return allowedRoles?.includes(role as StaffRole) ?? false;
};

// Get all features a role can access
export const getPermittedFeatures = (role: string | undefined): FeatureKey[] => {
  if (!role) return [];
  return Object.entries(ROLE_PERMISSIONS)
    .filter(([_, roles]) => roles.includes(role as StaffRole))
    .map(([feature]) => feature as FeatureKey);
};

// Check if role can access any admin section features
export const canAccessAdminSection = (role: string | undefined): boolean => {
  if (!role) return false;
  return (
    hasPermission(role, 'resident_approval') ||
    hasPermission(role, 'ecological_submissions') ||
    hasPermission(role, 'name_change_requests') ||
    hasPermission(role, 'monitoring_reports')
  );
};

// Check if role is an admin-level role (can manage staff)
export const isAdminRole = (role: string | undefined): boolean => {
  if (!role) return false;
  return role === 'admin';
};

// Get role display name
export const getRoleDisplayName = (role: string | undefined): string => {
  if (!role) return 'Unknown';
  return ROLE_DISPLAY_NAMES[role as StaffRole] || role;
};
