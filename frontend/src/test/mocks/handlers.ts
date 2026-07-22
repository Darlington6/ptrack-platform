import { http, HttpResponse } from 'msw';
import type {
  User,
  AuthTokens,
  CommunityStats,
  Notification,
  LeaderboardEntry,
  WasteReport,
  PaginatedResponse,
  CursorPaginatedResponse,
} from '../../api/types';

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  sector: 'Kimironko',
  points: 120,
  role: 'citizen',
  created_at: '2024-01-01T00:00:00Z',
  preferred_language: 'en',
  theme_preference: 'system',
  weekly_goal: 5,
  show_on_leaderboard: true,
  allow_public_reports: true,
  is_active: true,
  email_verified: true,
  phone_verified: false,
  current_streak: 3,
  longest_streak: 7,
  notification_preferences: {
    streak_reminders: true,
    weekly_digest: true,
    community_updates: true,
    badge_earned: true,
  },
};

const mockAuthTokens: AuthTokens = {
  access: 'mock-access-token',
  refresh: 'mock-refresh-token',
  user: mockUser,
};

const mockCommunityStats: CommunityStats = {
  total_reports: 512,
  verified_reports: 438,
  total_recycling_activities: 290,
  total_points_awarded: 18450,
  active_citizens: 74,
  estimated_plastic_kg: 1240.5,
};

const mockNotifications: CursorPaginatedResponse<Notification> & { unread_count: number } = {
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      category: 'system',
      title: 'Welcome to pTrack',
      body: 'Thanks for joining!',
      title_rw: 'Murakaza neza kuri pTrack',
      body_rw: 'Murakoze kwiyandikisha!',
      action_url: '',
      is_read: false,
      read_at: null,
      created_at: '2024-06-01T10:00:00Z',
    },
  ],
  unread_count: 1,
};

const mockLeaderboard: LeaderboardEntry[] = [
  { id: 1, username: 'top_user', full_name: 'Top User', points: 500, rank: 1, sector: 'Kacyiru' },
  {
    id: 2,
    username: 'testuser',
    full_name: 'Test User',
    points: 120,
    rank: 2,
    sector: 'Kimironko',
  },
];

const mockReports: PaginatedResponse<WasteReport> = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      user: 1,
      latitude: -1.9441,
      longitude: 30.0619,
      description: 'Plastic bottles near the market',
      waste_type: 'bottles',
      status: 'pending',
      created_at: '2024-06-01T08:00:00Z',
    },
  ],
};

const BASE = '/api/v1';

export const handlers = [
  http.get(`${BASE}/auth/me/`, () => HttpResponse.json(mockUser)),

  http.post(`${BASE}/auth/login/`, () => HttpResponse.json(mockAuthTokens)),

  http.get(`${BASE}/notifications/`, () => HttpResponse.json(mockNotifications)),

  http.get(`${BASE}/leaderboard/`, () => HttpResponse.json(mockLeaderboard)),

  http.get(`${BASE}/community/stats/`, () => HttpResponse.json(mockCommunityStats)),

  http.get(`${BASE}/reports/`, () => HttpResponse.json(mockReports)),

  http.get(`${BASE}/rewards/me/`, () =>
    HttpResponse.json({
      next: null,
      previous: null,
      results: { total_points: 120, rewards: [] },
    })
  ),

  http.get(`${BASE}/health/`, () => HttpResponse.json({ status: 'ok' })),
];
