import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { Settings, DashboardStats } from '../../api/client';

interface SchedulerFormProps {
  settings: Settings;
  schedulerStatus?: DashboardStats['schedulerStatus'];
  onSave: (data: Partial<Settings>) => void;
  isSaving: boolean;
}

function formatDate(iso?: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR');
}

export function SchedulerForm({ settings, schedulerStatus, onSave, isSaving }: SchedulerFormProps) {
  const [enabled, setEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(5);

  useEffect(() => {
    if (settings.scheduler) {
      setEnabled(settings.scheduler.enabled);
      setIntervalMinutes(settings.scheduler.intervalMinutes);
    }
  }, [settings]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ scheduler: { enabled, intervalMinutes } });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status display */}
      {schedulerStatus && (
        <div className="rounded-lg border border-slate-200 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">현재 상태</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-slate-500">상태:</span>
            <span className="font-medium">
              {schedulerStatus.running ? (
                <span className="text-green-600">실행 중</span>
              ) : (
                <span className="text-slate-500">중지됨</span>
              )}
            </span>
            <span className="text-slate-500">마지막 실행:</span>
            <span className="text-slate-700">{formatDate(schedulerStatus.lastRun)}</span>
            <span className="text-slate-500">다음 실행:</span>
            <span className="text-slate-700">{formatDate(schedulerStatus.nextRun)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
            enabled ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-slate-700">스케줄러 활성화</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">실행 간격 (분)</label>
        <input
          type="number"
          min={1}
          value={intervalMinutes}
          onChange={(e) => setIntervalMinutes(Number(e.target.value))}
          className="mt-1 block w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          저장
        </button>
      </div>
    </form>
  );
}
