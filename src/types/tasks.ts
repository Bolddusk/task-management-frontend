import type { ReviewAssignee, ReviewStatus } from './v2';
import type { SprintRef } from './sprints';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type ActivityAction =
  | 'task_created'
  | 'task_assigned'
  | 'task_forwarded'
  | 'task_updated'
  | 'update_submitted'
  | 'update_requested'
  | 'status_changed'
  | 'document_uploaded'
  | 'document_deleted';

export interface TaskUserRef {
  id: number;
  full_name: string;
  role_name: string;
  grade_name?: string | null;
  email?: string;
}

export interface TaskAssignee {
  id: number;
  full_name: string;
  email?: string;
  role_name: string;
  grade_name: string | null;
  grade_level?: number | null;
  completion_percentage: number;
  updated_at?: string;
}

export interface TaskListItem {
  id: number;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** Overall average of all assignees */
  completion_percentage: number;
  review_status?: ReviewStatus;
  review_assignee?: ReviewAssignee | null;
  start_date: string;
  end_date: string;
  created_at: string;
  /** First assignee (backward compatible) */
  assignee: TaskUserRef;
  /** All assignees with personal progress */
  assignees?: TaskAssignee[];
  creator: TaskUserRef;
  dept: { id: number; name: string };
  sprint?: SprintRef | null;
  latest_update: { update_text: string; submitted_at: string } | null;
}

export interface TaskListResponse {
  tasks: TaskListItem[];
  total: number;
  page: number;
  page_size: number;
  summary: Record<TaskStatus, number>;
}

export interface KanbanTask {
  id: number;
  title: string;
  priority: TaskPriority;
  completion_percentage: number;
  assignee_name: string;
  end_date: string;
  update_count: number;
}

export interface KanbanResponse {
  pending: KanbanTask[];
  in_progress: KanbanTask[];
  completed: KanbanTask[];
  cancelled: KanbanTask[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dept_id: number;
  /** Preferred: multi-assignee */
  assignee_ids?: number[];
  /** Legacy single assignee */
  assigned_to?: number;
  start_date: string;
  end_date: string;
  on_behalf_of?: number;
  sprint_id?: number | null;
}

export interface TaskUpdate {
  id: number;
  update_text: string;
  completion_percentage: number;
  is_submitted: boolean;
  submitted_at: string | null;
  created_at: string;
  submitted_by: TaskUserRef;
}

export interface TaskDocument {
  id: number;
  file_url: string;
  original_filename: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by_name?: string;
}

export interface ActivityTrailEntry {
  id: number;
  action: ActivityAction;
  actor: TaskUserRef;
  details: Record<string, unknown>;
  created_at: string;
}

export interface TaskDetail {
  id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  /** Overall average of all assignees */
  completion_percentage: number;
  review_status?: ReviewStatus;
  review_assignee?: ReviewAssignee | null;
  start_date: string;
  end_date: string;
  /** First assignee (backward compatible) */
  assignee: TaskUserRef;
  /** All assignees with personal progress */
  assignees?: TaskAssignee[];
  creator: TaskUserRef;
  on_behalf_of_user: { id: number; full_name: string } | null;
  dept: { id: number; name: string };
  sprint?: SprintRef | null;
  documents: TaskDocument[];
  updates: TaskUpdate[];
  activity_trail: ActivityTrailEntry[];
}

export interface UploadDocumentsResponse {
  uploaded: Array<{
    id: number;
    file_url: string;
    original_filename: string;
  }>;
}

