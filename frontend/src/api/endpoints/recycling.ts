import client from '../client';
import type { RecyclingActivity, CursorPaginatedResponse } from '../types';

export const recyclingApi = {
  list: () => client.get<CursorPaginatedResponse<RecyclingActivity>>('/recycling/'),
  create: (activity_type: string) => client.post<RecyclingActivity>('/recycling/', { activity_type }),
};