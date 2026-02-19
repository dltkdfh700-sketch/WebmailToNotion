import { useState } from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories';
import { CategoryTable } from '../components/categories/CategoryTable';
import { CategoryForm } from '../components/categories/CategoryForm';
import type { CategoryResponse, CategoryCreateInput } from '../api/client';

export default function Categories() {
  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CategoryResponse | null>(null);

  function handleEdit(cat: CategoryResponse) {
    setEditing(cat);
    setShowForm(true);
  }

  function handleCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditing(null);
  }

  function handleSubmit(data: CategoryCreateInput) {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data },
        { onSuccess: () => handleCancel() },
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => handleCancel() });
    }
  }

  function handleDelete(id: number) {
    if (window.confirm('이 카테고리를 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          카테고리 추가
        </button>
      </div>

      {/* Form panel */}
      {showForm && (
        <div className="rounded-lg bg-white p-5 shadow-sm border border-slate-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              {editing ? '카테고리 수정' : '새 카테고리'}
            </h2>
            <button
              onClick={handleCancel}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <CategoryForm
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isPending={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg bg-white p-5 shadow-sm border border-slate-100">
        <CategoryTable
          categories={categories ?? []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletingId={deleteMutation.isPending ? (deleteMutation.variables as number) : null}
        />
      </div>
    </div>
  );
}
