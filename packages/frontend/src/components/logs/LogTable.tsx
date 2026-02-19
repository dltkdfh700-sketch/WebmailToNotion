import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LogEntry } from '../../api/client';

interface LogTableProps {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onRowClick: (log: LogEntry) => void;
}

function StatusBadge({ status }: { status: LogEntry['status'] }) {
  const styles = {
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    skipped: 'bg-slate-100 text-slate-600',
  };
  const labels = {
    success: '성공',
    error: '오류',
    skipped: '건너뜀',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LogTable({ logs, total, page, limit, onPageChange, onRowClick }: LogTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (!logs.length) {
    return (
      <div className="flex h-32 items-center justify-center text-slate-400">
        처리 로그가 없습니다.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-3 pr-4 font-medium">시간</th>
              <th className="pb-3 pr-4 font-medium">보낸 사람</th>
              <th className="pb-3 pr-4 font-medium">제목</th>
              <th className="pb-3 pr-4 font-medium">상태</th>
              <th className="pb-3 pr-4 font-medium">카테고리</th>
              <th className="pb-3 pr-4 font-medium">AI</th>
              <th className="pb-3 font-medium">처리 시간</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => onRowClick(log)}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 pr-4 whitespace-nowrap text-slate-500">
                  {formatTime(log.createdAt)}
                </td>
                <td className="py-3 pr-4 max-w-[150px] truncate text-slate-600">
                  {log.from}
                </td>
                <td className="py-3 pr-4 max-w-xs truncate text-slate-900">
                  {log.subject}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={log.status} />
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-slate-600">
                  {log.category ?? '-'}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-slate-500">
                  {log.aiProvider ?? '-'}
                </td>
                <td className="py-3 whitespace-nowrap text-slate-500">
                  {log.processingTimeMs != null ? `${log.processingTimeMs}ms` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-500">
          총 {total.toLocaleString()}건 중 {((page - 1) * limit) + 1}-{Math.min(page * limit, total)}건
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 text-sm text-slate-700">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
