import apiClient from './client';
import type {
  TaskComment,
  ForwardReviewResponse,
  ReturnToCreatorResponse,
} from '../types/v2';

export async function listComments(taskId: number) {
  const { data } = await apiClient.get<TaskComment[]>(
    `/tasks/${taskId}/comments`,
  );
  return data;
}

export async function addComment(taskId: number, comment_text: string) {
  const { data } = await apiClient.post(`/tasks/${taskId}/comments`, {
    comment_text,
  });
  return data;
}

export async function forwardForReview(taskId: number, senior_id: number) {
  const { data } = await apiClient.patch<ForwardReviewResponse>(
    `/tasks/${taskId}/forward-review`,
    { senior_id },
  );
  return data;
}

export async function returnToCreator(taskId: number) {
  const { data } = await apiClient.patch<ReturnToCreatorResponse>(
    `/tasks/${taskId}/return-to-creator`,
  );
  return data;
}
