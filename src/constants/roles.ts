export const ROLES = [
  { id: 1, name: 'super_admin', label: 'Super Admin', hierarchy_level: 1 },
  { id: 2, name: 'admin', label: 'Admin', hierarchy_level: 2 },
  { id: 3, name: 'minister', label: 'Minister', hierarchy_level: 3 },
  { id: 4, name: 'secretary', label: 'Secretary', hierarchy_level: 4 },
  { id: 5, name: 'as', label: 'AS', hierarchy_level: 5 },
  { id: 6, name: 'js', label: 'JS', hierarchy_level: 6 },
  { id: 7, name: 'officer', label: 'Officer (grade-based)', hierarchy_level: 7 },
] as const;

export const SENIOR_ROLES = ['minister', 'secretary', 'as', 'js'] as const;
export const ADMIN_ROLES = ['super_admin', 'admin'] as const;

export function getAssignableRoles(currentRole: string) {
  if (currentRole === 'super_admin') return ROLES;
  if (currentRole === 'admin') {
    return ROLES.filter((r) => r.hierarchy_level > 2);
  }
  return ROLES.filter((r) => r.hierarchy_level > 2);
}

export function isOfficerRole(role?: string) {
  return role === 'officer';
}

export function isSeniorRole(role?: string) {
  return !!role && SENIOR_ROLES.includes(role as (typeof SENIOR_ROLES)[number]);
}
