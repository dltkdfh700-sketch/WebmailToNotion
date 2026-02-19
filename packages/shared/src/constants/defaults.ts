export const DEFAULT_CATEGORIES = [
  { name: 'Feature Request', description: 'New feature request', color: '#3B82F6', sortOrder: 1 },
  { name: 'Bug Report', description: 'Bug and error report', color: '#EF4444', sortOrder: 2 },
  { name: 'Improvement', description: 'Improvement on existing features', color: '#F59E0B', sortOrder: 3 },
  { name: 'Inquiry', description: 'General inquiry and questions', color: '#10B981', sortOrder: 4 },
  { name: 'Other', description: 'Uncategorized items', color: '#6B7280', sortOrder: 5 },
];

// Notion select color mapping (Notion API uses specific color names)
export const CATEGORY_NOTION_COLORS: Record<string, string> = {
  'Feature Request': 'blue',
  'Bug Report': 'red',
  'Improvement': 'yellow',
  'Inquiry': 'green',
  'Other': 'gray',
};

export const DEFAULT_SETTINGS = {
  pop3: {
    host: '',
    port: 995,
    user: '',
    password: '',
    tls: true,
  },
  ai: {
    provider: 'claude' as const,
    claude: {
      apiKey: '',
      model: 'claude-haiku-4-5-20251001',
    },
    ollama: {
      host: 'http://localhost:11434',
      model: 'gemma3:12b',
    },
  },
  notion: {
    apiKey: '',
    databaseId: '',
  },
  scheduler: {
    enabled: false,
    intervalMinutes: 5,
  },
};

export const NOTION_STATUSES = ['신규', '검토중', '승인', '진행중', '완료', '보류'] as const;
export const PRIORITIES = ['높음', '보통', '낮음'] as const;
export const EFFORTS = ['소', '중', '대', '미정'] as const;
