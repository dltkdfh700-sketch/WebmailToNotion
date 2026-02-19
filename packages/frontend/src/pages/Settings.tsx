import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSettings, useUpdateSettings, useTestPOP3, useTestNotion, useTestNotionWrite, useTestAI } from '../hooks/useSettings';
import { useDashboard } from '../hooks/useDashboard';
import { SettingsTabs } from '../components/settings/SettingsTabs';
import { POP3Form } from '../components/settings/POP3Form';
import { AIProviderForm } from '../components/settings/AIProviderForm';
import { NotionForm } from '../components/settings/NotionForm';
import { SchedulerForm } from '../components/settings/SchedulerForm';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('pop3');
  const { data: settings, isLoading } = useSettings();
  const { data: dashboard } = useDashboard();
  const updateMutation = useUpdateSettings();
  const testPOP3 = useTestPOP3();
  const testNotion = useTestNotion();
  const testNotionWrite = useTestNotionWrite();
  const testAI = useTestAI();

  if (isLoading || !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white shadow-sm border border-slate-100">
        <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />
        <div className="p-5">
          {activeTab === 'pop3' && (
            <POP3Form
              settings={settings}
              onSave={(data) => updateMutation.mutate(data)}
              onTest={() => testPOP3.mutate()}
              isSaving={updateMutation.isPending}
              isTesting={testPOP3.isPending}
              testResult={testPOP3.data}
            />
          )}
          {activeTab === 'ai' && (
            <AIProviderForm
              settings={settings}
              onSave={(data) => updateMutation.mutate(data)}
              onTest={() => testAI.mutate()}
              isSaving={updateMutation.isPending}
              isTesting={testAI.isPending}
              testResult={testAI.data}
            />
          )}
          {activeTab === 'notion' && (
            <NotionForm
              settings={settings}
              onSave={(data) => updateMutation.mutate(data)}
              onTest={() => testNotion.mutate()}
              onTestWrite={() => testNotionWrite.mutate()}
              isSaving={updateMutation.isPending}
              isTesting={testNotion.isPending}
              isTestingWrite={testNotionWrite.isPending}
              testResult={testNotion.data}
              writeResult={testNotionWrite.data}
            />
          )}
          {activeTab === 'scheduler' && (
            <SchedulerForm
              settings={settings}
              schedulerStatus={dashboard?.schedulerStatus}
              onSave={(data) => updateMutation.mutate(data)}
              isSaving={updateMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
