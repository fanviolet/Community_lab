export type RequestStatus = "pending" | "accepted" | "declined" | "completed";
export type IssueStatus = "open" | "in_progress" | "resolved" | "blocked";
export type IssuePriority = "low" | "medium" | "high" | "critical";
export type CommunicationType = "message" | "note" | "update" | "feedback";

export interface MentorProfile {
  id: string;
  user_id: string;
  expertise: string[];
  bio: string | null;
  availability: string | null;
  years_experience: number;
  mentorship_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface MentorProfileWithUser extends MentorProfile {
  user: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface MentorshipRequest {
  id: string;
  project_id: string;
  mentor_id: string;
  requested_by: string;
  status: RequestStatus;
  challenge_description: string;
  expected_outcome: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentorshipRequestWithRelations extends MentorshipRequest {
  project?: {
    id: string;
    title: string;
  };
  mentor?: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  requested_by_user?: {
    id: string;
    display_name: string | null;
    email: string;
  };
}

export interface MentoringSession {
  id: string;
  mentorship_request_id: string;
  topic: string;
  session_date: string;
  notes: string | null;
  action_items: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MentoringSessionWithCreator extends MentoringSession {
  created_by_user?: {
    id: string;
    display_name: string | null;
    email: string;
  };
}

export interface MentoringProgress {
  id: string;
  mentorship_request_id: string;
  issue: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigned_to: string | null;
  due_date: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentoringProgressWithAssignee extends MentoringProgress {
  assigned_to_user?: {
    id: string;
    display_name: string | null;
    email: string;
  };
}

export interface MentorFeedback {
  id: string;
  mentorship_request_id: string;
  from_user_id: string;
  to_user_id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
}

export interface MentorFeedbackWithUsers extends MentorFeedback {
  from_user?: {
    id: string;
    display_name: string | null;
    email: string;
  };
  to_user?: {
    id: string;
    display_name: string | null;
    email: string;
  };
}

export interface MentorCommunication {
  id: string;
  mentorship_request_id: string;
  from_user_id: string;
  message: string;
  communication_type: CommunicationType;
  created_at: string;
}

export interface MentorCommunicationWithUser extends MentorCommunication {
  from_user?: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface CreateMentorProfileInput {
  expertise: string[];
  bio?: string;
  availability?: string;
  years_experience?: number;
}

export interface UpdateMentorProfileInput extends Partial<CreateMentorProfileInput> {
  // No additional properties
}

export interface CreateMentorshipRequestInput {
  project_id: string;
  mentor_id: string;
  challenge_description: string;
  expected_outcome?: string;
}

export interface UpdateMentorshipRequestInput extends Partial<CreateMentorshipRequestInput> {
  status?: RequestStatus;
}

export interface CreateMentoringSessionInput {
  mentorship_request_id: string;
  topic: string;
  session_date: string;
  notes?: string;
  action_items?: string[];
}

export interface UpdateMentoringSessionInput extends Partial<CreateMentoringSessionInput> {
  // No additional properties
}

export interface CreateMentoringProgressInput {
  mentorship_request_id: string;
  issue: string;
  priority?: IssuePriority;
  assigned_to?: string;
  due_date?: string;
}

export interface UpdateMentoringProgressInput extends Partial<CreateMentoringProgressInput> {
  status?: IssueStatus;
  resolved_at?: string;
}

export interface CreateMentorFeedbackInput {
  mentorship_request_id: string;
  to_user_id: string;
  rating: number;
  feedback?: string;
}

export interface CreateMentorCommunicationInput {
  mentorship_request_id: string;
  message: string;
  communication_type?: CommunicationType;
}
