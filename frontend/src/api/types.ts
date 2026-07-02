export type UserRole = 'citizen' | 'admin';
export type WasteType = 'bottles' | 'bags' | 'mixed' | 'other';
export type ReportStatus = 'pending' | 'verified' | 'resolved' | 'rejected';
export type ActivityType = 'drop_off' | 'pickup' | 'exchange' | 'other';
export type ThemePreference = 'light' | 'dark' | 'system';
export type Language = 'en' | 'rw';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CursorPaginatedResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  sector: string;
  points: number;
  role: UserRole;
  profile_picture?: string | null;
  bio?: string;
  preferred_language?: Language;
  theme_preference?: ThemePreference;
  weekly_goal?: number;
  show_on_leaderboard?: boolean;
  allow_public_reports?: boolean;
  notification_preferences?: Record<string, boolean>;
  is_active?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  current_streak?: number;
  longest_streak?: number;
  last_activity_date?: string | null;
  created_at: string;
}

export interface WasteReport {
  id: number;
  user: number | User;
  user_detail?: Pick<User, 'id' | 'username' | 'email' | 'full_name'>;
  latitude: number;
  longitude: number;
  image?: string | null;
  thumbnail?: string | null;
  description?: string;
  waste_type: WasteType;
  status: ReportStatus;
  created_at: string;
}

export interface Reward {
  id: number;
  user: number;
  points_earned: number;
  reward_type: string;
  date_earned: string;
}

export interface RecyclingActivity {
  id: number;
  user: number;
  activity_type: ActivityType;
  points_awarded: number;
  date: string;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  full_name: string;
  points: number;
  rank: number;
  sector: string;
}

export interface RecyclingCentre {
  id: number;
  name: string;
  address: string;
  sector: string;
  district: string;
  latitude: number;
  longitude: number;
  accepted_materials: string[];
  operating_hours: Record<string, string>;
  contact_phone?: string;
  contact_email?: string;
  open_time?: string | null;
  close_time?: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: number;
  slug: string;
  title_en: string;
  title_rw: string;
  body_en?: string;
  body_rw?: string;
  cover_image?: string | null;
  category: string;
  reading_time_minutes: number;
  is_published?: boolean;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: number;
  category:
    | 'system'
    | 'badge_earned'
    | 'streak_warning'
    | 'weekly_digest'
    | 'community'
    | 'admin'
    | 'verification'
    | 'rejection';
  title: string;
  body: string;
  action_url: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NudgeRule {
  id: number;
  code: string;
  title_en: string;
  title_rw: string;
  body_en: string;
  body_rw: string;
  category: string;
  priority: number;
  is_active: boolean;
}

export interface AuditLog {
  id: number;
  actor: number | null;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: number | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string;
  created_at: string;
}

export interface PointConfiguration {
  id: number;
  event: string;
  points: number;
  description: string;
  updated_at: string;
}

export interface BadgeDefinition {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  required_points: number;
  badge_type: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone_number?: string;
  password: string;
  sector: string;
}

export interface RegisterRequest extends RegisterPayload {
  username: string;
  confirm_password: string;
}

export interface CommunityStats {
  total_reports: number;
  verified_reports: number;
  total_recycling_activities: number;
  total_points_awarded: number;
  active_citizens: number;
  estimated_plastic_kg: number;
}

export interface WeekTrend {
  week: string;
  reports: number;
  recycling: number;
  points: number;
}

export interface CommunityTrends {
  weeks: WeekTrend[];
}

export interface ImpactSummary {
  plastic_kg: number;
  bottles_equivalent: number;
  co2_kg: number;
}

export interface AdminAnalyticsKpis {
  total_reports: number;
  pending_reports: number;
  verified_reports: number;
  reports_this_week: number;
  reports_this_month: number;
  reports_last_90d: number;
  total_citizens: number;
  active_citizens_30d: number;
  total_points_awarded: number;
}
