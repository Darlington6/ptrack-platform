import client from '../client';
import type { CommunityStats, CommunityTrends } from '../types';

export const communityApi = {
  stats: () => client.get<CommunityStats>('/community/stats/'),
  trends: () => client.get<CommunityTrends>('/community/trends/'),
};
