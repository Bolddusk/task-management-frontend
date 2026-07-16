// ─── Roles & Permissions ───────────────────────────────
export type RoleName =
  | 'super_admin'
  | 'admin'
  | 'minister'
  | 'secretary'
  | 'as'
  | 'js'
  | 'officer';

export type PermissionCode =
  | 'task.create'
  | 'task.assign_skip'
  | 'task.request_update'
  | 'task.submit_update'
  | 'task.view_all'
  | 'task.view_dept'
  | 'task.view_own'
  | 'task.export'
  | 'task.cancel'
  | 'task.comment'
  | 'task.forward_review'
  | 'task.review_return'
  | 'grade.manage'
  | 'sprint.manage'
  | 'user.manage'
  | 'dept.manage'
  | 'report.view_all'
  | 'report.view_own'
  | 'notification.receive'
  | 'admin.panel';

export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'update_requested'
  | 'task_completed';

// ─── Shared ────────────────────────────────────────────
export interface DepartmentRef {
  id: number;
  name: string;
  is_primary: number | boolean;
}

export interface ApiError {
  success?: false;
  message?: string;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// ─── Auth ──────────────────────────────────────────────
export interface LoginUser {
  id: number;
  org_id: number;
  role_id: number;
  role_name: RoleName;
  hierarchy_level: number;
  grade_name?: string | null;
  full_name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: LoginUser;
  must_change_password?: boolean;
}

export interface MeResponse {
  id: number;
  full_name: string;
  email: string;
  org_id: number;
  role_id: number;
  role_name: RoleName;
  hierarchy_level: number;
  grade_id: number | null;
  grade_name: string | null;
  grade_level: number | null;
  phone: string | null;
  is_active: boolean;
  must_change_password: boolean;
  departments: DepartmentRef[];
  permissions: PermissionCode[];
}

// ─── Users ─────────────────────────────────────────────
export interface UserListItem {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  role_name: RoleName;
  hierarchy_level: number;
  grade_id: number | null;
  grade_name: string | null;
  grade_level: number | null;
  departments: DepartmentRef[];
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface UserDropdownItem {
  id: number;
  full_name: string;
  role_name: RoleName;
  hierarchy_level: number;
  grade_name: string | null;
  grade_level: number | null;
  departments: DepartmentRef[];
}

export interface CreateUserRequest {
  full_name: string;
  email: string;
  password: string;
  role_id: number;
  grade_id?: number;
  phone?: string;
  dept_ids: number[];
}

export interface UpdateUserRequest {
  full_name?: string;
  phone?: string;
  role_id?: number;
  grade_id?: number;
  is_active?: boolean;
  dept_ids?: number[];
}

// ─── Departments ───────────────────────────────────────
export interface Department {
  id: number;
  org_id?: number;
  name: string;
  description: string | null;
  is_active: boolean;
  user_count?: number;
  task_count?: number;
  created_at?: string;
}

export interface DepartmentMember {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  role_name: RoleName;
  hierarchy_level?: number;
  grade_name?: string | null;
  is_primary: boolean;
}

export interface DepartmentUsersResponse {
  department: { id: number; name: string; is_active?: boolean };
  users: DepartmentMember[];
}

export interface AddDepartmentUsersResponse {
  added: number;
  skipped: number;
}

// ─── Notifications ─────────────────────────────────────
export interface Notification {
  id: number;
  user_id: number;
  task_id: number | null;
  type: NotificationType;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type {
  TaskPriority,
  TaskStatus,
  TaskListItem,
  TaskListResponse,
  TaskDetail,
  TaskAssignee,
  CreateTaskRequest,
  KanbanResponse,
  KanbanTask,
  TaskUpdate,
  TaskDocument,
  ActivityTrailEntry,
} from './tasks';

export type {
  ExportType,
  ExportFormat,
  ExportJob,
  ReportSummary,
  OverdueTask,
  UserReport,
  DeptReport,
  AdminSummary,
  DeptSummary,
  OwnerSummary,
} from './exports';

export {
  isAdminSummary,
  isDeptSummary,
  isOwnerSummary,
} from './exports';

export type {
  Grade,
  ReviewStatus,
  TaskComment,
  ReviewAssignee,
  SeniorOption,
  ForwardReviewResponse,
  ReturnToCreatorResponse,
} from './v2';

export type {
  SprintStatus,
  SprintStats,
  Sprint,
  SprintRef,
  CreateSprintRequest,
  UpdateSprintRequest,
} from './sprints';

export { SPRINT_STATUS_LABEL } from './sprints';
