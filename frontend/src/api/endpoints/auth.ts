import client from '../client';
import type { User, AuthTokens, RegisterRequest } from '../../types';

export const authApi = {
  login: (email: string, password: string) =>
    client.post<AuthTokens>('/auth/login/', { email, password }),

  register: (payload: RegisterRequest) => client.post<AuthTokens>('/auth/register/', payload),

  me: () => client.get<User>('/auth/me/'),

  updateMe: (data: Partial<User>) => client.patch<User>('/auth/me/', data),

  changePassword: (current_password: string, new_password: string) =>
    client.post('/auth/me/password/', { current_password, new_password }),

  sendVerification: (channel: 'email' | 'phone', purpose?: string) =>
    client.post('/auth/verify/send/', { channel, purpose: purpose ?? 'register_verify' }),

  confirmVerification: (channel: 'email' | 'phone', code: string, purpose?: string) =>
    client.post('/auth/verify/confirm/', { channel, code, purpose: purpose ?? 'register_verify' }),

  uploadAvatar: (formData: FormData) =>
    client.post<{ profile_picture: string }>('/auth/me/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteAvatar: () => client.delete<User>('/auth/me/avatar/'),

  impact: () => client.get('/auth/me/impact/'),

  deleteAccount: (password: string) =>
    client.post('/auth/me/delete/', { password, confirmation: 'DELETE MY ACCOUNT' }),

  resetPasswordRequest: (identifier: string) =>
    client.post('/auth/password/reset/request/', { identifier }),

  resetPasswordConfirm: (identifier: string, code: string, new_password: string) =>
    client.post('/auth/password/reset/confirm/', { identifier, code, new_password }),
};
