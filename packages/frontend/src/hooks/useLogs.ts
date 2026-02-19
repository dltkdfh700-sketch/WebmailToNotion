import { useQuery } from '@tanstack/react-query';
import { fetchLogs, type LogFilterParams } from '../api/client';

export function useLogs(filters: LogFilterParams) {
  return useQuery({
    queryKey: ['logs', filters],
    queryFn: () => fetchLogs(filters),
    placeholderData: (prev) => prev,
  });
}
