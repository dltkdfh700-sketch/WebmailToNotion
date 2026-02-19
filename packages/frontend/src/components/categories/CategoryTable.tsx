import { Pencil, Trash2 } from 'lucide-react';
import type { CategoryResponse } from '../../api/client';

interface CategoryTableProps {
  categories: CategoryResponse[];
  onEdit: (category: CategoryResponse) => void;
  onDelete: (id: number) => void;
  deletingId?: number | null;
}

export function CategoryTable({ categories, onEdit, onDelete, deletingId }: CategoryTableProps) {
  if (!categories.length) {
    return (
      <div className="flex h-32 items-center justify-center text-slate-400">
        등록된 카테고리가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="pb-3 pr-4 font-medium">색상</th>
            <th className="pb-3 pr-4 font-medium">이름</th>
            <th className="pb-3 pr-4 font-medium">설명</th>
            <th className="pb-3 pr-4 font-medium">정렬</th>
            <th className="pb-3 pr-4 font-medium">기본</th>
            <th className="pb-3 font-medium">작업</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.map((cat) => (
            <tr key={cat.id} className="hover:bg-slate-50">
              <td className="py-3 pr-4">
                <div
                  className="h-6 w-6 rounded-full border border-slate-200"
                  style={{ backgroundColor: cat.color || '#94a3b8' }}
                />
              </td>
              <td className="py-3 pr-4 font-medium text-slate-900">{cat.name}</td>
              <td className="py-3 pr-4 text-slate-600 max-w-xs truncate">
                {cat.description || '-'}
              </td>
              <td className="py-3 pr-4 text-slate-500">{cat.sortOrder}</td>
              <td className="py-3 pr-4">
                {cat.isDefault && (
                  <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    기본
                  </span>
                )}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(cat)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    title="수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(cat.id)}
                    disabled={cat.isDefault || deletingId === cat.id}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={cat.isDefault ? '기본 카테고리는 삭제할 수 없습니다' : '삭제'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
