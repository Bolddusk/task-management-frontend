import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Star,
  Trash2,
  Users as UsersIcon,
  ListTodo,
} from 'lucide-react';
import { PageHero } from '../components/common/PageHero';
import {
  getDepartment,
  getDepartmentUsers,
  addDepartmentUsers,
  setDepartmentUserPrimary,
  removeDepartmentUser,
} from '../api/departments';
import { getUsers } from '../api/users';
import { getErrorMessage } from '../api/client';
import { formatRoleLabel } from '../utils/format';
import type { Department, DepartmentMember, UserListItem } from '../types';

export function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const deptId = Number(id);

  const [dept, setDept] = useState<Department | null>(null);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [setAsPrimary, setSetAsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const load = useCallback(async () => {
    if (!Number.isFinite(deptId) || deptId <= 0) return;
    setLoading(true);
    setError('');
    try {
      const [detail, usersRes] = await Promise.all([
        getDepartment(deptId),
        getDepartmentUsers(deptId),
      ]);
      setDept(detail);
      setMembers(usersRes.users);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [deptId]);

  useEffect(() => {
    load();
  }, [load]);

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.id)),
    [members],
  );

  const openAdd = async () => {
    setError('');
    setMessage('');
    setSelectedIds([]);
    setSetAsPrimary(false);
    setUserSearch('');
    setAddOpen(true);
    try {
      const res = await getUsers({ page: 1, page_size: 200, is_active: true });
      setAllUsers(res.users);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const availableUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (memberIds.has(u.id)) return false;
      if (!q) return true;
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [allUsers, memberIds, userSearch]);

  const toggleUser = (userId: number) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((x) => x !== userId)
        : [...prev, userId],
    );
  };

  const handleAddMembers = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setError('Select at least one user');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await addDepartmentUsers(deptId, selectedIds, setAsPrimary);
      setMessage(
        `Added ${res.added ?? selectedIds.length}` +
          (res.skipped ? `, skipped ${res.skipped} already members` : ''),
      );
      setAddOpen(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (user: DepartmentMember) => {
    if (user.is_primary) return;
    setBusyUserId(user.id);
    setError('');
    setMessage('');
    try {
      await setDepartmentUserPrimary(deptId, user.id, true);
      setMessage(`${user.full_name} set as primary for this department`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRemove = async (user: DepartmentMember) => {
    if (
      !window.confirm(
        `Remove ${user.full_name} from this department?\n\nIf this is their only department, the API will block the remove.`,
      )
    ) {
      return;
    }
    setBusyUserId(user.id);
    setError('');
    setMessage('');
    try {
      await removeDepartmentUser(deptId, user.id);
      setMessage(`${user.full_name} removed`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  if (loading && !dept) {
    return (
      <div className="page">
        <p className="empty-state">Loading department...</p>
      </div>
    );
  }

  if (!dept) {
    return (
      <div className="page">
        <div className="form-error">{error || 'Department not found'}</div>
        <Link to="/departments" className="link-btn">
          Back to departments
        </Link>
      </div>
    );
  }

  return (
    <div className="page page--departments">
      <Link to="/departments" className="link-btn dept-back">
        <ArrowLeft size={16} />
        Back to departments
      </Link>

      <PageHero
        compact
        eyebrow="DEPARTMENT"
        title={dept.name}
        description={dept.description || 'Members and membership actions.'}
        meta={
          <>
            <span className="page-hero__chip">
              <UsersIcon size={14} /> {dept.user_count ?? members.length}{' '}
              members
            </span>
            <span className="page-hero__chip">
              <ListTodo size={14} /> {dept.task_count ?? 0} tasks
            </span>
            <span
              className={`page-hero__chip${dept.is_active === false ? ' page-hero__chip--warn' : ' page-hero__chip--ok'}`}
            >
              {dept.is_active === false ? 'Inactive' : 'Active'}
            </span>
          </>
        }
      />

      {error && <div className="form-error">{error}</div>}
      {message && <div className="form-success">{message}</div>}

      <div className="filters-bar">
        <div className="filters-bar__row filters-bar__row--actions">
          <span className="filters-bar__hint">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            <Plus size={18} />
            Add members
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>ROLE</th>
              <th>GRADE</th>
              <th>PRIMARY</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No members yet — add users to this department.
                </td>
              </tr>
            ) : (
              members.map((u) => {
                const busy = busyUserId === u.id;
                return (
                  <tr key={u.id}>
                    <td className="col-title">{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{formatRoleLabel(u.role_name)}</td>
                    <td>{u.grade_name || '—'}</td>
                    <td>
                      {u.is_primary ? (
                        <span className="dash-pill dash-pill--green">
                          Primary
                        </span>
                      ) : (
                        <span className="dash-pill dash-pill--neutral">No</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        {!u.is_primary && (
                          <button
                            type="button"
                            className="btn btn--ghost"
                            disabled={busy}
                            onClick={() => handleSetPrimary(u)}
                            title="Set as primary department for this user"
                          >
                            <Star size={14} />
                            Set primary
                          </button>
                        )}
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          disabled={busy}
                          aria-label={`Remove ${u.full_name}`}
                          title="Remove from department"
                          onClick={() => handleRemove(u)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div
            className="modal modal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Add members — {dept.name}</h2>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleAddMembers} className="modal-form">
              <label className="form-field">
                <span>Search users</span>
                <input
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Name or email..."
                />
              </label>

              <div className="member-pick-list">
                {availableUsers.length === 0 ? (
                  <p className="empty-state">No available users to add</p>
                ) : (
                  availableUsers.map((u) => (
                    <label key={u.id} className="member-pick">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(u.id)}
                        onChange={() => toggleUser(u.id)}
                      />
                      <span className="member-pick__name">{u.full_name}</span>
                      <span className="member-pick__meta">
                        {u.email} · {formatRoleLabel(u.role_name)}
                      </span>
                    </label>
                  ))
                )}
              </div>

              <label className="toggle-check">
                <input
                  type="checkbox"
                  checked={setAsPrimary}
                  onChange={(e) => setSetAsPrimary(e.target.checked)}
                />
                Set this department as primary for selected users
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={saving || selectedIds.length === 0}
                >
                  {saving
                    ? 'Adding...'
                    : `Add ${selectedIds.length || ''} member${selectedIds.length === 1 ? '' : 's'}`.trim()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
