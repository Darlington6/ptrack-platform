import client from '../client';
import type { Reward, CursorPaginatedResponse } from '../types';

interface RewardsResponse {
  total_points: number;
  rewards: Reward[];
}

export const rewardsApi = {
  mine: () => client.get<CursorPaginatedResponse<RewardsResponse>>('/rewards/me/'),
};
