import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { Settings, ConnectionTestResult } from '../../api/client';

interface POP3FormProps {
  settings: Settings;
  onSave: (data: Partial<Settings>) => void;
  onTest: () => void;
  isSaving: boolean;
  isTesting: boolean;
  testResult?: ConnectionTestResult;
}

export function POP3Form({ settings, onSave, onTest, isSaving, isTesting, testResult }: POP3FormProps) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState(995);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [tls, setTls] = useState(true);

  useEffect(() => {
    if (settings.pop3) {
      setHost(settings.pop3.host);
      setPort(settings.pop3.port);
      setUser(settings.pop3.user);
      setPassword(settings.pop3.password);
      setTls(settings.pop3.tls);
    }
  }, [settings]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ pop3: { host, port, user, password, tls } });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">호스트</label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="pop.example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">포트</label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">사용자</label>
        <input
          type="text"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="user@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="********"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTls(!tls)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
            tls ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              tls ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-slate-700">TLS 사용</span>
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
      </div>
    </form>
  );
}
