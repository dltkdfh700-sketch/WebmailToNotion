import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Types ──────────────────────────────────────────────

export interface Settings {
  pop3: { host: string; port: number; user: string; password: string; tls: boolean };
  ai: {
    provider: 'claude' | 'ollama';
    claude: { apiKey: string; model: string };
    ollama: { host: string; model: string };
  };
  notion: { apiKey: string; databaseId: string };
  scheduler: { enabled: boolean; intervalMinutes: number };
}

export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id: number;
  emailUid: string;
  messageId: string;
  from: string;
  subject: string;
  status: 'success' | 'skipped' | 'error';
  category?: string;
  priority?: string;
  notionPageId?: string;
  notionPageUrl?: string;
  errorMessage?: string;
  aiProvider?: string;
  processingTimeMs?: number;
  createdAt: string;
}

export interface DashboardStats {
  totalProcessed: number;
  todayProcessed: number;
  successRate: number;
  categoryDistribution: { category: string; count: number }[];
  recentLogs: LogEntry[];
  schedulerStatus: {
    enabled: boolean;
    running: boolean;
    lastRun?: string;
    nextRun?: string;
  };
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export interface CategoryCreateInput {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

export interface CategoryUpdateInput {
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

export interface LogFilterParams {
  page?: number;
  limit?: number;
  status?: 'success' | 'skipped' | 'error';
  category?: string;
  startDate?: string;
  endDate?: string;
}

// ── API Functions ──────────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return data.data!;
}

export async function fetchCategories(): Promise<CategoryResponse[]> {
  const { data } = await api.get<ApiResponse<CategoryResponse[]>>('/categories');
  return data.data!;
}

export async function createCategory(input: CategoryCreateInput): Promise<CategoryResponse> {
  const { data } = await api.post<ApiResponse<CategoryResponse>>('/categories', input);
  return data.data!;
}

export async function updateCategory(id: number, input: CategoryUpdateInput): Promise<CategoryResponse> {
  const { data } = await api.put<ApiResponse<CategoryResponse>>(`/categories/${id}`, input);
  return data.data!;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}

export async function fetchSettings(): Promise<Settings> {
  const { data } = await api.get<ApiResponse<Settings>>('/settings');
  return data.data!;
}

export async function updateSettings(input: Partial<Settings>): Promise<Settings> {
  const { data } = await api.put<ApiResponse<Settings>>('/settings', input);
  return data.data!;
}

export async function testPOP3(): Promise<ConnectionTestResult> {
  const { data } = await api.post<ApiResponse<ConnectionTestResult>>('/settings/test-pop3');
  return data.data!;
}

export async function testNotion(): Promise<ConnectionTestResult> {
  const { data } = await api.post<ApiResponse<ConnectionTestResult>>('/settings/test-notion');
  return data.data!;
}

export async function testAI(): Promise<ConnectionTestResult> {
  const { data } = await api.post<ApiResponse<ConnectionTestResult>>('/settings/test-ai');
  return data.data!;
}

export async function testNotionWrite(): Promise<ConnectionTestResult & { url?: string }> {
  const { data } = await api.post<ApiResponse<ConnectionTestResult & { url?: string }>>('/settings/test-notion-write');
  return data.data!;
}

export async function fetchOllamaModels(host?: string): Promise<string[]> {
  const params = host ? { host } : {};
  const { data } = await api.get<ApiResponse<string[]>>('/settings/ollama-models', { params });
  return data.data ?? [];
}

export async function fetchLogs(params: LogFilterParams): Promise<PaginatedResponse<LogEntry>> {
  const { data } = await api.get<PaginatedResponse<LogEntry>>('/logs', { params });
  return data;
}

export async function retryLog(id: number): Promise<{ success: boolean; message: string; notionPageUrl?: string }> {
  const { data } = await api.post<ApiResponse<{ success: boolean; message: string; notionPageUrl?: string }>>(`/logs/${id}/retry`);
  return data.data!;
}

export async function triggerProcessing(): Promise<{ processed: number; errors: number }> {
  const { data } = await api.post<ApiResponse<{ processed: number; errors: number }>>('/process/trigger');
  return data.data!;
}

export interface FetchTodayResult {
  total: number;
  todayCount: number;
  written: number;
  errors: number;
  message: string;
}

export async function fetchTodayEmails(): Promise<FetchTodayResult> {
  const { data } = await api.post<ApiResponse<FetchTodayResult>>('/trigger/fetch-today');
  return data.data!;
}
