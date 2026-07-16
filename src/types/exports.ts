export type ExportType =
  | 'my_tasks'
  | 'dept_tasks'
  | 'all_tasks'
  | 'user_report'
  | 'dept_report'
  | 'audit_trail';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';
export type ExportStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface ExportFilters {
  dept_id?: number;
  user_id?: number;
  status?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
}

export interface CreateExportRequest {
  export_type: ExportType;
  format: ExportFormat;
  filters?: ExportFilters;
}

export interface ExportJob {
  id: number;
  export_type: ExportType;
  format: ExportFormat;
  status: ExportStatus;
  file_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface CreateExportResponse {
  job_id: number;
  file_url: string;
  status: 'done';
}

export interface ActivityEntry {
  id: number;
  task_id: number;
  action: string;
  actor_name: string;
  actor_role: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AdminSummary {
  total_tasks: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  completion_rate: string;
  overdue_tasks: number;
  tasks_by_dept: {
    dept_name: string;
    total: number;
    completed: number;
  }[];
  tasks_by_user: {
    full_name: string;
    role_name: string;
    assigned: number;
    completed: number;
  }[];
  recent_activity: ActivityEntry[];
}

export interface DeptSummary {
  dept_tasks: number;
  by_status: Record<string, number>;
  overdue_tasks: number;
  my_assigned_tasks: number;
  completion_rate: string;
  recent_activity: ActivityEntry[];
}

export interface OwnerSummary {
  my_tasks: number;
  by_status: Record<string, number>;
  overdue_tasks: number;
  avg_completion: string;
  recent_activity: ActivityEntry[];
}

export type ReportSummary = AdminSummary | DeptSummary | OwnerSummary;

export interface OverdueTask {
  id: number;
  title: string;
  priority: string;
  status: string;
  completion_percentage: number;
  start_date?: string;
  end_date?: string;
  days_overdue: number;
  assignee: { full_name: string; role_name: string };
  dept: { name: string };
}

export interface UserReport {
  user: { id: number; full_name: string; role_name: string };
  total_assigned: number;
  completed: number;
  in_progress: number;
  pending: number;
  cancelled: number;
  avg_completion_percentage: number;
  overdue: number;
  tasks: {
    id: number;
    title: string;
    status: string;
    priority: string;
    completion_percentage: number;
  }[];
}

export interface DeptReport {
  department: { id: number; name: string };
  by_user: {
    user: { id: number; full_name: string; role_name: string };
    tasks_assigned: number;
    completed: number;
    avg_completion: number;
  }[];
  tasks: {
    id: number;
    title: string;
    status: string;
    priority: string;
    completion_percentage: number;
    assignee_name: string;
  }[];
}

export function isAdminSummary(s: ReportSummary): s is AdminSummary {
  return 'total_tasks' in s;
}

export function isDeptSummary(s: ReportSummary): s is DeptSummary {
  return 'dept_tasks' in s;
}

export function isOwnerSummary(s: ReportSummary): s is OwnerSummary {
  return 'my_tasks' in s;
}
