import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  Columns3,
  PlusCircle,
  Building,
  Users,
  FileText,
  Shield,
  Settings,
  Download,
  Award,
  Timer,
} from 'lucide-react';
import { NAV_GROUPS } from '../../constants/nav';
import { useAuth } from '../../context/AuthContext';
import type { PermissionCode } from '../../types';

const iconMap = {
  'layout-dashboard': LayoutDashboard,
  'list-todo': ListTodo,
  columns: Columns3,
  'plus-circle': PlusCircle,
  building: Building,
  users: Users,
  'file-text': FileText,
  download: Download,
  shield: Shield,
  award: Award,
  sprint: Timer,
  settings: Settings,
};

export function Sidebar() {
  const { hasPermission, hasAnyPermission } = useAuth();

  const canShow = (item: {
    permission?: PermissionCode;
    anyPermission?: PermissionCode[];
  }) => {
    if (item.anyPermission?.length) {
      return hasAnyPermission(...item.anyPermission);
    }
    if (item.permission) return hasPermission(item.permission);
    return true;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__org">TASK MANAGEMENT ORG</span>
        <h1 className="sidebar__title">Task Management</h1>
      </div>

      <nav className="sidebar__nav">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => canShow(item));
          if (items.length === 0) return null;

          return (
            <div key={group.title} className="sidebar__group">
              <span className="sidebar__group-title">{group.title}</span>
              <ul className="sidebar__list">
                {items.map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap];
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/' || item.path === '/tasks'}
                        className={({ isActive }) =>
                          `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                        }
                      >
                        {Icon && <Icon size={18} strokeWidth={2} />}
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
