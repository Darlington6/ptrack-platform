import client from '../client';
import type { User, AuthTokens, RegisterRequest } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    client.post<AuthTokens>('/auth/login/', { email, password }),

  register: (payload: RegisterRequest) => client.post<AuthTokens>('/auth/register/', payload),

  me: () => client.get<User>('/auth/me/'),

  updateMe: (
    data: Partial<
      Pick<
        User,
        | 'bio'
        | 'preferred_language'
        | 'theme_preference'
        | 'weekly_goal'
        | 'show_on_leaderboard'
        | 'allow_public_reports'
        | 'notification_preferences'
      >
    >
  ) => client.patch<User>('/auth/me/', data),

  changePassword: (current_password: string, new_password: string) =>
    client.post('/auth/me/password/', { current_password, new_password }),

  sendVerification: (channel: 'email' | 'phone', purpose?: string) =>
    client.post('/auth/verify/send/', { channel, purpose: purpose ?? 'register_verify' }),

  confirmVerification: (channel: 'email' | 'phone', code: string, purpose?: string) =>
    client.post('/auth/verify/confirm/', { channel, code, purpose: purpose ?? 'register_verify' }),

  exportData: () => client.get('/auth/me/export/'),

  deleteAccount: (password: string) =>
    client.post('/auth/me/delete/', { password, confirmation: 'DELETE MY ACCOUNT' }),

  impact: () => client.get('/auth/me/impact/'),
};
