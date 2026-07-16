import type { TaskAssignee, TaskDetail, TaskListItem, TaskUserRef } from '../types/tasks';
import { displayUserLabel } from './format';

type TaskWithAssignees = Pick<TaskListItem | TaskDetail, 'assignee' | 'assignees'>;

/** Prefer assignees[]; fall back to single assignee for older payloads. */
export function getTaskAssignees(task: TaskWithAssignees): TaskAssignee[] {
  if (task.assignees && task.assignees.length > 0) {
    return task.assignees;
  }
  const a = task.assignee;
  return [
    {
      id: a.id,
      full_name: a.full_name,
      role_name: a.role_name,
      grade_name: a.grade_name ?? null,
      email: a.email,
      completion_percentage: 0,
    },
  ];
}

export function canSubmitProgress(
  task: TaskWithAssignees,
  userId: number | undefined,
): boolean {
  if (!userId) return false;
  return getTaskAssignees(task).some((a) => a.id === userId);
}

export function myProgress(
  task: TaskWithAssignees,
  userId: number | undefined,
): number | null {
  if (!userId) return null;
  return (
    getTaskAssignees(task).find((a) => a.id === userId)?.completion_percentage ??
    null
  );
}

export function formatAssigneesList(task: TaskWithAssignees): string {
  return getTaskAssignees(task)
    .map((a) => displayUserLabel(a as TaskUserRef & { grade_name?: string | null }))
    .join(', ');
}
