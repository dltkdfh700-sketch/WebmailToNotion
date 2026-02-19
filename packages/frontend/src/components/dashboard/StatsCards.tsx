import { Mail, CalendarDays, CheckCircle, Clock } from 'lucide-react';
import type { DashboardStats } from '../../api/client';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: '전체 처리',
      value: stats.totalProcessed.toLocaleString(),
      icon: Mail,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: '오늘 처리',
      value: stats.todayProcessed.toLocaleString(),
      icon: CalendarDays,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: '성공률',
      value: `${stats.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-violet-600 bg-violet-50',
    },
    {
      label: '스케줄러',
      value: stats.schedulerStatus.enabled
        ? stats.schedulerStatus.running
          ? '실행 중'
          : '대기 중'
        : '비활성',
      icon: Clock,
      color: stats.schedulerStatus.enabled
        ? 'text-amber-600 bg-amber-50'
        : 'text-slate-500 bg-slate-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg bg-white p-5 shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
            <div className={`rounded-lg p-3 ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
