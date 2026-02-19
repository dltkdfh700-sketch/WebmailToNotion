import { useState, useEffect } from 'react';
import type { CategoryResponse, CategoryCreateInput } from '../../api/client';

interface CategoryFormProps {
  initial?: CategoryResponse | null;
  onSubmit: (data: CategoryCreateInput) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function CategoryForm({ initial, onSubmit, onCancel, isPending }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setDescription(initial.description);
      setColor(initial.color || '#3b82f6');
      setSortOrder(initial.sortOrder);
    } else {
      setName('');
      setDescription('');
      setColor('#3b82f6');
      setSortOrder(0);
    }
  }, [initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ name, description, color, sortOrder });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="카테고리 이름"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">설명</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="카테고리 설명"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700">색상</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-slate-300"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="#3b82f6"
            />
          </div>
        </div>
        <div className="w-28">
          <label className="block text-sm font-medium text-slate-700">정렬 순서</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {initial ? '수정' : '생성'}
        </button>
      </div>
    </form>
  );
}
