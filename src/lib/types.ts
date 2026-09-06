export type VisaType = "visit" | "student" | "business";

export type LeadSource =
  | "meta"
  | "justdial"
  | "walk_in"
  | "google_ads"
  | "website"
  | "referral"
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

export type MaritalStatus = "single" | "married" | "divorced" | "widowed" | "other";

export type ActivityType = "call" | "note" | "status_change";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  joined_at: string;
}

export interface Lead {
  id: string;
  enquiry_date: string;
  name: string;
  phone: string;
  email: string;
  age: number | null;
  city: string;
  visa_type: VisaType;
  source: LeadSource;
  marital_status: MaritalStatus | "";
  kids: number | null;
  highest_qualification: string;
  year_finished: string;
  passport_expiry: string;
  travel_history: string;
  refusals: string;
  country_of_choice: string;
  occupation: string;
  monthly_income: string;
  savings: string;
  itr: string;
  property_details: string;
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
  newEnquiries: number;
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
