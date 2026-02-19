import type { LogFilterParams } from '../../api/client';

interface LogFiltersProps {
  filters: LogFilterParams;
  categories: string[];
  onChange: (filters: LogFilterParams) => void;
}

export function LogFilters({ filters, categories, onChange }: LogFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">상태</label>
        <select
          value={filters.status ?? ''}
          onChange={(e) =>
            onChange({
              ...filters,
              status: (e.target.value || undefined) as LogFilterParams['status'],
              page: 1,
            })
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">전체</option>
          <option value="success">성공</option>
          <option value="skipped">건너뜀</option>
          <option value="error">오류</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">카테고리</label>
        <select
          value={filters.category ?? ''}
          onChange={(e) =>
            onChange({ ...filters, category: e.target.value || undefined, page: 1 })
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">전체</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">시작일</label>
        <input
          type="date"
          value={filters.startDate ?? ''}
          onChange={(e) =>
            onChange({ ...filters, startDate: e.target.value || undefined, page: 1 })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">종료일</label>
        <input
          type="date"
          value={filters.endDate ?? ''}
          onChange={(e) =>
            onChange({ ...filters, endDate: e.target.value || undefined, page: 1 })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
    </div>
  );
}
