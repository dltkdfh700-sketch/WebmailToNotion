import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryCreateInput,
  type CategoryUpdateInput,
} from '../api/client';
import { toast } from 'sonner';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryCreateInput) => createCategory(input),
    onSuccess: () => {
      toast.success('카테고리가 생성되었습니다.');
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => {
      toast.error('카테고리 생성에 실패했습니다.');
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryUpdateInput }) =>
      updateCategory(id, data),
    onSuccess: () => {
      toast.success('카테고리가 수정되었습니다.');
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => {
      toast.error('카테고리 수정에 실패했습니다.');
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      toast.success('카테고리가 삭제되었습니다.');
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => {
      toast.error('카테고리 삭제에 실패했습니다.');
    },
  });
}
