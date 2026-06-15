import client from '../client';
import type { LeaderboardEntry } from '../types';

export const leaderboardApi = {
  top: () => client.get<LeaderboardEntry[]>('/leaderboard/'),
};
