export interface NotionPage {
  id: string;
  url: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

export interface NotionBlock {
  type: string;
  content: string;
}

export type NotionStatus = '신규' | '검토중' | '승인' | '진행중' | '완료' | '보류';
