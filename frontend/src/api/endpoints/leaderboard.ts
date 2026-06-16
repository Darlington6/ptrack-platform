import client from '../client';
import type { LeaderboardEntry } from '../types';

export type LeaderboardPeriod = 'week' | 'month' | 'all';

export const leaderboardApi = {
  top: (period: LeaderboardPeriod = 'all') =>
    client.get<LeaderboardEntry[]>('/leaderboard/', { params: { period } }),
};
