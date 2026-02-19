import { Play, Loader2, Mail } from 'lucide-react';
import { useDashboard, useTriggerProcessing, useFetchTodayEmails } from '../hooks/useDashboard';
import { StatsCards } from '../components/dashboard/StatsCards';
import { CategoryChart } from '../components/dashboard/CategoryChart';
import { RecentList } from '../components/dashboard/RecentList';

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useDashboard();
  const trigger = useTriggerProcessing();
  const fetchToday = useFetchTodayEmails();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-500">
        <p>대시보드 데이터를 불러올 수 없습니다.</p>
        <p className="mt-1 text-sm">백엔드 서버가 실행 중인지 확인하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => fetchToday.mutate()}
          disabled={fetchToday.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {fetchToday.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          오늘 메일 전부 가져오기
        </button>
        <button
          onClick={() => trigger.mutate()}
          disabled={trigger.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {trigger.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          수동 처리 실행
        </button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Charts and recent */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm border border-slate-100">
          <h2 className="mb-4 text-base font-semibold text-slate-900">카테고리 분포</h2>
          <CategoryChart data={stats.categoryDistribution} />
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm border border-slate-100">
          <h2 className="mb-4 text-base font-semibold text-slate-900">최근 처리 내역</h2>
          <RecentList logs={stats.recentLogs} />
        </div>
      </div>
    </div>
  );
}
