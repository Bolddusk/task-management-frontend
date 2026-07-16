import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, LayoutGrid, Plus } from 'lucide-react';
import {
  PageHero,
  StatusBadge,
  PriorityBadge,
  DashboardCard,
} from '../components/common/PageHero';
import { getSprint } from '../api/sprints';
import { getTasks } from '../api/tasks';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';
import { formatAssigneesList } from '../utils/taskAssignees';
import type { Sprint } from '../types/sprints';
import { SPRINT_STATUS_LABEL } from '../types/sprints';
import type { TaskListItem } from '../types/tasks';

export function SprintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = useAuth();
  const sprintId = Number(id);
  const canCreate = hasPermission('task.create');
  const canManage = hasAnyPermission('sprint.manage', 'task.create');

  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!sprintId) return;
    setLoading(true);
    setError('');
    try {
      const [s, taskData] = await Promise.all([
        getSprint(sprintId),
        getTasks({ sprint_id: sprintId, page_size: 50 }),
      ]);
      setSprint(s);
      setTasks(taskData.tasks);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!sprintId) return null;

  if (loading) {
    return <p className="empty-state">Loading sprint...</p>;
  }

  if (!sprint) {
    return (
      <div className="page">
        <div className="form-error">{error || 'Sprint not found'}</div>
        <Link to="/sprints" className="btn">
          Back to sprints
        </Link>
      </div>
    );
  }

  const stats = sprint.stats;

  return (
    <div className="page">
      <div className="page-back">
        <button type="button" className="link-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <PageHero
        eyebrow="SPRINT"
        title={sprint.name}
        description={
          sprint.goal ??
          `${formatDate(sprint.start_date)} → ${formatDate(sprint.end_date)}`
        }
      />

      {error && <div className="form-error">{error}</div>}

      <div className="task-detail-header">
        <div className="task-detail-badges">
          <span className={`sprint-badge sprint-badge--${sprint.status}`}>
            {SPRINT_STATUS_LABEL[sprint.status]}
          </span>
          <span className="task-detail-progress">
            {formatDate(sprint.start_date)} → {formatDate(sprint.end_date)}
          </span>
          {stats && (
            <span className="task-detail-progress">
              {stats.avg_completion}% avg · {stats.total_tasks} tasks
            </span>
          )}
        </div>
        <div className="task-detail-actions">
          <Link
            to={`/tasks/kanban?sprint_id=${sprint.id}`}
            className="btn"
          >
            <LayoutGrid size={16} /> Board
          </Link>
          {canCreate && (
            <Link
              to={`/tasks/new?sprint_id=${sprint.id}`}
              className="btn btn--primary"
            >
              <Plus size={16} /> Add task
            </Link>
          )}
        </div>
      </div>

      {stats && (
        <DashboardCard title="Progress" subtitle="Viewer-scoped stats">
          <div className="assignee-progress-row">
            <div className="assignee-progress-row__meta">
              <span>Average completion</span>
              <span>{stats.avg_completion}%</span>
            </div>
            <div className="assignee-progress-bar">
              <div
                className="assignee-progress-bar__fill"
                style={{ width: `${stats.avg_completion}%` }}
              />
            </div>
          </div>
          <div className="sprint-card__stats" style={{ marginTop: 12 }}>
            <span>Pending {stats.pending_tasks}</span>
            <span>In progress {stats.in_progress_tasks}</span>
            <span>Done {stats.completed_tasks}</span>
            <span>Cancelled {stats.cancelled_tasks}</span>
          </div>
        </DashboardCard>
      )}

      <div className="table-card" style={{ marginTop: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>TITLE</th>
              <th>PRIORITY</th>
              <th>STATUS</th>
              <th>ASSIGNED TO</th>
              <th>PROGRESS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No tasks in this sprint
                  {canManage ? ' — create one or add from backlog.' : '.'}
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td className="col-title">{task.title}</td>
                  <td>
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td>
                    <StatusBadge status={task.status} />
                  </td>
                  <td>{formatAssigneesList(task)}</td>
                  <td>{task.completion_percentage}%</td>
                  <td>
                    <Link
                      to={`/tasks/${task.id}`}
                      className="icon-btn"
                      aria-label="View"
                    >
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
