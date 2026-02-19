export const DEFAULT_CATEGORIES = [
  { name: '기능요청', description: '새로운 기능 요청', color: '#3B82F6', sortOrder: 1 },
  { name: '버그리포트', description: '버그 및 오류 보고', color: '#EF4444', sortOrder: 2 },
  { name: '개선사항', description: '기존 기능 개선 요청', color: '#F59E0B', sortOrder: 3 },
  { name: '문의사항', description: '일반 문의 및 질문', color: '#10B981', sortOrder: 4 },
  { name: '기타', description: '분류되지 않은 항목', color: '#6B7280', sortOrder: 5 },
];

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
