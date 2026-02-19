import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useOllamaModels } from '../../hooks/useSettings';
import type { Settings, ConnectionTestResult } from '../../api/client';

interface AIProviderFormProps {
  settings: Settings;
  onSave: (data: Partial<Settings>) => void;
  onTest: () => void;
  isSaving: boolean;
  isTesting: boolean;
  testResult?: ConnectionTestResult;
}

export function AIProviderForm({ settings, onSave, onTest, isSaving, isTesting, testResult }: AIProviderFormProps) {
  const [provider, setProvider] = useState<'claude' | 'ollama'>('claude');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [claudeModel, setClaudeModel] = useState('claude-haiku-4-5-20251001');
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('');

  const { data: ollamaModels, isError: ollamaModelsError } = useOllamaModels(
    ollamaHost,
    provider === 'ollama',
  );

  useEffect(() => {
    if (settings.ai) {
      setProvider(settings.ai.provider);
      setClaudeApiKey(settings.ai.claude.apiKey);
      setClaudeModel(settings.ai.claude.model);
      setOllamaHost(settings.ai.ollama.host);
      setOllamaModel(settings.ai.ollama.model);
    }
  }, [settings]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ai: {
        provider,
        claude: { apiKey: claudeApiKey, model: claudeModel },
        ollama: { host: ollamaHost, model: ollamaModel },
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Provider selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">AI 제공자</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="provider"
              checked={provider === 'claude'}
              onChange={() => setProvider('claude')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Claude</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="provider"
              checked={provider === 'ollama'}
              onChange={() => setProvider('ollama')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Ollama</span>
          </label>
        </div>
      </div>

      {/* Claude settings */}
      {provider === 'claude' && (
        <div className="space-y-4 rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Claude 설정</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700">API Key</label>
            <input
              type="password"
              value={claudeApiKey}
              onChange={(e) => setClaudeApiKey(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="sk-ant-..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">모델</label>
            <input
              type="text"
              value={claudeModel}
              onChange={(e) => setClaudeModel(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="claude-haiku-4-5-20251001"
            />
          </div>
        </div>
      )}

      {/* Ollama settings */}
      {provider === 'ollama' && (
        <div className="space-y-4 rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Ollama 설정</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700">호스트 URL</label>
            <input
              type="text"
              value={ollamaHost}
              onChange={(e) => setOllamaHost(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="http://localhost:11434"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">모델</label>
            {ollamaModels && !ollamaModelsError ? (
              <select
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">모델 선택...</option>
                {ollamaModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="llama3.1"
              />
            )}
            {ollamaModelsError && (
              <p className="mt-1 text-xs text-amber-600">
                모델 목록을 불러올 수 없습니다. 직접 입력해주세요.
              </p>
            )}
          </div>
        </div>
      )}

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
          AI 연결 테스트
        </button>
      </div>
    </form>
  );
}
