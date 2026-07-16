import apiClient from './client';
import type {
  TaskListResponse,
  KanbanResponse,
  TaskDetail,
  CreateTaskRequest,
  TaskStatus,
  TaskUpdate,
  UploadDocumentsResponse,
  ActivityTrailEntry,
} from '../types/tasks';

export interface TaskListParams {
  page?: number;
  page_size?: number;
  status?: TaskStatus;
  priority?: string;
  dept_id?: number;
  assigned_to?: number;
  created_by?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  /** number or 'none' for backlog */
  sprint_id?: number | 'none';
}

export async function getTasks(params?: TaskListParams) {
  const { data } = await apiClient.get<TaskListResponse>('/tasks', { params });
  return data;
}

export async function getKanban(params?: TaskListParams) {
  const { data } = await apiClient.get<KanbanResponse>('/tasks/kanban', {
    params,
  });
  return data;
}

export async function getTask(id: number) {
  const { data } = await apiClient.get<TaskDetail>(`/tasks/${id}`);
  return data;
}

export async function createTask(payload: CreateTaskRequest) {
  const { data } = await apiClient.post('/tasks', payload);
  return data;
}

export async function updateTask(
  id: number,
  payload: Partial<
    Pick<
      CreateTaskRequest,
      'title' | 'description' | 'priority' | 'end_date' | 'sprint_id'
    >
  >,
) {
  const { data } = await apiClient.patch(`/tasks/${id}`, payload);
  return data;
}

export async function updateTaskStatus(id: number, status: TaskStatus) {
  const { data } = await apiClient.patch(`/tasks/${id}/status`, { status });
  return data;
}

export async function requestTaskUpdate(id: number) {
  const { data } = await apiClient.post(`/tasks/${id}/request-update`);
  return data;
}

export async function getTaskTrail(id: number) {
  const { data } = await apiClient.get<ActivityTrailEntry[]>(
    `/tasks/${id}/trail`,
  );
  return data;
}

export async function getTaskUpdates(taskId: number) {
  const { data } = await apiClient.get<TaskUpdate[]>(
    `/tasks/${taskId}/updates`,
  );
  return data;
}

export async function createTaskUpdate(
  taskId: number,
  update_text: string,
  completion_percentage: number,
) {
  const { data } = await apiClient.post<TaskUpdate>(`/tasks/${taskId}/updates`, {
    update_text,
    completion_percentage,
  });
  return data;
}

export async function editTaskUpdate(
  taskId: number,
  updateId: number,
  payload: { update_text?: string; completion_percentage?: number },
) {
  const { data } = await apiClient.patch(
    `/tasks/${taskId}/updates/${updateId}`,
    payload,
  );
  return data;
}

export async function submitTaskUpdate(taskId: number, updateId: number) {
  const { data } = await apiClient.patch(
    `/tasks/${taskId}/updates/${updateId}/submit`,
  );
  return data;
}

export async function uploadTaskDocuments(taskId: number, files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  const { data } = await apiClient.post<UploadDocumentsResponse>(
    `/tasks/${taskId}/documents`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function deleteTaskDocument(taskId: number, docId: number) {
  const { data } = await apiClient.delete(
    `/tasks/${taskId}/documents/${docId}`,
  );
  return data;
}

export function getFileUrl(fileUrl: string) {
  const base =
    import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
    'http://localhost:5000';
  return `${base}${fileUrl}`;
}
