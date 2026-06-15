import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/endpoints/notifications';

export function useNotifications() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return { query, markRead, markAllRead, remove };
}