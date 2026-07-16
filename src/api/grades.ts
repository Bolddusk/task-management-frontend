import apiClient from './client';
import type { Grade } from '../types/v2';

export async function listGrades() {
  const { data } = await apiClient.get<Grade[]>('/grades');
  return data;
}

export async function createGrade(payload: { name: string; level: number }) {
  const { data } = await apiClient.post<Grade>('/grades', payload);
  return data;
}

export async function updateGrade(
  id: number,
  payload: Partial<{ name: string; level: number }>,
) {
  const { data } = await apiClient.patch<Grade>(`/grades/${id}`, payload);
  return data;
}
