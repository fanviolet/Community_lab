export type GroupMembershipState = "member" | "pending" | "visitor";

export interface GroupSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  member_count?: number;
}

export interface GroupMembership {
  group_id: string;
  user_id: string;
  role: "member" | "leader";
  created_at: string;
}

export interface GroupJoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}
