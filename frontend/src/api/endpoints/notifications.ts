import client from '../client';
import type { Notification, CursorPaginatedResponse } from '../types';

interface NotificationsResponse extends CursorPaginatedResponse<Notification> {
  unread_count: number;
}

export const notificationsApi = {
  list: () => client.get<NotificationsResponse>('/notifications/'),
  markRead: (id: number) => client.post(`/notifications/${id}/read/`),
  markAllRead: () => client.post('/notifications/read-all/'),
  delete: (id: number) => client.delete(`/notifications/${id}/`),
};
