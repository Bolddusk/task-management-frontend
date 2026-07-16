import apiClient from './client';
import type { ApiResponse } from '../types';

export async function checkHealth() {
  const { data } = await apiClient.get<ApiResponse<{ status: string }>>('/health');
  return data;
}
