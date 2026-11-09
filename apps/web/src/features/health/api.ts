import type { HealthResponse } from '@twitter-clone/shared';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api<HealthResponse>('/health'),
  });
}
