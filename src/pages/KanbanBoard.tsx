import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ListTodo,
  Plus,
  Calendar,
  MessageSquare,
  Search,
} from 'lucide-react';
import { PriorityBadge } from '../components/common/PageHero';
import { getKanban } from '../api/tasks';
import { listSprints } from '../api/sprints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';
import type { KanbanResponse, KanbanTask, TaskStatus } from '../types/tasks';
import type { Sprint } from '../types/sprints';
import { SPRINT_STATUS_LABEL } from '../types/sprints';

type ScopeTab = 'assigned' | 'created' | 'all';

const COLUMNS: Array<{
  key: TaskStatus;
  label: string;
  className: string;
}> = [
  { key: 'pending', label: 'To Do', className: 'kanban-col--pending' },
  {
    key: 'in_progress',
    label: 'In Progress',
    className: 'kanban-col--progress',
  },
  { key: 'completed', label: 'Done', className: 'kanban-col--completed' },
  { key: 'cancelled', label: 'Cancelled', className: 'kanban-col--cancelled' },
];

const SCOPE_TABS: Array<{ id: ScopeTab; label: string }> = [
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'created', label: 'Created by me' },
  { id: 'all', label: 'All my tasks' },
];

function initials(name: string) {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function parseAssignees(assigneeName: string): string[] {
  return assigneeName
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
}

function KanbanCard({ task }: { task: KanbanTask }) {
  const people = parseAssignees(task.assignee_name);

  return (
    <Link to={`/tasks/${task.id}`} className="kanban-card">
      <div className="kanban-card__top">
        <span className="kanban-card__key">TASK-{task.id}</span>
        <PriorityBadge priority={task.priority} />
      </div>
      <span className="kanban-card__title">{task.title}</span>

      {people.length > 0 && (
        <ul className="kanban-card__assignees" aria-label="Assignees">
          {people.map((name) => (
            <li key={name} className="kanban-card__assignee" title={name}>
              <span className="kanban-avatar" aria-hidden>
                {initials(name)}
              </span>
              <span className="kanban-card__assignee-name">{name}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="kanban-card__progress">
        <div
          className="kanban-card__progress-bar"
          role="progressbar"
          aria-valuenow={task.completion_percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="kanban-card__progress-fill"
            style={{ width: `${task.completion_percentage}%` }}
          />
        </div>
        <span className="kanban-card__progress-pct">
          {task.completion_percentage}%
        </span>
      </div>

      <div className="kanban-card__footer">
        <div className="kanban-card__stats">
          <span className="kanban-card__stat" title="Due date">
            <Calendar size={12} />
            {formatDate(task.end_date)}
          </span>
          {task.update_count > 0 && (
            <span className="kanban-card__stat" title="Updates">
              <MessageSquare size={12} />
              {task.update_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function KanbanBoard() {
  const { user, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [board, setBoard] = useState<KanbanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(
    searchParams.get('search') ?? '',
  );
  const [sprints, setSprints] = useState<Sprint[]>([]);

  const isOfficerView = !hasPermission('task.view_all');
  const scopeParam = searchParams.get('scope') as ScopeTab | null;
  const search = searchParams.get('search') ?? '';
  const sprintFilter = searchParams.get('sprint_id') ?? '';
  const scope: ScopeTab = isOfficerView
    ? scopeParam === 'created' ||
      scopeParam === 'all' ||
      scopeParam === 'assigned'
      ? scopeParam
      : 'assigned'
    : scopeParam === 'assigned' || scopeParam === 'created'
      ? scopeParam
      : 'all';

  useEffect(() => {
    listSprints()
      .then(setSprints)
      .catch(() => setSprints([]));
  }, []);

  const loadBoard = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await getKanban({
        search: search || undefined,
        ...(scope === 'assigned' ? { assigned_to: user.id } : {}),
        ...(scope === 'created' ? { created_by: user.id } : {}),
        ...(sprintFilter === 'none'
          ? { sprint_id: 'none' }
          : sprintFilter
            ? { sprint_id: Number(sprintFilter) }
            : {}),
      });
      setBoard(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.id, scope, search, sprintFilter]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const setScope = (nextScope: ScopeTab) => {
    const next = new URLSearchParams(searchParams);
    if (nextScope === 'assigned' && isOfficerView) next.delete('scope');
    else if (nextScope === 'all' && !isOfficerView) next.delete('scope');
    else next.set('scope', nextScope);
    setSearchParams(next);
  };

  const applySearch = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('search', value);
    else next.delete('search');
    setSearchParams(next);
  };

  const setSprintFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('sprint_id', value);
    else next.delete('sprint_id');
    setSearchParams(next);
  };

  const totalCount = board
    ? COLUMNS.reduce((sum, col) => sum + board[col.key].length, 0)
    : 0;

  return (
    <div className="page page--kanban">
      <div
        className="kanban-scope-tabs"
        role="tablist"
        aria-label="Board scope"
      >
        {SCOPE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={scope === tab.id}
            className={`kanban-scope-tab${scope === tab.id ? ' kanban-scope-tab--active' : ''}`}
            onClick={() => setScope(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="kanban-toolbar">
        <div className="kanban-toolbar__left">
          <span className="kanban-toolbar__count">{totalCount} issues</span>
          <label className="kanban-toolbar__sprint">
            <span className="visually-hidden">Sprint</span>
            <select
              className="filter-select"
              value={sprintFilter}
              onChange={(e) => setSprintFilter(e.target.value)}
              aria-label="Filter by sprint"
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
        <div className="kanban-toolbar__right">
          <form
            className="kanban-search"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch(searchInput.trim());
            }}
          >
            <Search size={16} />
            <input
              type="search"
              placeholder="Search board..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          <Link to="/tasks" className="btn">
            <ListTodo size={16} />
            List
          </Link>
          {hasPermission('task.create') && (
            <Link to="/tasks/new" className="btn btn--primary">
              <Plus size={16} />
              Create
            </Link>
          )}
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <p className="empty-state">Loading board...</p>
      ) : board ? (
        <div className="kanban-board">
          {COLUMNS.map((col) => (
            <section
              key={col.key}
              className={`kanban-col ${col.className}`}
              aria-label={col.label}
            >
              <header className="kanban-col__header">
                <h3 className="kanban-col__title">
                  <span className="kanban-col__dot" aria-hidden />
                  {col.label}
                </h3>
                <span className="kanban-col__count">
                  {board[col.key].length}
                </span>
              </header>
              <div className="kanban-col__cards">
                {board[col.key].length === 0 ? (
                  <p className="kanban-col__empty">No issues</p>
                ) : (
                  board[col.key].map((task) => (
                    <KanbanCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
