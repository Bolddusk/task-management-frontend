import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDateTime } from '../../utils/format';

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="notification-bell" ref={ref}>
      <button
        type="button"
        className="icon-btn notification-bell__trigger"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown__header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="link-btn"
                onClick={() => markAllRead()}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-dropdown__list">
            {notifications.length === 0 ? (
              <p className="notification-dropdown__empty">No notifications</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`notification-item${n.is_read ? '' : ' notification-item--unread'}`}
                  onClick={() => !n.is_read && markRead(n.id)}
                >
                  <span className="notification-item__title">{n.title}</span>
                  {n.body && (
                    <span className="notification-item__body">{n.body}</span>
                  )}
                  <span className="notification-item__time">
                    {formatDateTime(n.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
