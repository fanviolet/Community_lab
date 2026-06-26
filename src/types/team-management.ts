export type InvitationStatus = "pending" | "accepted" | "rejected" | "expired";
export type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type ContributionType = "task" | "comment" | "pitch" | "analysis" | "mentorship" | "code_review";
export type ActivityType = "login" | "task_completed" | "pitch_submitted" | "review_completed" | "mentorship_session" | "comment_posted" | "analysis_created";

export interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  invited_by: string;
  status: InvitationStatus;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface TeamInvitationWithInviter extends TeamInvitation {
  inviter?: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface MemberSkill {
  id: string;
  profile_id: string;
  skill_name: string;
  proficiency_level: ProficiencyLevel;
  years_experience: number | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberAvailability {
  id: string;
  profile_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberContribution {
  id: string;
  profile_id: string;
  contribution_type: ContributionType;
  contribution_id: string;
  contribution_title: string | null;
  contribution_date: string;
  impact_score: number | null;
  created_at: string;
}

export interface TeamActivityLog {
  id: string;
  profile_id: string;
  activity_type: ActivityType;
  activity_description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TeamActivityLogWithProfile extends TeamActivityLog {
  profile?: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface TeamMember {
  id: string;
  display_name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  skills?: MemberSkill[];
  availability?: MemberAvailability[];
  total_contributions?: number;
  recent_activity?: TeamActivityLog[];
}

export interface CreateInvitationInput {
  email: string;
  role: string;
}

export interface CreateSkillInput {
  profile_id: string;
  skill_name: string;
  proficiency_level: ProficiencyLevel;
  years_experience?: number;
}

export interface UpdateSkillInput extends Partial<CreateSkillInput> {
  verified?: boolean;
}

export interface CreateAvailabilityInput {
  profile_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone?: string;
  is_available?: boolean;
}

export interface TeamAnalytics {
  total_members: number;
  active_members: number;
  pending_invitations: number;
  total_skills: number;
  total_contributions: number;
  average_impact_score: number;
  participation_rate: number;
  role_distribution: {
    admin: number;
    leader: number;
    builder: number;
    expert: number;
    mentor: number;
    member: number;
  };
}
