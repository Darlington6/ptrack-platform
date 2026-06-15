export type UserRole = 'citizen' | 'admin';
export type WasteType = 'bottles' | 'bags' | 'mixed' | 'other';
export type ReportStatus = 'pending' | 'verified' | 'resolved';
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
  role: 'citizen' | 'admin';
  created_at: string;
  updated_at: string;
  // Profile
  profile_picture?: string | null;
  bio?: string;
  preferred_language: Language;
  theme_preference: ThemePreference;
  // Engagement
  has_completed_onboarding: boolean;
  weekly_goal: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string | null;
  // Verification
  email_verified: boolean;
  phone_verified: boolean;
  // Privacy
  show_on_leaderboard: boolean;
  allow_public_reports: boolean;
  // Preferences
  notification_preferences: {
    streak_reminders: boolean;
    weekly_digest: boolean;
    community_updates: boolean;
    badge_earned: boolean;
  };
}

export interface WasteReport {
  id: number;
  user: number | User;
  user_detail?: Pick<User, 'id' | 'username' | 'email' | 'full_name'>;
  latitude: number;
  longitude: number;
  image?: string | null;
  description?: string;
  waste_type: WasteType;
  status: ReportStatus;
  created_at: string;
}

// Alias kept for backwards compat with existing admin pages
export type WasteReportDetail = WasteReport;

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

export interface Notification {
  id: number;
  category: 'system' | 'badge_earned' | 'streak_warning' | 'weekly_digest' | 'community' | 'admin';
  title: string;
  body: string;
  action_url: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ImpactSummary {
  plastic_kg: number;
  bottles_equivalent: number;
  co2_kg: number;
}

export interface CommunityStats {
  total_reports: number;
  verified_reports: number;
  total_recycling_activities: number;
  total_points_awarded: number;
  active_citizens: number;
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

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User>;
  setUser: (user: User | null) => void;
}
