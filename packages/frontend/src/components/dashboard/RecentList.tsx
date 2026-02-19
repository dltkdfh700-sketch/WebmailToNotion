import type { LogEntry } from '../../api/client';

interface RecentListProps {
  logs: LogEntry[];
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
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RecentList({ logs }: RecentListProps) {
  if (!logs.length) {
    return (
      <div className="flex h-32 items-center justify-center text-slate-400">
        최근 처리 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="pb-2 pr-4 font-medium">시간</th>
            <th className="pb-2 pr-4 font-medium">제목</th>
            <th className="pb-2 pr-4 font-medium">카테고리</th>
            <th className="pb-2 pr-4 font-medium">상태</th>
            <th className="pb-2 font-medium">AI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50">
              <td className="py-2.5 pr-4 whitespace-nowrap text-slate-500">
                {formatTime(log.createdAt)}
              </td>
              <td className="py-2.5 pr-4 max-w-xs truncate text-slate-900">
                {log.subject}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap text-slate-600">
                {log.category ?? '-'}
              </td>
              <td className="py-2.5 pr-4">
                <StatusBadge status={log.status} />
              </td>
              <td className="py-2.5 whitespace-nowrap text-slate-500">
                {log.aiProvider ?? '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
