import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, KeyRound } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { formatHeaderRoleLabel } from '../../utils/format';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = formatHeaderRoleLabel({
    role_name: user?.role_name,
    grade_name: user?.grade_name,
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="top-header">
      <h2 className="top-header__title">{title}</h2>
      <div className="top-header__actions">
        {user?.permissions?.includes('notification.receive') && (
          <NotificationBell />
        )}
        <div className="user-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="user-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="user-menu__avatar">{initial}</span>
            <span className="user-menu__info">
              <span className="user-menu__name">{displayName}</span>
              <span className="user-menu__role">{roleLabel}</span>
            </span>
            <ChevronDown size={16} className="user-menu__chevron" />
          </button>

          {menuOpen && (
            <div className="user-dropdown">
              <Link
                to="/change-password"
                className="user-dropdown__item"
                onClick={() => setMenuOpen(false)}
              >
                <KeyRound size={16} />
                Change Password
              </Link>
              <button
                type="button"
                className="user-dropdown__item user-dropdown__item--danger"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
