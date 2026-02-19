interface SettingsTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

const tabs = [
  { id: 'pop3', label: 'POP3' },
  { id: 'ai', label: 'AI 제공자' },
  { id: 'notion', label: 'Notion' },
  { id: 'scheduler', label: '스케줄러' },
];

export function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  return (
    <div className="border-b border-slate-200">
      <nav className="flex gap-0 -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
