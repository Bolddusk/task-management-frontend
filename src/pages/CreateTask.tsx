import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { PageHero } from '../components/common/PageHero';
import { createTask } from '../api/tasks';
import { getDepartments } from '../api/departments';
import { getAssignableUsers, getUserDropdown } from '../api/users';
import { listSprints } from '../api/sprints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatAssigneeOption } from '../utils/format';
import type { Department, UserDropdownItem } from '../types';
import type { TaskPriority } from '../types/tasks';
import type { Sprint } from '../types/sprints';
import { SPRINT_STATUS_LABEL } from '../types/sprints';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

function filterAssigneesForBehalf(
  assignees: UserDropdownItem[],
  behalfUser: UserDropdownItem,
) {
  return assignees.filter(
    (candidate) =>
      candidate.id !== behalfUser.id &&
      candidate.grade_level != null &&
      behalfUser.grade_level != null &&
      candidate.grade_level < behalfUser.grade_level,
  );
}

export function CreateTask() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assignees, setAssignees] = useState<UserDropdownItem[]>([]);
  const [behalfUsers, setBehalfUsers] = useState<UserDropdownItem[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deptId, setDeptId] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [onBehalfOf, setOnBehalfOf] = useState<number>(0);
  const [sprintId, setSprintId] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin =
    user?.role_name === 'super_admin' || user?.role_name === 'admin';
  const hasAssignSkip = hasPermission('task.assign_skip');

  const behalfUser = onBehalfOf
    ? behalfUsers.find((candidate) => candidate.id === onBehalfOf)
    : undefined;

  const filteredAssignees =
    isAdmin && behalfUser
      ? filterAssigneesForBehalf(assignees, behalfUser)
      : assignees;

  const selectedAssignees = filteredAssignees.filter((u) =>
    selectedIds.includes(u.id),
  );
  const availableAssignees = filteredAssignees.filter(
    (u) => !selectedIds.includes(u.id),
  );

  useEffect(() => {
    getDepartments().then((depts) => {
      setDepartments(depts);
      if (depts.length > 0) setDeptId(depts[0].id);
    });
    listSprints()
      .then((data) => {
        setSprints(data.filter((s) => s.status !== 'completed'));
        const fromQuery = Number(searchParams.get('sprint_id'));
        if (fromQuery) setSprintId(fromQuery);
      })
      .catch(() => setSprints([]));
  }, [searchParams]);

  useEffect(() => {
    if (!deptId) return;
    getAssignableUsers(deptId)
      .then(setAssignees)
      .catch(() => setAssignees([]));
    if (isAdmin) {
      getUserDropdown(deptId)
        .then((users) =>
          setBehalfUsers(users.filter((u) => u.role_name === 'officer')),
        )
        .catch(() => setBehalfUsers([]));
    }
  }, [deptId, isAdmin]);

  const addAssignee = (id: number) => {
    if (!id || selectedIds.includes(id)) return;
    setSelectedIds((prev) => [...prev, id]);
  };

  const removeAssignee = (id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (endDate < startDate) {
      setError('End date must be on or after start date');
      return;
    }

    if (selectedIds.length === 0) {
      setError('Please select at least one assignee');
      return;
    }

    setLoading(true);
    try {
      const result = await createTask({
        title,
        description: description || undefined,
        priority,
        dept_id: deptId,
        assignee_ids: selectedIds,
        start_date: startDate,
        end_date: endDate,
        ...(onBehalfOf ? { on_behalf_of: onBehalfOf } : {}),
        ...(sprintId ? { sprint_id: sprintId } : {}),
      });
      navigate(`/tasks/${(result as { id: number }).id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <PageHero
        eyebrow="TASKS"
        title="Create Task"
        description={
          hasAssignSkip
            ? 'Assign one or more officers in the department. Grade rules apply only when creating on behalf of someone.'
            : 'Assign one or more junior officers in the same department (lower BPS grade).'
        }
      />

      <div className="form-card">
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit} className="task-form">
          <label className="form-field">
            <span>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={255}
            />
          </label>

          <label className="form-field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </label>

          <div className="form-row">
            <label className="form-field">
              <span>Priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Department</span>
              <select
                value={deptId}
                onChange={(e) => {
                  setDeptId(Number(e.target.value));
                  setSelectedIds([]);
                  setOnBehalfOf(0);
                }}
                required
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isAdmin && hasPermission('task.create') && (
            <label className="form-field">
              <span>Create on behalf of (optional)</span>
              <select
                value={onBehalfOf || ''}
                onChange={(e) => {
                  setOnBehalfOf(Number(e.target.value));
                  setSelectedIds([]);
                }}
              >
                <option value="">None — create as Admin</option>
                {behalfUsers.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {formatAssigneeOption(candidate)}
                  </option>
                ))}
              </select>
              <span className="form-hint">
                Create as if an officer created the task. When selected,
                assignees must have a lower BPS grade than that officer.
              </span>
            </label>
          )}

          <div className="form-field">
            <span>Assignees</span>
            {selectedAssignees.length > 0 && (
              <div className="assignee-chips">
                {selectedAssignees.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="assignee-chip"
                    onClick={() => removeAssignee(u.id)}
                    title="Remove"
                  >
                    {formatAssigneeOption(u)}
                    <X size={14} />
                  </button>
                ))}
              </div>
            )}
            <select
              value=""
              onChange={(e) => {
                addAssignee(Number(e.target.value));
                e.target.value = '';
              }}
              disabled={availableAssignees.length === 0}
            >
              <option value="">
                {selectedIds.length === 0
                  ? 'Add assignee...'
                  : 'Add another assignee...'}
              </option>
              {availableAssignees.map((u) => (
                <option key={u.id} value={u.id}>
                  {formatAssigneeOption(u)}
                </option>
              ))}
            </select>
            {filteredAssignees.length === 0 ? (
              <span className="form-hint">
                {isAdmin && !onBehalfOf
                  ? 'No officers available in this department.'
                  : onBehalfOf
                    ? 'No lower-grade officers for the selected person.'
                    : 'No junior officers in this department for your grade.'}
              </span>
            ) : (
              <span className="form-hint">
                Select one or more people. Each will track their own progress %.
                Overall task % is the average.
              </span>
            )}
          </div>

          <div className="form-row">
            <label className="form-field">
              <span>Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>
            <label className="form-field">
              <span>End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </label>
          </div>

          <label className="form-field">
            <span>Sprint (optional)</span>
            <select
              value={sprintId || ''}
              onChange={(e) => setSprintId(Number(e.target.value))}
            >
              <option value="">Backlog — no sprint</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({SPRINT_STATUS_LABEL[s.status]})
                </option>
              ))}
            </select>
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="btn"
              onClick={() => navigate('/tasks')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading || selectedIds.length === 0}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
