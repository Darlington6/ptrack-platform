export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  sector: string;
  points: number;
  role: "citizen" | "admin";
  created_at: string;
}

export interface WasteReport {
  id: number;
  user: number | User;
  latitude: number;
  longitude: number;
  image?: string | null;
  description?: string;
  waste_type: "bottles" | "bags" | "mixed" | "other";
  status: "pending" | "verified" | "resolved";
  created_at: string;
}

export interface WasteReportDetail extends WasteReport {
  user_detail?: Pick<User, "id" | "username" | "email" | "full_name">;
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
  activity_type: "drop_off" | "pickup" | "exchange" | "other";
  points_awarded: number;
  date: string;
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

export interface LeaderboardEntry {
  id: number;
  username: string;
  full_name: string;
  points: number;
  rank: number;
  sector: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User>;
}