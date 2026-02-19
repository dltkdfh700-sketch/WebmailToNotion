import { useState } from 'react';
import { X, ExternalLink, RotateCw, Loader2 } from 'lucide-react';
import type { LogEntry } from '../../api/client';
import { retryLog } from '../../api/client';

interface LogDetailModalProps {
  log: LogEntry;
  onClose: () => void;
  onRetrySuccess?: () => void;
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
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2.5 border-b border-slate-100 last:border-0">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="col-span-2 text-sm text-slate-900 break-all">{children}</dd>
    </div>
  );
}

export function LogDetailModal({ log, onClose, onRetrySuccess }: LogDetailModalProps) {
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<{ success: boolean; message: string; notionPageUrl?: string } | null>(null);

  const handleRetry = async () => {
    setRetrying(true);
    setRetryResult(null);
    try {
      const result = await retryLog(log.id);
      setRetryResult(result);
      onRetrySuccess?.();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '재처리에 실패했습니다.';
      // Extract server error message if available
      const axiosErr = error as { response?: { data?: { error?: string } } };
      setRetryResult({ success: false, message: axiosErr.response?.data?.error ?? msg });
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">로그 상세</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          <dl>
            <Row label="ID">{log.id}</Row>
            <Row label="이메일 UID">{log.emailUid}</Row>
            <Row label="메시지 ID">{log.messageId}</Row>
            <Row label="보낸 사람">{log.from}</Row>
            <Row label="제목">{log.subject}</Row>
            <Row label="상태">
              <StatusBadge status={log.status} />
            </Row>
            {log.category && <Row label="카테고리">{log.category}</Row>}
            {log.priority && <Row label="우선순위">{log.priority}</Row>}
            {log.aiProvider && <Row label="AI 제공자">{log.aiProvider}</Row>}
            {log.processingTimeMs != null && (
              <Row label="처리 시간">{log.processingTimeMs}ms</Row>
            )}
            <Row label="처리 일시">
              {new Date(log.createdAt).toLocaleString('ko-KR')}
            </Row>
            {log.notionPageUrl && (
              <Row label="Notion 페이지">
                <a
                  href={log.notionPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                >
                  페이지 열기
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Row>
            )}
            {log.errorMessage && (
              <Row label="오류 메시지">
                <span className="text-red-600">{log.errorMessage}</span>
              </Row>
            )}
          </dl>

          {/* Retry result message */}
          {retryResult && (
            <div className={`mt-4 rounded-lg p-3 text-sm ${
              retryResult.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <p>{retryResult.message}</p>
              {retryResult.notionPageUrl && (
                <a
                  href={retryResult.notionPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  Notion 페이지 열기
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            닫기
          </button>

          {log.status === 'error' && !retryResult?.success && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {retrying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  재처리 중...
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4" />
                  재처리
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
