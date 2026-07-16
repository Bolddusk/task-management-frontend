import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Eye } from 'lucide-react';
import { PageHero } from '../components/common/PageHero';
import {
  listSprints,
  createSprint,
  updateSprint,
} from '../api/sprints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';
import type { Sprint, SprintStatus } from '../types/sprints';
import { SPRINT_STATUS_LABEL } from '../types/sprints';

const EMPTY_FORM = {
  name: '',
  goal: '',
  start_date: '',
  end_date: '',
  status: 'planned' as SprintStatus,
};

export function Sprints() {
  const { hasAnyPermission } = useAuth();
  const canManage = hasAnyPermission('sprint.manage', 'task.create');
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<SprintStatus | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sprint | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listSprints(
        statusFilter === 'ALL' ? undefined : statusFilter,
      );
      setSprints(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (sprint: Sprint) => {
    setEditing(sprint);
    setForm({
      name: sprint.name,
      goal: sprint.goal ?? '',
      start_date: sprint.start_date.slice(0, 10),
      end_date: sprint.end_date.slice(0, 10),
      status: sprint.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.end_date < form.start_date) {
      setError('End date must be on or after start date');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateSprint(editing.id, {
          name: form.name,
          goal: form.goal || null,
          start_date: form.start_date,
          end_date: form.end_date,
          status: form.status,
        });
      } else {
        await createSprint({
          name: form.name,
          goal: form.goal || undefined,
          start_date: form.start_date,
          end_date: form.end_date,
          status: form.status,
        });
      }
      closeModal();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const setStatusQuick = async (sprint: Sprint, status: SprintStatus) => {
    try {
      await updateSprint(sprint.id, { status });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="page">
      <PageHero
        eyebrow="PLANNING"
        title="Sprints"
        description="Time-boxed cycles for grouping tasks. Filter boards and lists by sprint."
      />

      <div className="filters-bar">
        <div className="filters-bar__row filters-bar__row--actions">
          <div className="status-chips">
            {(['ALL', 'planned', 'active', 'completed'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`status-chip${statusFilter === s ? ' status-chip--active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'ALL' ? 'All' : SPRINT_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          {canManage && (
            <button type="button" className="btn btn--primary" onClick={openCreate}>
              <Plus size={18} />
              Create Sprint
            </button>
          )}
        </div>
      </div>

      {error && !modalOpen && <div className="form-error">{error}</div>}

      {loading ? (
        <p className="empty-state">Loading sprints...</p>
      ) : sprints.length === 0 ? (
        <p className="empty-state">No sprints yet</p>
      ) : (
        <div className="sprint-grid">
          {sprints.map((sprint) => {
            const stats = sprint.stats;
            return (
              <article key={sprint.id} className="sprint-card">
                <div className="sprint-card__header">
                  <span
                    className={`sprint-badge sprint-badge--${sprint.status}`}
                  >
                    {SPRINT_STATUS_LABEL[sprint.status]}
                  </span>
                  <div className="sprint-card__actions">
                    <Link
                      to={`/sprints/${sprint.id}`}
                      className="icon-btn"
                      aria-label="View"
                    >
                      <Eye size={16} />
                    </Link>
                    {canManage && (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Edit"
                        onClick={() => openEdit(sprint)}
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="sprint-card__title">
                  <Link to={`/sprints/${sprint.id}`}>{sprint.name}</Link>
                </h3>
                {sprint.goal && (
                  <p className="sprint-card__goal">{sprint.goal}</p>
                )}
                <p className="sprint-card__dates">
                  {formatDate(sprint.start_date)} → {formatDate(sprint.end_date)}
                </p>
                {stats && (
                  <>
                    <div className="sprint-card__stats">
                      <span>{stats.total_tasks} tasks</span>
                      <span>{stats.completed_tasks} done</span>
                      <span>{stats.avg_completion}% avg</span>
                    </div>
                    <div className="assignee-progress-bar" aria-hidden>
                      <div
                        className="assignee-progress-bar__fill"
                        style={{ width: `${stats.avg_completion}%` }}
                      />
                    </div>
                  </>
                )}
                {canManage && sprint.status !== 'completed' && (
                  <div className="sprint-card__quick">
                    {sprint.status === 'planned' && (
                      <button
                        type="button"
                        className="btn btn--sm btn--primary"
                        onClick={() => setStatusQuick(sprint, 'active')}
                      >
                        Start sprint
                      </button>
                    )}
                    {sprint.status === 'active' && (
                      <button
                        type="button"
                        className="btn btn--sm"
                        onClick={() => setStatusQuick(sprint, 'completed')}
                      >
                        Complete sprint
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Sprint' : 'Create Sprint'}</h2>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleSubmit} className="modal-form">
              <label className="form-field">
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  maxLength={255}
                />
              </label>
              <label className="form-field">
                <span>Goal (optional)</span>
                <textarea
                  value={form.goal}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, goal: e.target.value }))
                  }
                  rows={2}
                />
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>Start</span>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start_date: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="form-field">
                  <span>End</span>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, end_date: e.target.value }))
                    }
                    required
                  />
                </label>
              </div>
              <label className="form-field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as SprintStatus,
                    }))
                  }
                >
                  {(Object.keys(SPRINT_STATUS_LABEL) as SprintStatus[]).map(
                    (s) => (
                      <option key={s} value={s}>
                        {SPRINT_STATUS_LABEL[s]}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
