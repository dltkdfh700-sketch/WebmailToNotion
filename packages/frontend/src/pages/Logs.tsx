import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLogs } from '../hooks/useLogs';
import { useCategories } from '../hooks/useCategories';
import { LogFilters } from '../components/logs/LogFilters';
import { LogTable } from '../components/logs/LogTable';
import { LogDetailModal } from '../components/logs/LogDetailModal';
import type { LogEntry, LogFilterParams } from '../api/client';

export default function Logs() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LogFilterParams>({
    page: 1,
    limit: 20,
  });
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const { data: logsData, isLoading } = useLogs(filters);
  const { data: categories } = useCategories();

  const categoryNames = (categories ?? []).map((c) => c.name);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-100">
        <LogFilters
          filters={filters}
          categories={categoryNames}
          onChange={setFilters}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white p-5 shadow-sm border border-slate-100">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <LogTable
            logs={logsData?.data ?? []}
            total={logsData?.total ?? 0}
            page={logsData?.page ?? 1}
            limit={logsData?.limit ?? 20}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
            onRowClick={setSelectedLog}
          />
        )}
      </div>

      {/* Detail modal */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onRetrySuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['logs'] });
          }}
        />
      )}
    </div>
  );
}
