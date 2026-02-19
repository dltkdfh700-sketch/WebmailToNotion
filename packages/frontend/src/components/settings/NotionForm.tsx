import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Send } from 'lucide-react';
import type { Settings, ConnectionTestResult } from '../../api/client';

interface NotionFormProps {
  settings: Settings;
  onSave: (data: Partial<Settings>) => void;
  onTest: () => void;
  onTestWrite: () => void;
  isSaving: boolean;
  isTesting: boolean;
  isTestingWrite: boolean;
  testResult?: ConnectionTestResult;
  writeResult?: ConnectionTestResult & { url?: string };
}

export function NotionForm({ settings, onSave, onTest, onTestWrite, isSaving, isTesting, isTestingWrite, testResult, writeResult }: NotionFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');

  useEffect(() => {
    if (settings.notion) {
      setApiKey(settings.notion.apiKey);
      setDatabaseId(settings.notion.databaseId);
    }
  }, [settings]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ notion: { apiKey, databaseId } });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="secret_..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">데이터베이스 ID</label>
        <input
          type="text"
          value={databaseId}
          onChange={(e) => setDatabaseId(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
      </div>

      {/* Test result */}
      {testResult && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            testResult.ok
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {testResult.ok ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {testResult.message}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          저장
        </button>
        <button
          type="button"
          onClick={onTest}
          disabled={isTesting}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {isTesting && <Loader2 className="h-4 w-4 animate-spin" />}
          연결 테스트
        </button>
        <button
          type="button"
          onClick={onTestWrite}
          disabled={isTestingWrite}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isTestingWrite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          글 작성 테스트
        </button>
      </div>

      {/* Write test result */}
      {writeResult && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            writeResult.ok
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {writeResult.ok ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span>{writeResult.message}</span>
          {writeResult.ok && writeResult.url && (
            <a
              href={writeResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 underline font-medium hover:text-green-800"
            >
              Notion에서 확인
            </a>
          )}
        </div>
      )}
    </form>
  );
}
