import apiClient from './client';
import type {
  Sprint,
  CreateSprintRequest,
  UpdateSprintRequest,
  SprintStatus,
} from '../types/sprints';

export async function listSprints(status?: SprintStatus) {
  const { data } = await apiClient.get<Sprint[]>('/sprints', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function getSprint(id: number) {
  const { data } = await apiClient.get<Sprint>(`/sprints/${id}`);
  return data;
}

export async function createSprint(payload: CreateSprintRequest) {
  const { data } = await apiClient.post<Sprint>('/sprints', payload);
  return data;
}

export async function updateSprint(id: number, payload: UpdateSprintRequest) {
  const { data } = await apiClient.patch<Sprint>(`/sprints/${id}`, payload);
  return data;
}

export async function addTasksToSprint(sprintId: number, task_ids: number[]) {
  const { data } = await apiClient.post(`/sprints/${sprintId}/tasks`, {
    task_ids,
  });
  return data;
}

export async function removeTaskFromSprint(sprintId: number, taskId: number) {
  const { data } = await apiClient.delete(
    `/sprints/${sprintId}/tasks/${taskId}`,
  );
  return data;
}
