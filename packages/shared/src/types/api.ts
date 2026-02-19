export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// Category
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
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

// Logs
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

export interface LogFilters {
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// Dashboard
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

// Connection test
export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}
