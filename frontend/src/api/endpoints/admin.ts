import client from '../client';
import type {
  AuditLog,
  PointConfiguration,
  BadgeDefinition,
  CursorPaginatedResponse,
  AdminAnalyticsKpis,
  RecyclingCentre,
  Article,
  WasteReport,
  PaginatedResponse,
} from '../types';

export interface AnalyticsByWeek {
  week: string;
  count: number;
}
export interface AnalyticsBySector {
  sector: string;
  count: number;
}
export interface AnalyticsByType {
  waste_type: string;
  count: number;
}
export interface AnalyticsTopUser {
  id: number;
  email: string;
  full_name: string;
  points: number;
  sector: string;
  report_count: number;
}
export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  waste_type: string;
  status: string;
}
export interface AnalyticsHeatmap {
  points: HeatmapPoint[];
}
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  sector: string;
  role: 'citizen' | 'admin';
  points: number;
  is_active: boolean;
  email_verified?: boolean;
  current_streak?: number;
  created_at: string;
  report_count: number;
}

export const adminApi = {
  analytics: {
    reportsOverTime: (days?: number) =>
      client.get<{ weeks: AnalyticsByWeek[] }>('/admin/analytics/reports-over-time/', {
        params: { days },
      }),
    bySector: () => client.get<AnalyticsBySector[]>('/admin/analytics/by-sector/'),
    byType: () => client.get<AnalyticsByType[]>('/admin/analytics/by-type/'),
    topUsers: (limit?: number) =>
      client.get<AnalyticsTopUser[]>('/admin/analytics/top-users/', { params: { limit } }),
    heatmap: () => client.get<AnalyticsHeatmap>('/admin/analytics/heatmap/'),
    kpis: () => client.get<AdminAnalyticsKpis>('/admin/analytics/kpis/'),
  },

  auditLogs: {
    list: (params?: {
      actor?: number;
      action?: string;
      cursor?: string;
      target_type?: string;
      date_from?: string;
      date_to?: string;
    }) => client.get<CursorPaginatedResponse<AuditLog>>('/admin/audit-logs/', { params }),
    detail: (id: number) => client.get<AuditLog>(`/admin/audit-logs/${id}/`),
  },

  reports: {
    list: (params?: {
      status?: string;
      waste_type?: string;
      sector?: string;
      search?: string;
      page?: number;
      page_size?: number;
      date_from?: string;
      date_to?: string;
    }) => client.get<PaginatedResponse<WasteReport>>('/reports/', { params }),
    bulkVerify: (ids: number[]) =>
      client.post<{ verified: number }>('/admin/reports/bulk-verify/', { ids }),
    bulkReject: (ids: number[], reason?: string) =>
      client.post<{ rejected: number }>('/admin/reports/bulk-reject/', { ids, reason }),
    exportUrl: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString();
      return `/admin/reports/export.csv${qs ? '?' + qs : ''}`;
    },
  },

  users: {
    list: (params?: {
      search?: string;
      role?: string;
      sector?: string;
      verified?: string;
      has_activity?: string;
    }) => client.get<AdminUser[]>('/admin/users/', { params }),
    detail: (id: number) => client.get<AdminUser>(`/admin/users/${id}/`),
    update: (id: number, data: { role?: string; is_active?: boolean }) =>
      client.patch<AdminUser>(`/admin/users/${id}/`, data),
    suspend: (id: number) => client.delete(`/admin/users/${id}/`),
  },

  configurations: {
    points: {
      list: () => client.get<PointConfiguration[]>('/admin/configurations/points/'),
      create: (data: Omit<PointConfiguration, 'id' | 'updated_at'>) =>
        client.post<PointConfiguration>('/admin/configurations/points/', data),
      update: (id: number, data: Partial<PointConfiguration>) =>
        client.patch<PointConfiguration>(`/admin/configurations/points/${id}/`, data),
      delete: (id: number) => client.delete(`/admin/configurations/points/${id}/`),
    },
    badges: {
      list: () => client.get<BadgeDefinition[]>('/admin/configurations/badges/'),
      create: (data: Omit<BadgeDefinition, 'id' | 'created_at'>) =>
        client.post<BadgeDefinition>('/admin/configurations/badges/', data),
      update: (id: number, data: Partial<BadgeDefinition>) =>
        client.patch<BadgeDefinition>(`/admin/configurations/badges/${id}/`, data),
      delete: (id: number) => client.delete(`/admin/configurations/badges/${id}/`),
    },
  },

  education: {
    list: () => client.get('/admin/education/articles/'),
    create: (data: FormData) =>
      client.post<Article>('/admin/education/articles/create/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    update: (slug: string, data: FormData | Partial<Article>) =>
      client.patch<Article>(`/admin/education/articles/${slug}/`, data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
      }),
    delete: (slug: string) => client.delete(`/admin/education/articles/${slug}/delete/`),
  },

  centres: {
    list: () => client.get<RecyclingCentre[]>('/admin/recycling-centres/all/'),
    create: (data: Partial<RecyclingCentre>) =>
      client.post<RecyclingCentre>('/admin/recycling-centres/', data),
    update: (id: number, data: Partial<RecyclingCentre>) =>
      client.patch<RecyclingCentre>(`/admin/recycling-centres/${id}/`, data),
    delete: (id: number) => client.delete(`/admin/recycling-centres/${id}/delete/`),
  },
};

export type { PaginatedResponse };
