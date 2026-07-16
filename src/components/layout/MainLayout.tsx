import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/tasks': 'Tasks',
  '/tasks/kanban': 'Kanban',
  '/tasks/new': 'Create Task',
  '/users': 'Users',
  '/departments': 'Departments',
  '/reports': 'Reports',
  '/exports': 'Exports',
  '/admin': 'Admin Panel',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (/^\/tasks\/\d+$/.test(pathname)) return 'Task Detail';
  if (/^\/departments\/\d+$/.test(pathname)) return 'Department';
  if (/^\/reports\/user\/\d+$/.test(pathname)) return 'User Report';
  if (/^\/reports\/dept\/\d+$/.test(pathname)) return 'Dept Report';
  if (pathname.startsWith('/tasks')) return 'Tasks';
  if (pathname.startsWith('/departments')) return 'Departments';
  return 'Task Management';
}

export function MainLayout() {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header title={title} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
