import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Eye, LayoutGrid, Download } from 'lucide-react';
import {
  PageHero,
  StatusBadge,
  PriorityBadge,
  ReviewStatusBadge,
} from '../components/common/PageHero';
import { getTasks } from '../api/tasks';
import { createExport, downloadExport } from '../api/exports';
import { listSprints } from '../api/sprints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';
import { formatAssigneesList } from '../utils/taskAssignees';
import type { TaskListItem, TaskStatus } from '../types/tasks';
import type { Sprint } from '../types/sprints';
import { SPRINT_STATUS_LABEL } from '../types/sprints';

type ScopeTab = 'assigned' | 'created' | 'all';

const STATUS_FILTERS: Array<{ label: string; value: TaskStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'PENDING', value: 'pending' },
  { label: 'IN PROGRESS', value: 'in_progress' },
  { label: 'COMPLETED', value: 'completed' },
  { label: 'CANCELLED', value: 'cancelled' },
];

const SCOPE_TABS: Array<{ id: ScopeTab; label: string }> = [
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'created', label: 'Created by me' },
  { id: 'all', label: 'All my tasks' },
];

export function TaskList() {
  const { user, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [summary, setSummary] = useState<Record<TaskStatus, number> | null>(
    null,
  );
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [sprints, setSprints] = useState<Sprint[]>([]);

  const search = searchParams.get('search') ?? '';
  const statusFilter = (searchParams.get('status') as TaskStatus | null) ?? 'ALL';
  const fromDate = searchParams.get('date_from') ?? '';
  const toDate = searchParams.get('date_to') ?? '';
  const sprintFilter = searchParams.get('sprint_id') ?? '';
  const isOfficerView = !hasPermission('task.view_all');
  const scopeParam = searchParams.get('scope') as ScopeTab | null;
  const scope: ScopeTab = isOfficerView
    ? scopeParam === 'created' ||
      scopeParam === 'all' ||
      scopeParam === 'assigned'
      ? scopeParam
      : 'assigned'
    : scopeParam === 'assigned' || scopeParam === 'created'
      ? scopeParam
      : 'all';

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    listSprints()
      .then(setSprints)
      .catch(() => setSprints([]));
  }, []);

  const title = hasPermission('task.view_all')
    ? 'All Tasks'
    : scope === 'assigned'
      ? 'Assigned to Me'
      : scope === 'created'
        ? 'Created by Me'
        : 'My Tasks';

  const description =
    scope === 'assigned'
      ? 'Tasks where you are an assignee. Submit your own progress here.'
      : scope === 'created'
        ? 'Tasks you created and assigned to others.'
        : hasPermission('task.view_all')
          ? 'All organisation tasks. Server applies your role-based scope automatically.'
          : 'Tasks assigned to you or created by you.';

  const loadTasks = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await getTasks({
        page,
        page_size: 20,
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        date_from: fromDate || undefined,
        date_to: toDate || undefined,
        ...(scope === 'assigned' ? { assigned_to: user.id } : {}),
        ...(scope === 'created' ? { created_by: user.id } : {}),
        ...(sprintFilter === 'none'
          ? { sprint_id: 'none' }
          : sprintFilter
            ? { sprint_id: Number(sprintFilter) }
            : {}),
      });
      setTasks(data.tasks);
      setTotal(data.total);
      setSummary(data.summary);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    statusFilter,
    fromDate,
    toDate,
    scope,
    user?.id,
    sprintFilter,
  ]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setPage(1);
    setSearchParams(next);
  };

  const setScope = (nextScope: ScopeTab) => {
    const next = new URLSearchParams(searchParams);
    if (nextScope === 'assigned' && isOfficerView) {
      next.delete('scope');
    } else if (nextScope === 'all' && !isOfficerView) {
      next.delete('scope');
    } else {
      next.set('scope', nextScope);
    }
    setPage(1);
    setSearchParams(next);
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const handleQuickExport = async () => {
    setExporting(true);
    setError('');
    try {
      const exportType = hasPermission('task.view_all')
        ? 'all_tasks'
        : 'my_tasks';
      const result = await createExport({
        export_type: exportType,
        format: 'xlsx',
        filters: {
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          date_from: fromDate || undefined,
          date_to: toDate || undefined,
        },
      });
      await downloadExport(result.job_id, `${exportType}.xlsx`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const emptyMessage =
    scope === 'assigned'
      ? 'No tasks assigned to you'
      : scope === 'created'
        ? 'You have not created any tasks yet'
        : 'No tasks found';

  return (
    <div className="page">
      <PageHero eyebrow="TASKS" title={title} description={description} />

      <div className="scope-tabs" role="tablist" aria-label="Task scope">
        {SCOPE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={scope === tab.id}
            className={`scope-tab${scope === tab.id ? ' scope-tab--active' : ''}`}
            onClick={() => setScope(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {summary && (
        <div className="summary-chips">
          <span className="summary-chip summary-chip--pending">
            Pending: {summary.pending}
          </span>
          <span className="summary-chip summary-chip--progress">
            In Progress: {summary.in_progress}
          </span>
          <span className="summary-chip summary-chip--completed">
            Completed: {summary.completed}
          </span>
          <span className="summary-chip summary-chip--cancelled">
            Cancelled: {summary.cancelled}
          </span>
        </div>
      )}

      <div className="filters-bar">
        <div className="filters-bar__row">
          <form
            className="search-input"
            onSubmit={(e) => {
              e.preventDefault();
              setFilter('search', searchInput);
            }}
          >
            <Search size={18} />
            <input
              type="search"
              placeholder="Search title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          <div className="date-filters">
            <label className="date-field">
              <span>FROM DATE</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFilter('date_from', e.target.value)}
              />
            </label>
            <label className="date-field">
              <span>TO DATE</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setFilter('date_to', e.target.value)}
              />
            </label>
            <label className="date-field">
              <span>SPRINT</span>
              <select
                className="filter-select"
                value={sprintFilter}
                onChange={(e) => setFilter('sprint_id', e.target.value)}
              >
                <option value="">All sprints</option>
                <option value="none">Backlog</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({SPRINT_STATUS_LABEL[s.status]})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="filters-bar__row filters-bar__row--actions">
          <div className="status-chips">
            {STATUS_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                className={`status-chip${statusFilter === value ? ' status-chip--active' : ''}`}
                onClick={() =>
                  setFilter('status', value === 'ALL' ? '' : value)
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className="filters-bar__buttons">
            <Link to="/tasks/kanban" className="btn">
              <LayoutGrid size={18} />
              Kanban
            </Link>
            {hasPermission('task.export') && (
              <button
                type="button"
                className="btn"
                onClick={handleQuickExport}
                disabled={exporting}
              >
                <Download size={18} />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            )}
            {hasPermission('task.create') && (
              <Link to="/tasks/new" className="btn btn--primary">
                <Plus size={18} />
                Create Task
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="empty-state">Loading tasks...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>TITLE</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th>ASSIGNED TO</th>
                <th>DEPARTMENT</th>
                <th>START</th>
                <th>END</th>
                <th>PROGRESS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    {emptyMessage}
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
                      {task.review_status && task.review_status !== 'none' && (
                        <>
                          {' '}
                          <ReviewStatusBadge status={task.review_status} />
                        </>
                      )}
                    </td>
                    <td>
                      <span
                        title={
                          task.assignees
                            ?.map(
                              (a) =>
                                `${a.full_name}: ${a.completion_percentage}%`,
                            )
                            .join('\n') ?? undefined
                        }
                      >
                        {formatAssigneesList(task)}
                      </span>
                    </td>
                    <td>{task.dept.name}</td>
                    <td>{formatDate(task.start_date)}</td>
                    <td>{formatDate(task.end_date)}</td>
                    <td title="Overall average">
                      {task.completion_percentage}%
                    </td>
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
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages} ({total} tasks)
          </span>
          <button
            type="button"
            className="btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
