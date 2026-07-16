import type { ActivityEntry } from '../../types/exports';
import { formatDateTime } from '../../utils/format';
import { Link } from 'react-router-dom';

const ACTION_META: Record<string, { label: string; tone: string }> = {
  task_created: { label: 'Task created', tone: 'green' },
  task_assigned: { label: 'Task assigned', tone: 'blue' },
  task_updated: { label: 'Task updated', tone: 'slate' },
  update_submitted: { label: 'Update submitted', tone: 'violet' },
  update_requested: { label: 'Update requested', tone: 'amber' },
  status_changed: { label: 'Status changed', tone: 'sky' },
  document_uploaded: { label: 'Document uploaded', tone: 'mint' },
  document_deleted: { label: 'Document deleted', tone: 'rose' },
};

interface RecentActivityListProps {
  activities: ActivityEntry[];
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  if (activities.length === 0) {
    return <p className="empty-state">No recent activity</p>;
  }

  return (
    <ul className="activity-feed">
      {activities.map((entry) => {
        const meta = ACTION_META[entry.action] ?? {
          label: entry.action.replace(/_/g, ' '),
          tone: 'slate',
        };

        return (
          <li key={entry.id} className="activity-feed__item">
            <span
              className={`activity-feed__dot activity-feed__dot--${meta.tone}`}
              aria-hidden
            />
            <div className="activity-feed__content">
              <strong>{meta.label}</strong>
              <span className="activity-feed__actor">
                by {entry.actor_name}
                <span className="activity-feed__role">
                  {' '}
                  · {entry.actor_role.replace(/_/g, ' ')}
                </span>
              </span>
              <div className="activity-feed__time">
                {formatDateTime(entry.created_at)}
              </div>
            </div>
            {entry.task_id > 0 && (
              <Link to={`/tasks/${entry.task_id}`} className="link-btn">
                View
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
