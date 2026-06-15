import client from '../client';
import type {
  AuditLog,
  PointConfiguration,
  BadgeDefinition,
  PaginatedResponse,
  CursorPaginatedResponse,
  AdminAnalyticsKpis,
} from '../types';

interface AnalyticsByWeek {
  week: string;
  count: number;
}
interface AnalyticsBySector {
  sector: string;
  count: number;
}
interface AnalyticsByType {
  waste_type: string;
  count: number;
}
interface AnalyticsTopUser {
  id: number;
  email: string;
  full_name: string;
  points: number;
  sector: string;
  report_count: number;
}
interface HeatmapPoint {
  latitude: number;
  longitude: number;
  waste_type: string;
  status: string;
}
interface AnalyticsHeatmap {
  points: HeatmapPoint[];
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
    list: (params?: { actor?: number; action?: string }) =>
      client.get<CursorPaginatedResponse<AuditLog>>('/admin/audit-logs/', { params }),
    detail: (id: number) => client.get<AuditLog>(`/admin/audit-logs/${id}/`),
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
};

// Unused import guard — PaginatedResponse is used in audit logs list if needed elsewhere
export type { PaginatedResponse };
