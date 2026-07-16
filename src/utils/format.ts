import { isOfficerRole, isSeniorRole } from '../constants/roles';

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

export function formatRoleLabel(role?: string): string {
  if (!role) return '';
  if (role === 'officer') return 'OFFICER';
  return role.replace(/_/g, ' ').toUpperCase();
}

export interface DisplayUser {
  full_name: string;
  role_name?: string;
  grade_name?: string | null;
}

/** Officers: grade primary. Seniors: role label. */
export function displayUserLabel(user: DisplayUser): string {
  if (isOfficerRole(user.role_name) && user.grade_name) {
    return `${user.full_name} (${user.grade_name})`;
  }
  if (user.role_name && isSeniorRole(user.role_name)) {
    return `${user.full_name} — ${formatRoleLabel(user.role_name)}`;
  }
  return user.full_name;
}

/** Dropdown / assignee: officers show grade only, no role name. */
export function formatAssigneeOption(user: DisplayUser): string {
  if (isOfficerRole(user.role_name) && user.grade_name) {
    return `${user.full_name} (${user.grade_name})`;
  }
  if (user.grade_name) {
    return `${user.full_name} (${user.grade_name})`;
  }
  return `${user.full_name} (${formatRoleLabel(user.role_name)})`;
}

/** Task detail secondary line under name. */
export function formatUserRoleLine(user: DisplayUser): string {
  if (isOfficerRole(user.role_name) && user.grade_name) {
    return user.grade_name;
  }
  return formatRoleLabel(user.role_name);
}

export function formatHeaderRoleLabel(user: {
  role_name?: string;
  grade_name?: string | null;
}): string {
  if (isOfficerRole(user.role_name) && user.grade_name) {
    return user.grade_name;
  }
  return formatRoleLabel(user.role_name);
}
