import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDashboardStats, triggerProcessing, fetchTodayEmails } from '../api/client';
import { toast } from 'sonner';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30_000,
  });
}

export function useTriggerProcessing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: triggerProcessing,
    onSuccess: (result) => {
      toast.success(`처리 완료: ${result.processed}건 처리, ${result.errors}건 오류`);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['logs'] });
    },
    onError: () => {
      toast.error('메일 처리 중 오류가 발생했습니다.');
    },
  });
}

export function useFetchTodayEmails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fetchTodayEmails,
    onSuccess: (result) => {
      toast.success(result.message);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['logs'] });
    },
    onError: () => {
      toast.error('오늘 메일 가져오기 중 오류가 발생했습니다.');
    },
  });
}
