export interface Grade {
  id: number;
  org_id: number;
  name: string;
  level: number;
  created_at: string;
}

export type ReviewStatus = 'none' | 'with_senior' | 'returned';

export interface TaskComment {
  id: number;
  comment_text: string;
  is_review_comment: boolean;
  created_at: string;
  author: { id: number; full_name: string; role_name: string };
}

export interface ReviewAssignee {
  id: number;
  full_name: string;
  role_name: string;
}

export interface SeniorOption {
  id: number;
  full_name: string;
  role_name: string;
  grade_name: string;
  grade_level: number;
}

export interface ForwardReviewResponse {
  message: string;
  review_status: ReviewStatus;
  review_assignee: ReviewAssignee;
}

export interface ReturnToCreatorResponse {
  message: string;
  review_status: ReviewStatus;
}
