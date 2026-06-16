import client from '../client';
import type { Notification, CursorPaginatedResponse } from '../../types';

interface NotificationsResponse extends CursorPaginatedResponse<Notification> {
  unread_count: number;
}

export const notificationsApi = {
  list: (cursor?: string) =>
    client.get<NotificationsResponse>('/notifications/', { params: cursor ? { cursor } : {} }),
  markRead: (id: number) => client.post(`/notifications/${id}/read/`),
  markAllRead: () => client.post('/notifications/read-all/'),
  delete: (id: number) => client.delete(`/notifications/${id}/`),
};
