import apiClient from './client';
import type {
  Department,
  DepartmentUsersResponse,
  AddDepartmentUsersResponse,
} from '../types';

export async function getDepartments(includeInactive = false) {
  const { data } = await apiClient.get<Department[]>('/departments', {
    params: includeInactive ? { include_inactive: 1 } : undefined,
  });
  return data;
}

export async function getDepartment(id: number) {
  const { data } = await apiClient.get<Department>(`/departments/${id}`);
  return data;
}

export async function createDepartment(name: string, description?: string) {
  const { data } = await apiClient.post<Department>('/departments', {
    name,
    description,
  });
  return data;
}

export async function updateDepartment(
  id: number,
  payload: Partial<Pick<Department, 'name' | 'description' | 'is_active'>>,
) {
  const { data } = await apiClient.patch<Department>(
    `/departments/${id}`,
    payload,
  );
  return data;
}

/** Soft delete by default; pass hard=true only when task_count === 0 */
export async function deleteDepartment(id: number, hard = false) {
  const { data } = await apiClient.delete(`/departments/${id}`, {
    params: hard ? { hard: 1 } : undefined,
  });
  return data;
}

export async function getDepartmentUsers(id: number) {
  const { data } = await apiClient.get<DepartmentUsersResponse>(
    `/departments/${id}/users`,
  );
  return data;
}

export async function addDepartmentUsers(
  id: number,
  userIds: number[],
  isPrimary = false,
) {
  const { data } = await apiClient.post<AddDepartmentUsersResponse>(
    `/departments/${id}/users`,
    { user_ids: userIds, is_primary: isPrimary },
  );
  return data;
}

export async function setDepartmentUserPrimary(
  deptId: number,
  userId: number,
  isPrimary = true,
) {
  const { data } = await apiClient.patch(
    `/departments/${deptId}/users/${userId}`,
    { is_primary: isPrimary },
  );
  return data;
}

export async function removeDepartmentUser(deptId: number, userId: number) {
  const { data } = await apiClient.delete(
    `/departments/${deptId}/users/${userId}`,
  );
  return data;
}
