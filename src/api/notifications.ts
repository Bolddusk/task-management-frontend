import apiClient from './client';
import type { NotificationsResponse } from '../types';

export async function getNotifications(params?: {
  is_read?: 0 | 1;
  limit?: number;
}) {
  const { data } = await apiClient.get<NotificationsResponse>(
    '/notifications',
    { params },
  );
  return data;
}

export async function markNotificationRead(id: number) {
  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.patch('/notifications/read-all');
  return data;
}
