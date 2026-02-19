import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSettings,
  updateSettings,
  testPOP3,
  testNotion,
  testAI,
  fetchOllamaModels,
  type Settings,
} from '../api/client';
import { toast } from 'sonner';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Settings>) => updateSettings(data),
    onSuccess: () => {
      toast.success('설정이 저장되었습니다.');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => {
      toast.error('설정 저장에 실패했습니다.');
    },
  });
}

export function useTestPOP3() {
  return useMutation({
    mutationFn: testPOP3,
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(`POP3 연결 성공: ${result.message}`);
      } else {
        toast.error(`POP3 연결 실패: ${result.message}`);
      }
    },
    onError: () => {
      toast.error('POP3 연결 테스트 중 오류가 발생했습니다.');
    },
  });
}

export function useTestNotion() {
  return useMutation({
    mutationFn: testNotion,
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(`Notion 연결 성공: ${result.message}`);
      } else {
        toast.error(`Notion 연결 실패: ${result.message}`);
      }
    },
    onError: () => {
      toast.error('Notion 연결 테스트 중 오류가 발생했습니다.');
    },
  });
}

export function useTestAI() {
  return useMutation({
    mutationFn: testAI,
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(`AI 연결 성공: ${result.message}`);
      } else {
        toast.error(`AI 연결 실패: ${result.message}`);
      }
    },
    onError: () => {
      toast.error('AI 연결 테스트 중 오류가 발생했습니다.');
    },
  });
}

export function useOllamaModels(host?: string, enabled = false) {
  return useQuery({
    queryKey: ['ollama-models', host],
    queryFn: () => fetchOllamaModels(host),
    enabled,
  });
}
