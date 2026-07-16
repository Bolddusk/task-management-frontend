import type { PermissionCode } from '../types';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  permission?: PermissionCode;
  anyPermission?: PermissionCode[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [{ label: 'Dashboard', path: '/', icon: 'layout-dashboard' }],
  },
  {
    title: 'TASKS',
    items: [
      {
        label: 'Tasks',
        path: '/tasks',
        icon: 'list-todo',
        anyPermission: ['task.view_all', 'task.view_dept', 'task.view_own'],
      },
      {
        label: 'Kanban',
        path: '/tasks/kanban',
        icon: 'columns',
        anyPermission: ['task.view_all', 'task.view_dept', 'task.view_own'],
      },
      {
        label: 'Sprints',
        path: '/sprints',
        icon: 'sprint',
      },
      {
        label: 'Create Task',
        path: '/tasks/new',
        icon: 'plus-circle',
        permission: 'task.create',
      },
    ],
  },
  {
    title: 'REPORTS & EXPORTS',
    items: [
      {
        label: 'Reports',
        path: '/reports',
        icon: 'file-text',
        anyPermission: ['report.view_all', 'report.view_own'],
      },
      {
        label: 'Exports',
        path: '/exports',
        icon: 'download',
        permission: 'task.export',
      },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      {
        label: 'Users',
        path: '/users',
        icon: 'users',
        permission: 'user.manage',
      },
      {
        label: 'Departments',
        path: '/departments',
        icon: 'building',
        permission: 'dept.manage',
      },
      {
        label: 'Grades',
        path: '/grades',
        icon: 'award',
        permission: 'grade.manage',
      },
      {
        label: 'Admin Panel',
        path: '/admin',
        icon: 'shield',
        permission: 'admin.panel',
      },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [{ label: 'Settings', path: '/settings', icon: 'settings' }],
  },
];
