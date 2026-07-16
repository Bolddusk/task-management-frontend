import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BellRing,
  Trash2,
  Upload,
  Send,
  Pencil,
  Share2,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import {
  PageHero,
  StatusBadge,
  PriorityBadge,
  ReviewStatusBadge,
  DashboardCard,
} from '../components/common/PageHero';
import { ActivityTimeline } from '../components/tasks/ActivityTimeline';
import {
  getTask,
  updateTask,
  updateTaskStatus,
  requestTaskUpdate,
  createTaskUpdate,
  editTaskUpdate,
  submitTaskUpdate,
  uploadTaskDocuments,
  deleteTaskDocument,
  getFileUrl,
} from '../api/tasks';
import {
  listComments,
  addComment,
  forwardForReview,
  returnToCreator,
} from '../api/tasksReview';
import { getErrorMessage } from '../api/client';
import { getSeniorOfficers } from '../api/users';
import { listSprints } from '../api/sprints';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatUserRoleLine, displayUserLabel, formatAssigneeOption } from '../utils/format';
import {
  canSubmitProgress,
  formatAssigneesList,
  getTaskAssignees,
  myProgress,
} from '../utils/taskAssignees';
import type { SeniorOption, TaskComment } from '../types/v2';
import type { TaskDetail, TaskStatus, TaskUpdate } from '../types/tasks';
import type { Sprint } from '../types/sprints';
import { SPRINT_STATUS_LABEL } from '../types/sprints';

const STATUS_TRANSITIONS: Partial<Record<TaskStatus, TaskStatus[]>> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
};

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const taskId = Number(id);

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  const [updateText, setUpdateText] = useState('');
  const [updatePercent, setUpdatePercent] = useState(0);
  const [editingUpdate, setEditingUpdate] = useState<TaskUpdate | null>(null);
  const [updateSaving, setUpdateSaving] = useState(false);

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [seniors, setSeniors] = useState<SeniorOption[]>([]);
  const [seniorId, setSeniorId] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [sprintMoving, setSprintMoving] = useState(false);

  const loadTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getTask(taskId);
      setTask(data);
      setEditTitle(data.title);
      setEditDescription(data.description ?? '');
      setEditEndDate(data.end_date);
      const mine = data.assignees?.find(
        (a) => a.id === user?.id,
      )?.completion_percentage;
      setUpdatePercent(mine ?? 0);
      const taskComments = await listComments(taskId);
      setComments(taskComments);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [taskId, user?.id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  useEffect(() => {
    if (!reviewModalOpen) return;
    getSeniorOfficers()
      .then(setSeniors)
      .catch(() => setSeniors([]));
  }, [reviewModalOpen]);

  useEffect(() => {
    listSprints()
      .then((data) => setSprints(data.filter((s) => s.status !== 'completed')))
      .catch(() => setSprints([]));
  }, []);

  if (!taskId) return null;

  if (loading) {
    return <p className="empty-state">Loading task...</p>;
  }

  if (!task) {
    return (
      <div className="page">
        <div className="form-error">{error || 'Task not found'}</div>
        <Link to="/tasks" className="btn">
          Back to tasks
        </Link>
      </div>
    );
  }

  const taskAssignees = getTaskAssignees(task);
  const isAssignee = canSubmitProgress(task, user?.id);
  const myPersonalProgress = myProgress(task, user?.id) ?? 0;
  const isCreator = user?.id === task.creator.id;
  const isAdmin =
    user?.role_name === 'super_admin' || user?.role_name === 'admin';
  const isLocked =
    task.status === 'completed' || task.status === 'cancelled';
  const canEdit =
    hasPermission('task.create') &&
    (isCreator || isAdmin) &&
    !isLocked;
  const canChangeStatus = canEdit;
  const canSubmitUpdate =
    isAssignee && hasPermission('task.submit_update') && !isLocked;
  const canRequestUpdate = hasPermission('task.request_update');
  const canComment = hasPermission('task.comment') && !isLocked;
  const canForwardReview =
    isCreator &&
    hasPermission('task.forward_review') &&
    !isLocked &&
    task.review_status !== 'with_senior';
  const canReturnToCreator =
    hasPermission('task.review_return') &&
    !isLocked &&
    (task.review_status ?? 'none') === 'with_senior' &&
    task.review_assignee?.id === user?.id;
  const canManageSprint =
    hasAnyPermission('sprint.manage', 'task.create') && !isLocked;

  const updateRequested = task.activity_trail.some(
    (e) => e.action === 'update_requested',
  );

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateTask(taskId, {
        title: editTitle,
        description: editDescription || undefined,
        end_date: editEndDate,
      });
      setEditMode(false);
      setMessage('Task updated');
      await loadTask();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleStatusChange = async (status: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, status);
      setMessage(`Status changed to ${status.replace(/_/g, ' ')}`);
      await loadTask();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleRequestUpdate = async () => {
    try {
      await requestTaskUpdate(taskId);
      setMessage('Update requested — assignee notified');
      await loadTask();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleMoveSprint = async (nextSprintId: number | null) => {
    setSprintMoving(true);
    setError('');
    try {
      await updateTask(taskId, { sprint_id: nextSprintId });
      setMessage(
        nextSprintId == null ? 'Removed from sprint (backlog)' : 'Moved to sprint',
      );
      await loadTask();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSprintMoving(false);
    }
  };

  const handleForwardReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!seniorId) {
      setError('Please select a senior officer');
      return;
    }
    setReviewLoading(true);
    setError('');
    try {
      const result = await forwardForReview(taskId, seniorId);
      setReviewModalOpen(false);
      setSeniorId(0);
      setMessage(result.message || 'Task sent for review');
      await loadTask();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReturnToCreator = async () => {
    if (!confirm('Return this task to the creator?')) return;
    setReviewLoading(true);
    setError('');
    try {
      const result = await returnToCreator(taskId);
      setMessage(result.message || 'Task returned to creator');
      await loadTask();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentSaving(true);
    setError('');
    try {
      await addComment(taskId, commentText.trim());
      setCommentText('');
      setMessage('Comment added');
      const taskComments = await listComments(taskId);
      setComments(taskComments);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCommentSaving(false);
    }
  };

  const handleSaveDraft = async (e: FormEvent) => {
    e.preventDefault();
    if (!updateText.trim()) {
      setError('Please describe your progress');
      return;
    }
    setUpdateSaving(true);
    setError('');
    try {
      if (editingUpdate) {
        await editTaskUpdate(taskId, editingUpdate.id, {
          update_text: updateText,
          completion_percentage: updatePercent,
        });
      } else {
        await createTaskUpdate(taskId, updateText, updatePercent);
      }
      setUpdateText('');
      setEditingUpdate(null);
      setMessage('Draft saved — click Submit on the draft below, or write a new update');
      await loadTask();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdateSaving(false);
    }
  };

  const handleSubmitFromForm = async () => {
    if (!updateText.trim()) {
      setError('Please describe your progress');
      return;
    }
    if (updatePercent < myPersonalProgress) {
      setError(
        `Your completion cannot be lower than your current ${myPersonalProgress}%`,
      );
      return;
    }
    setUpdateSaving(true);
    setError('');
    try {
      let updateId: number;
      if (editingUpdate) {
        await editTaskUpdate(taskId, editingUpdate.id, {
          update_text: updateText,
          completion_percentage: updatePercent,
        });
        updateId = editingUpdate.id;
      } else {
        const draft = await createTaskUpdate(
          taskId,
          updateText,
          updatePercent,
        );
        updateId = draft.id;
      }
      await submitTaskUpdate(taskId, updateId);
      setUpdateText('');
      setEditingUpdate(null);
      setMessage('Update submitted');
      await loadTask();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdateSaving(false);
    }
  };

  const handleSubmitUpdate = async (updateId: number) => {
    try {
      await submitTaskUpdate(taskId, updateId);
      setMessage('Update submitted');
      await loadTask();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const fileArray = Array.from(files).slice(0, 5);
      await uploadTaskDocuments(taskId, fileArray);
      setMessage(`${fileArray.length} file(s) uploaded`);
      await loadTask();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!confirm('Delete this document?')) return;
    try {
      await deleteTaskDocument(taskId, docId);
      await loadTask();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const nextStatuses = STATUS_TRANSITIONS[task.status] ?? [];
  const draftUpdates = task.updates.filter((u) => !u.is_submitted);

  return (
    <div className="page">
      <div className="page-back">
        <button type="button" className="link-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <PageHero
        eyebrow="TASK DETAIL"
        title={task.title}
        description={task.description ?? 'No description'}
      />

      {error && <div className="form-error">{error}</div>}
      {message && <div className="form-success">{message}</div>}

      {isAssignee && !isLocked && (
        <div className="assignee-banner">
          <div>
            <strong>You are assigned to this task</strong>
            <p>
              {canSubmitUpdate
                ? 'Write your progress below, then click Submit Update to finalize (or Save as Draft to finish later).'
                : 'Review the task details below.'}
              {updateRequested && ' An update has been requested by your manager.'}
            </p>
          </div>
        </div>
      )}

      {isCreator && !isLocked && hasPermission('task.forward_review') && (
        <div className="info-banner">
          <p>
            As creator, you can send this task to a senior officer for review
            using <strong>Send for Review</strong>.
            {task.review_status === 'returned' &&
              ' This task was returned — revise and resubmit if needed.'}
          </p>
        </div>
      )}

      {canComment && !isAssignee && !isLocked && (
        <div className="info-banner">
          <p>
            Senior review mode — add comments below. When review is complete,
            use <strong>Return to Creator</strong> to send the task back.
          </p>
        </div>
      )}

      {!isAssignee &&
        hasPermission('task.submit_update') &&
        !isLocked &&
        !canComment && (
          <div className="assignee-banner__warn assignee-banner">
            <strong>You cannot submit progress on this task</strong>
            <p>
              Logged in as <strong>{user?.full_name}</strong>, but you are not
              on this task&apos;s assignee list (
              <strong>{formatAssigneesList(task)}</strong>). Only assignees can
              submit progress. Open a task assigned to you from the Tasks list.
            </p>
          </div>
        )}

      {!isAssignee && !isCreator && !canComment && !isLocked && (
        <div className="info-banner">
          <p>
            Progress updates are submitted by assignees —{' '}
            <strong>{formatAssigneesList(task)}</strong>.
            {canRequestUpdate && ' Use "Request Update" to notify them.'}
          </p>
        </div>
      )}

      <div className="task-detail-header">
        <div className="task-detail-badges">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          <ReviewStatusBadge status={task.review_status ?? 'none'} />
          {task.sprint && (
            <Link
              to={`/sprints/${task.sprint.id}`}
              className={`sprint-badge sprint-badge--${task.sprint.status}`}
            >
              {task.sprint.name}
            </Link>
          )}
          {!task.sprint && (
            <span className="sprint-badge sprint-badge--backlog">Backlog</span>
          )}
          <span className="task-detail-progress">
            Overall {task.completion_percentage}% complete
          </span>
          {(task.review_status ?? 'none') === 'with_senior' &&
            task.review_assignee && (
            <span className="task-detail-progress">
              Reviewer: {task.review_assignee.full_name}
            </span>
          )}
        </div>
        <div className="task-detail-actions">
          {canEdit && !editMode && (
            <button
              type="button"
              className="btn"
              onClick={() => setEditMode(true)}
            >
              <Pencil size={16} /> Edit
            </button>
          )}
          {canRequestUpdate && !isAssignee && !isLocked && (
            <button
              type="button"
              className="btn"
              onClick={handleRequestUpdate}
            >
              <BellRing size={16} /> Request Update
            </button>
          )}
          {canForwardReview && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setError('');
                setSeniorId(0);
                setReviewModalOpen(true);
              }}
            >
              <Share2 size={16} /> Send for Review
            </button>
          )}
          {canReturnToCreator && (
            <button
              type="button"
              className="btn btn--primary"
              disabled={reviewLoading}
              onClick={handleReturnToCreator}
            >
              <RotateCcw size={16} /> Return to Creator
            </button>
          )}
          {canChangeStatus &&
            nextStatuses.map((s) => (
              <button
                key={s}
                type="button"
                className="btn btn--primary"
                onClick={() => handleStatusChange(s)}
              >
                Mark {s.replace(/_/g, ' ')}
              </button>
            ))}
        </div>
      </div>

      {editMode && (
        <div className="form-card">
          <form onSubmit={handleSaveEdit} className="task-form">
            <label className="form-field">
              <span>Title</span>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </label>
            <label className="form-field">
              <span>Description</span>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </label>
            <label className="form-field">
              <span>End Date</span>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                required
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn--primary">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="task-detail-grid">
        <DashboardCard title="Task Info">
          <dl className="info-list">
            <div>
              <dt>Assignees</dt>
              <dd>{formatAssigneesList(task)}</dd>
            </div>
            <div>
              <dt>Creator</dt>
              <dd>
                {displayUserLabel(task.creator)} (
                {formatUserRoleLine(task.creator)})
              </dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{task.dept.name}</dd>
            </div>
            <div>
              <dt>Sprint</dt>
              <dd>
                {task.sprint ? (
                  <Link to={`/sprints/${task.sprint.id}`}>
                    {task.sprint.name} ({SPRINT_STATUS_LABEL[task.sprint.status]})
                  </Link>
                ) : (
                  'Backlog'
                )}
              </dd>
            </div>
            {canManageSprint && (
              <div>
                <dt>Move to sprint</dt>
                <dd>
                  <select
                    value={task.sprint?.id ?? ''}
                    disabled={sprintMoving}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleMoveSprint(val ? Number(val) : null);
                    }}
                  >
                    <option value="">Backlog</option>
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </dd>
              </div>
            )}
            <div>
              <dt>Start</dt>
              <dd>{formatDate(task.start_date)}</dd>
            </div>
            <div>
              <dt>End</dt>
              <dd>{formatDate(task.end_date)}</dd>
            </div>
          </dl>
        </DashboardCard>

        <DashboardCard
          title="Assignee Progress"
          subtitle="Each person tracks their own %. Overall is the average. Task completes when everyone reaches 100%."
        >
          <ul className="assignee-progress-list">
            {taskAssignees.map((a) => (
              <li key={a.id} className="assignee-progress-row">
                <div className="assignee-progress-row__meta">
                  <span className="assignee-progress-row__name">
                    {displayUserLabel(a)}
                    {a.id === user?.id ? ' (you)' : ''}
                  </span>
                  <span className="assignee-progress-row__pct">
                    {a.completion_percentage}%
                  </span>
                </div>
                <div
                  className="assignee-progress-bar"
                  role="progressbar"
                  aria-valuenow={a.completion_percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="assignee-progress-bar__fill"
                    style={{ width: `${a.completion_percentage}%` }}
                  />
                </div>
              </li>
            ))}
            <li className="assignee-progress-row assignee-progress-row--overall">
              <div className="assignee-progress-row__meta">
                <span className="assignee-progress-row__name">Overall</span>
                <span className="assignee-progress-row__pct">
                  {task.completion_percentage}%
                </span>
              </div>
              <div
                className="assignee-progress-bar assignee-progress-bar--overall"
                role="progressbar"
                aria-valuenow={task.completion_percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="assignee-progress-bar__fill"
                  style={{ width: `${task.completion_percentage}%` }}
                />
              </div>
            </li>
          </ul>
        </DashboardCard>
      </div>

      <div className="task-detail-grid">
        <DashboardCard title="Documents">
          {!isLocked && (
            <label className="upload-btn">
              <Upload size={16} />
              Upload files
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx"
                hidden
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
          )}
          {task.documents.length === 0 ? (
            <p className="empty-state">No documents</p>
          ) : (
            <ul className="doc-list">
              {task.documents.map((doc) => (
                <li key={doc.id} className="doc-list__item">
                  <a
                    href={getFileUrl(doc.file_url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {doc.original_filename}
                  </a>
                  {canEdit && (
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => handleDeleteDoc(doc.id)}
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard
          title="Review Comments"
          subtitle={
            canComment
              ? 'Add feedback for the task creator'
              : 'Senior officer comments'
          }
        >
          {canComment && (
            <form onSubmit={handleAddComment} className="update-form">
              <label className="form-field">
                <span>Your comment</span>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  placeholder="Add review feedback..."
                  required
                />
              </label>
              <div className="update-form__actions">
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={commentSaving}
                >
                  <MessageSquare size={16} />{' '}
                  {commentSaving ? 'Adding...' : 'Add Comment'}
                </button>
              </div>
            </form>
          )}
          {comments.length === 0 ? (
            <p className="empty-state">No comments yet</p>
          ) : (
            <ul className="comment-list">
              {comments.map((c) => (
                <li key={c.id} className="comment-list__item">
                  <p>{c.comment_text}</p>
                  <span className="update-list__meta">
                    {displayUserLabel(c.author)}
                    {c.is_review_comment && ' · Review'} ·{' '}
                    {formatDateTime(c.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>

      <div className="task-detail-grid">
        <DashboardCard
          title="Progress Updates"
          subtitle={
            canSubmitUpdate
              ? `Your progress: ${myPersonalProgress}% · Overall: ${task.completion_percentage}%`
              : isAssignee
                ? 'Assigned to you — see banner above'
                : `Assignees: ${formatAssigneesList(task)}`
          }
        >
          {canSubmitUpdate && (
            <form onSubmit={handleSaveDraft} className="update-form">
              <label className="form-field">
                <span>What did you accomplish?</span>
                <textarea
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  rows={4}
                  placeholder="Describe your progress on this task..."
                  required
                />
              </label>
              <label className="form-field">
                <span>
                  Your completion % (current: {myPersonalProgress}% — cannot go
                  lower; does not change others)
                </span>
                <input
                  type="number"
                  min={myPersonalProgress}
                  max={100}
                  value={updatePercent}
                  onChange={(e) => setUpdatePercent(Number(e.target.value))}
                  required
                />
              </label>
              <div className="update-form__actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={updateSaving}
                  onClick={handleSubmitFromForm}
                >
                  <Send size={16} />{' '}
                  {updateSaving ? 'Submitting...' : 'Submit Update'}
                </button>
                <button type="submit" className="btn" disabled={updateSaving}>
                  {editingUpdate ? 'Save Draft' : 'Save as Draft'}
                </button>
                {editingUpdate && (
                  <button
                    type="button"
                    className="btn"
                    disabled={updateSaving}
                    onClick={() => {
                      setEditingUpdate(null);
                      setUpdateText('');
                      setUpdatePercent(myPersonalProgress);
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          )}

          {draftUpdates.length > 0 && canSubmitUpdate && (
            <div className="draft-updates">
              <h4 className="draft-updates__title">Saved drafts</h4>
              <ul className="update-list">
                {draftUpdates.map((u) => (
                  <li key={u.id} className="update-list__item update-list__item--draft">
                    <div>
                      <p>{u.update_text}</p>
                      <span className="update-list__meta">
                        {u.completion_percentage}% · Draft ·{' '}
                        {u.submitted_by.full_name}
                      </span>
                    </div>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => {
                          setEditingUpdate(u);
                          setUpdateText(u.update_text);
                          setUpdatePercent(u.completion_percentage);
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        disabled={updateSaving}
                        onClick={() => handleSubmitUpdate(u.id)}
                      >
                        <Send size={14} /> Submit
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {task.updates.filter((u) => u.is_submitted).length === 0 &&
          draftUpdates.length === 0 ? (
            <p className="empty-state">
              {canSubmitUpdate
                ? 'No updates yet — use the form above to add your first progress update.'
                : isAssignee
                  ? 'You cannot submit updates with your current permissions.'
                  : hasPermission('task.submit_update')
                    ? `Only assignees (${formatAssigneesList(task)}) can submit progress here.`
                    : 'No updates submitted yet.'}
            </p>
          ) : task.updates.some((u) => u.is_submitted) ? (
            <div className="submitted-updates">
              <h4 className="draft-updates__title">Submitted updates</h4>
              <ul className="update-list">
                {task.updates
                  .filter((u) => u.is_submitted)
                  .map((u) => (
                    <li key={u.id} className="update-list__item">
                      <div>
                        <p>{u.update_text}</p>
                        <span className="update-list__meta">
                          {u.completion_percentage}% · Submitted ·{' '}
                          {u.submitted_by.full_name}
                        </span>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
          {draftUpdates.length > 0 && canSubmitUpdate && (
            <p className="form-hint">
              <strong>Tip:</strong> Use Submit Update on the form for a one-step
              submit, or submit a saved draft from the list above.
            </p>
          )}
        </DashboardCard>

        <DashboardCard title="Activity Trail">
          <ActivityTimeline trail={task.activity_trail} />
        </DashboardCard>
      </div>

      {reviewModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !reviewLoading && setReviewModalOpen(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Send for Review</h2>
            <p className="form-hint">
              Forward this task to a senior officer for review and comments.
            </p>
            <form onSubmit={handleForwardReview} className="modal-form">
              <label className="form-field">
                <span>Senior officer</span>
                <select
                  value={seniorId || ''}
                  onChange={(e) => setSeniorId(Number(e.target.value))}
                  required
                >
                  <option value="">Select senior</option>
                  {seniors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatAssigneeOption(s)}
                    </option>
                  ))}
                </select>
              </label>
              {seniors.length === 0 && (
                <p className="form-hint">No senior officers available.</p>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn"
                  disabled={reviewLoading}
                  onClick={() => setReviewModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={reviewLoading || seniors.length === 0}
                >
                  {reviewLoading ? 'Sending...' : 'Send for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
