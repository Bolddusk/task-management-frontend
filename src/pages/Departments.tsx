import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Users as UsersIcon,
  ListTodo,
  Trash2,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { PageHero } from '../components/common/PageHero';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../api/departments';
import { getErrorMessage } from '../api/client';
import type { Department } from '../types';

export function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDepartments(includeInactive);
      setDepartments(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setName(dept.name);
    setDescription(dept.description ?? '');
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setName('');
    setDescription('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateDepartment(editing.id, {
          name,
          description: description || null,
        });
      } else {
        await createDepartment(name, description || undefined);
      }
      closeModal();
      await loadDepartments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async (dept: Department) => {
    if (
      !window.confirm(
        `Deactivate "${dept.name}"?\n\nSoft delete keeps tasks safe. The department will be marked inactive.`,
      )
    ) {
      return;
    }
    setBusyId(dept.id);
    setError('');
    try {
      await deleteDepartment(dept.id, false);
      await loadDepartments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleHardDelete = async (dept: Department) => {
    const tasks = dept.task_count ?? 0;
    if (tasks > 0) return;
    if (
      !window.confirm(
        `Permanently delete "${dept.name}"?\n\nThis cannot be undone. Only allowed when there are 0 tasks.`,
      )
    ) {
      return;
    }
    setBusyId(dept.id);
    setError('');
    try {
      await deleteDepartment(dept.id, true);
      await loadDepartments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleReactivate = async (dept: Department) => {
    setBusyId(dept.id);
    setError('');
    try {
      await updateDepartment(dept.id, { is_active: true });
      await loadDepartments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page page--departments">
      <PageHero
        compact
        eyebrow="ADMINISTRATION"
        title="Departments"
        description="Manage departments, members, and soft/hard delete."
      />

      <div className="filters-bar">
        <div className="filters-bar__row filters-bar__row--actions">
          <div className="filters-bar__left">
            <span className="filters-bar__hint">
              {departments.length} department
              {departments.length !== 1 ? 's' : ''}
            </span>
            <label className="toggle-check">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              Show inactive
            </label>
          </div>
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} />
            Add Department
          </button>
        </div>
      </div>

      {error && !modalOpen && <div className="form-error">{error}</div>}

      <div className="dept-grid">
        {loading ? (
          <p className="empty-state">Loading departments...</p>
        ) : departments.length === 0 ? (
          <p className="empty-state">No departments yet</p>
        ) : (
          departments.map((dept) => {
            const taskCount = dept.task_count ?? 0;
            const userCount = dept.user_count ?? 0;
            const busy = busyId === dept.id;
            const inactive = dept.is_active === false;

            return (
              <article
                key={dept.id}
                className={`dept-card${inactive ? ' dept-card--inactive' : ''}`}
              >
                <div className="dept-card__header">
                  <div className="dept-card__identity">
                    <span className="dept-card__icon" aria-hidden>
                      <UsersIcon size={18} />
                    </span>
                    <div>
                      <h2 className="dept-card__title">
                        {dept.name?.trim() || `Department #${dept.id}`}
                      </h2>
                      {dept.description?.trim() && (
                        <p className="dept-card__desc">{dept.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Edit ${dept.name}`}
                    onClick={() => openEdit(dept)}
                    disabled={busy}
                  >
                    <Pencil size={16} />
                  </button>
                </div>

                <div className="dept-card__stats">
                  <span className="dept-stat dept-stat--users">
                    <UsersIcon size={14} />
                    {userCount} member{userCount !== 1 ? 's' : ''}
                  </span>
                  <span className="dept-stat dept-stat--tasks">
                    <ListTodo size={14} />
                    {taskCount} task{taskCount !== 1 ? 's' : ''}
                  </span>
                  <span
                    className={`dept-card__status${inactive ? ' dept-card__status--inactive' : ''}`}
                  >
                    {inactive ? 'Inactive' : 'Active'}
                  </span>
                </div>

                <div className="dept-card__actions">
                  <Link
                    to={`/departments/${dept.id}`}
                    className="btn btn--ghost dept-card__action"
                  >
                    View members
                  </Link>
                  {inactive ? (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={busy}
                      onClick={() => handleReactivate(dept)}
                    >
                      <RotateCcw size={15} />
                      Reactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={busy}
                      onClick={() => handleSoftDelete(dept)}
                      title="Soft delete (deactivate)"
                    >
                      <Ban size={15} />
                      Deactivate
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    disabled={busy || taskCount > 0}
                    title={
                      taskCount > 0
                        ? 'Hard delete only when task count is 0'
                        : 'Permanently delete'
                    }
                    aria-label={`Hard delete ${dept.name}`}
                    onClick={() => handleHardDelete(dept)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Department' : 'Create Department'}</h2>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleSubmit} className="modal-form">
              <label className="form-field">
                <span>Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="form-field">
                <span>Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
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
