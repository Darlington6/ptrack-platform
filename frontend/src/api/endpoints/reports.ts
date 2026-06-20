import client from '../client';
import type { WasteReport, PaginatedResponse } from '../types';

export const reportsApi = {
  list: (params?: {
    status?: string;
    user?: string;
    north?: number;
    south?: number;
    east?: number;
    west?: number;
  }) => client.get<PaginatedResponse<WasteReport>>('/reports/', { params }),

  create: (data: FormData) =>
    client.post<WasteReport>('/reports/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  detail: (id: number) => client.get<WasteReport>(`/reports/${id}/`),

  verify: (id: number) => client.patch<WasteReport>(`/reports/${id}/verify/`),

  bulkVerify: (ids: number[]) =>
    client.post<{ verified: number }>('/admin/reports/bulk-verify/', { ids }),

  bulkReject: (ids: number[], reason?: string) =>
    client.post<{ rejected: number }>('/admin/reports/bulk-reject/', { ids, reason }),
};
