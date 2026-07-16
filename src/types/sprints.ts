export type SprintStatus = 'planned' | 'active' | 'completed';

export interface SprintStats {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  cancelled_tasks: number;
  avg_completion: number;
}

export interface Sprint {
  id: number;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  created_by: { id: number; full_name: string };
  stats?: SprintStats;
}

export interface SprintRef {
  id: number;
  name: string;
  status: SprintStatus;
  start_date: string;
  end_date: string;
}

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  start_date: string;
  end_date: string;
  status?: SprintStatus;
}

export interface UpdateSprintRequest {
  name?: string;
  goal?: string | null;
  start_date?: string;
  end_date?: string;
  status?: SprintStatus;
}

export const SPRINT_STATUS_LABEL: Record<SprintStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed',
};
