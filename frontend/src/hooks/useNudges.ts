import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nudgesApi } from '../api/endpoints/nudges';

export function useNudges() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['nudges', 'active'],
    queryFn: () => nudgesApi.active(),
    staleTime: 60_000,
  });

  const dismiss = useMutation({
    mutationFn: (id: number) => nudgesApi.dismiss(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nudges'] }),
  });

  return { query, dismiss };
}