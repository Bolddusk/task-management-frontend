import apiClient from './client';
import type { LoginResponse, MeResponse } from '../types';

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get<MeResponse>('/auth/me');
  return data;
}

export async function changePassword(
  current_password: string,
  new_password: string,
) {
  const { data } = await apiClient.patch<{ message: string }>(
    '/auth/change-password',
    { current_password, new_password },
  );
  return data;
}
