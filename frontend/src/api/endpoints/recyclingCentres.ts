import client from '../client';
import type { RecyclingCentre } from '../types';

export const recyclingCentresApi = {
  list: (params?: {
    material?: string;
    sector?: string;
    lat?: number;
    lon?: number;
    radius_km?: number;
  }) => client.get<RecyclingCentre[]>('/recycling-centres/', { params }),

  detail: (id: number) => client.get<RecyclingCentre>(`/recycling-centres/${id}/`),
};
