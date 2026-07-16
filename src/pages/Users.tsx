import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, UserX, Search } from 'lucide-react';
import { PageHero } from '../components/common/PageHero';
import {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
} from '../api/users';
import { getDepartments } from '../api/departments';
import { listGrades } from '../api/grades';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getAssignableRoles } from '../constants/roles';
import { formatRoleLabel, displayUserLabel } from '../utils/format';
import { isOfficerRole } from '../constants/roles';
import type { Department, UserListItem, RoleName } from '../types';
import type { Grade } from '../types/v2';

const GRADE_OPTIONAL_ROLES: RoleName[] = ['super_admin', 'admin'];

const EMPTY_FORM = {
  full_name: '',
  email: '',
  password: '',
  phone: '',
  role_id: 7,
  grade_id: 0,
  dept_ids: [] as number[],
};

export function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const assignableRoles = getAssignableRoles(currentUser?.role_name ?? 'officer');
  const selectedRoleName =
    assignableRoles.find((r) => r.id === form.role_id)?.name ??
    editing?.role_name;
  const gradeRequired =
    !!selectedRoleName && !GRADE_OPTIONAL_ROLES.includes(selectedRoleName);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers({ page, page_size: 20, search: search || undefined });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
    listGrades()
      .then((data) => setGrades(data.sort((a, b) => b.level - a.level)))
      .catch(() => setGrades([]));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      dept_ids: departments[0] ? [departments[0].id] : [],
      grade_id: grades[0]?.id ?? 0,
    });
    setModalOpen(true);
  };

  const openEdit = (u: UserListItem) => {
    setEditing(u);
    setForm({
      full_name: u.full_name,
      email: u.email,
      password: '',
      phone: u.phone ?? '',
      role_id: assignableRoles.find((r) => r.name === u.role_name)?.id ?? 7,
      grade_id: u.grade_id ?? 0,
      dept_ids: u.departments.map((d) => d.id),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const toggleDept = (id: number) => {
    setForm((f) => ({
      ...f,
      dept_ids: f.dept_ids.includes(id)
        ? f.dept_ids.filter((d) => d !== id)
        : [...f.dept_ids, id],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          full_name: form.full_name,
          phone: form.phone || undefined,
          dept_ids: form.dept_ids,
        };
        if (form.grade_id) payload.grade_id = form.grade_id;
        if (editing.id !== currentUser?.id) {
          payload.role_id = form.role_id;
        }
        await updateUser(editing.id, payload);
      } else {
        await createUser({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role_id: form.role_id,
          ...(form.grade_id ? { grade_id: form.grade_id } : {}),
          phone: form.phone || undefined,
          dept_ids: form.dept_ids,
        });
      }
      closeModal();
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await deactivateUser(id);
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="page">
      <PageHero
        eyebrow="ADMINISTRATION"
        title="Users"
        description="Manage users, roles, and department assignments."
      />

      <div className="filters-bar">
        <div className="filters-bar__row filters-bar__row--actions">
          <form
            className="search-input"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput);
            }}
          >
            <Search size={18} />
            <input
              type="search"
              placeholder="Search name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {error && !modalOpen && <div className="form-error">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="empty-state">Loading users...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>GRADE</th>
                <th>DEPARTMENTS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="col-title">{displayUserLabel(u)}</td>
                    <td>{u.email}</td>
                    <td>
                      {isOfficerRole(u.role_name)
                        ? 'Officer'
                        : formatRoleLabel(u.role_name)}
                    </td>
                    <td>{u.grade_name ?? '—'}</td>
                    <td>
                      {u.departments.map((d) => d.name).join(', ') || '—'}
                    </td>
                    <td>
                      <span
                        className={`status-badge status-badge--${u.is_active ? 'completed' : 'cancelled'}`}
                      >
                        {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Edit"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil size={16} />
                        </button>
                        {currentUser?.role_name === 'super_admin' &&
                          u.id !== currentUser.id &&
                          u.is_active && (
                            <button
                              type="button"
                              className="icon-btn icon-btn--danger"
                              aria-label="Deactivate"
                              onClick={() => handleDeactivate(u.id)}
                            >
                              <UserX size={16} />
                            </button>
                          )}
                      </div>
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
            Page {page} of {totalPages} ({total} users)
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

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit User' : 'Create User'}</h2>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleSubmit} className="modal-form">
              <label className="form-field">
                <span>Full Name</span>
                <input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  required
                />
              </label>
              {!editing && (
                <label className="form-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    required
                  />
                </label>
              )}
              {!editing && (
                <label className="form-field">
                  <span>Temporary Password</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    required
                    minLength={8}
                  />
                </label>
              )}
              <label className="form-field">
                <span>Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </label>
              {(!editing || editing.id !== currentUser?.id) && (
                <label className="form-field">
                  <span>Role</span>
                  <select
                    value={form.role_id}
                    onChange={(e) => {
                      const role_id = Number(e.target.value);
                      const roleName = assignableRoles.find(
                        (r) => r.id === role_id,
                      )?.name;
                      setForm((f) => ({
                        ...f,
                        role_id,
                        grade_id:
                          roleName &&
                          GRADE_OPTIONAL_ROLES.includes(roleName)
                            ? 0
                            : f.grade_id,
                      }));
                    }}
                  >
                    {assignableRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="form-field">
                <span>Grade{gradeRequired ? '' : ' (optional)'}</span>
                <select
                  value={form.grade_id || ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      grade_id: Number(e.target.value),
                    }))
                  }
                  required={gradeRequired}
                >
                  <option value="">
                    {gradeRequired ? 'Select grade' : 'No grade (admin roles)'}
                  </option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (level {g.level})
                    </option>
                  ))}
                </select>
                {!gradeRequired && (
                  <span className="form-hint">
                    Super Admin and Admin do not require a grade.
                  </span>
                )}
              </label>
              <fieldset className="form-field">
                <span>Departments</span>
                <div className="checkbox-group">
                  {departments.map((d) => (
                    <label key={d.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.dept_ids.includes(d.id)}
                        onChange={() => toggleDept(d.id)}
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={
                    saving ||
                    form.dept_ids.length === 0 ||
                    (gradeRequired && !form.grade_id)
                  }
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
