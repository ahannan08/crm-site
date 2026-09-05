export type VisaType = "visit" | "student" | "business";

export type LeadSource =
  | "justdial"
  | "facebook"
  | "instagram"
  | "google_ads"
  | "website"
  | "walk_in"
  | "referral"
  | "phone_call"
  | "other";

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "documents_pending"
  | "applied"
  | "won"
  | "lost";

export type UserRole = "admin" | "agent";

export type ActivityType = "call" | "note" | "status_change";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  visa_type: VisaType;
  source: LeadSource;
  status: LeadStatus;
  assigned_to: string | null;
  next_follow_up_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  user_id: string;
  type: ActivityType;
  description: string;
  created_at: string;
}

export interface Database {
  users: User[];
  leads: Lead[];
  activities: Activity[];
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface DashboardStats {
  totalLeads: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
  followUpsDueToday: number;
  followUpsOverdue: number;
  wonCount: number;
  lostCount: number;
  bySource: Record<string, number>;
  byVisaType: Record<string, number>;
  byStatus: Record<string, number>;
  recentLeads: Lead[];
  dueFollowUps: Lead[];
}
