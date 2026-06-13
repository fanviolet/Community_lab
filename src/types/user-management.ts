export type UserStatus = "active" | "suspended" | "deactivated";
export type UserRole = "guest" | "member" | "builder" | "expert" | "mentor" | "leader" | "admin";

export interface UserStatistics {
  id: string;
  user_id: string;
  problems_created: number;
  problems_solved: number;
  projects_joined: number;
  projects_led: number;
  tasks_completed: number;
  reviews_completed: number;
  comments_count: number;
  votes_cast: number;
  last_activity_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserWithStatistics {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  created_at: string;
  statistics?: {
    problems_created: number;
    projects_joined: number;
    tasks_completed: number;
    last_activity: string | null;
  };
}

export interface UserDirectoryFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  limit?: number;
  offset?: number;
}

export interface UpdateUserRoleInput {
  role: UserRole;
}

export interface UpdateUserStatusInput {
  status: UserStatus;
  reason?: string;
}

export interface UserActivityFilters {
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
}
