import apiClient from './client';
import type {
  ReportSummary,
  OverdueTask,
  UserReport,
  DeptReport,
} from '../types/exports';

export async function getReportSummary() {
  const { data } = await apiClient.get<ReportSummary>('/reports/summary');
  return data;
}

export async function getOverdueTasks() {
  const { data } = await apiClient.get<OverdueTask[]>('/reports/overdue');
  return data;
}

export async function getUserReport(userId: number) {
  const { data } = await apiClient.get<UserReport>(`/reports/user/${userId}`);
  return data;
}

export async function getDeptReport(deptId: number) {
  const { data } = await apiClient.get<DeptReport>(`/reports/dept/${deptId}`);
  return data;
}
