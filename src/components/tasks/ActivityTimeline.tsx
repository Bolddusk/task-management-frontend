import type { ActivityTrailEntry } from '../types/tasks';
import { formatDateTime, formatUserRoleLine } from '../../utils/format';

const ACTION_LABELS: Record<string, string> = {
  task_created: 'Task created',
  task_assigned: 'Task assigned',
  task_forwarded: 'Task forwarded',
  task_updated: 'Task updated',
  update_submitted: 'Update submitted',
  update_requested: 'Update requested',
  status_changed: 'Status changed',
  document_uploaded: 'Document uploaded',
  comment_added: 'Comment added',
  forwarded_for_review: 'Sent for review',
  returned_to_creator: 'Returned to creator',
};

interface ActivityTimelineProps {
  trail: ActivityTrailEntry[];
}

export function ActivityTimeline({ trail }: ActivityTimelineProps) {
  if (trail.length === 0) {
    return <p className="empty-state">No activity yet</p>;
  }

  return (
    <div className="timeline">
      {trail.map((entry) => (
        <div key={entry.id} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <strong>{ACTION_LABELS[entry.action] || entry.action}</strong>
            <span className="timeline-actor">
              {' '}
              by {entry.actor.full_name} ({formatUserRoleLine(entry.actor)})
            </span>
            {entry.action === 'task_forwarded' &&
              typeof entry.details?.from_name === 'string' &&
              typeof entry.details?.to_name === 'string' && (
                <span className="timeline-detail">
                  {' '}
                  — {entry.details.from_name} → {entry.details.to_name}
                </span>
              )}
            <div className="timeline-time">
              {formatDateTime(entry.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
