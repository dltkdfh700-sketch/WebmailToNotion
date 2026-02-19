export interface RawEmail {
  uid: string;
  messageId: string;
  raw: string;
}

export interface ParsedEmail {
  uid: string;
  messageId: string;
  from: string;
  to: string;
  subject: string;
  date: Date;
  textBody: string;
  htmlBody?: string;
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
}
