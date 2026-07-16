import apiClient from './client';
import type {
  CreateExportRequest,
  CreateExportResponse,
  ExportJob,
} from '../types/exports';

export async function createExport(payload: CreateExportRequest) {
  const { data } = await apiClient.post<CreateExportResponse>(
    '/exports',
    payload,
  );
  return data;
}

export async function getExportHistory() {
  const { data } = await apiClient.get<ExportJob[]>('/exports');
  return data;
}

export async function downloadExport(jobId: number, filename?: string) {
  const response = await apiClient.get(`/exports/${jobId}/download`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `export_${jobId}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function getExportFileUrl(fileUrl: string) {
  const base =
    import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
    'http://localhost:5000';
  return `${base}${fileUrl}`;
}
