import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../stores/authStore';
import type { User } from '../../api/types';

const mockUser: User = {
  id: 42,
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  sector: 'Kimironko',
  points: 100,
  role: 'citizen',
  created_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isLoading: false });
});

describe('authStore', () => {
  it('starts with null user and tokens', () => {
    const { user, accessToken, refreshToken } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });

  it('setUser stores user data', () => {
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('setTokens stores access and refresh tokens', () => {
    useAuthStore.getState().setTokens('acc-123', 'ref-456');
    const { accessToken, refreshToken } = useAuthStore.getState();
    expect(accessToken).toBe('acc-123');
    expect(refreshToken).toBe('ref-456');
  });

  it('clearAuth removes user and tokens', () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setTokens('acc-123', 'ref-456');
    useAuthStore.getState().clearAuth();
    const { user, accessToken, refreshToken } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });

  it('setLoading updates isLoading', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});