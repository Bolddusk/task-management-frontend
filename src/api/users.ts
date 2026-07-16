import apiClient from './client';
import type {
  UserListResponse,
  UserDropdownItem,
  CreateUserRequest,
  UpdateUserRequest,
  UserListItem,
  SeniorOption,
} from '../types';

export interface UserListParams {
  page?: number;
  page_size?: number;
  role_id?: number;
  is_active?: boolean | 0 | 1;
  dept_id?: number;
  search?: string;
}

export async function getUsers(params?: UserListParams) {
  const { data } = await apiClient.get<UserListResponse>('/users', { params });
  return data;
}

export async function getUserDropdown(deptId?: number) {
  const { data } = await apiClient.get<UserDropdownItem[]>('/users/dropdown', {
    params: deptId ? { dept_id: deptId } : undefined,
  });
  return data;
}

export async function getAssignableUsers(deptId: number) {
  const { data } = await apiClient.get<UserDropdownItem[]>('/users/dropdown', {
    params: { dept_id: deptId },
  });
  return data;
}

export async function getSeniorOfficers() {
  const { data } = await apiClient.get<SeniorOption[]>(
    '/users/dropdown/seniors',
  );
  return data;
}

export async function getUser(id: number) {
  const { data } = await apiClient.get(`/users/${id}`);
  return data;
}

export async function createUser(payload: CreateUserRequest) {
  const { data } = await apiClient.post<UserListItem>('/users', payload);
  return data;
}

export async function updateUser(id: number, payload: UpdateUserRequest) {
  const { data } = await apiClient.patch(`/users/${id}`, payload);
  return data;
}

export async function deactivateUser(id: number) {
  const { data } = await apiClient.delete(`/users/${id}`);
  return data;
}
