import { simpleParser } from 'mailparser';
import { convert } from 'html-to-text';
import type { RawEmail, ParsedEmail, EmailAttachment } from '@mail-to-notion/shared';

export async function parse(rawEmail: RawEmail): Promise<ParsedEmail> {
  const parsed = await simpleParser(rawEmail.raw);

  const from = parsed.from?.text ?? '';
  const to = parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map((a) => a.text).join(', ') : parsed.to.text) : '';
  const subject = parsed.subject ?? '(No Subject)';
  const date = parsed.date ?? new Date();

  // Prefer text body, fall back to HTML converted to text
  let textBody = parsed.text ?? '';
  if (!textBody && parsed.html) {
    textBody = convert(parsed.html, {
      wordwrap: false,
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
      ],
    });
  }

  const htmlBody = typeof parsed.html === 'string' ? parsed.html : undefined;

  const attachments: EmailAttachment[] = (parsed.attachments ?? []).map((att) => ({
    filename: att.filename ?? 'unnamed',
    contentType: att.contentType ?? 'application/octet-stream',
    size: att.size ?? 0,
  }));

  return {
    uid: rawEmail.uid,
    messageId: rawEmail.messageId,
    from,
    to,
    subject,
    date,
    textBody,
    htmlBody,
    attachments,
  };
}
