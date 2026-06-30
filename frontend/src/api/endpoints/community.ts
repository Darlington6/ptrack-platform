import client from '../client';
import type { CommunityStats, CommunityTrends } from '../types';

export const communityApi = {
  stats: () => client.get<CommunityStats>('/community/stats/'),
  statsPublic: () => client.get<CommunityStats>('/community/stats/public/'),
  trends: () => client.get<CommunityTrends>('/community/trends/'),
};
