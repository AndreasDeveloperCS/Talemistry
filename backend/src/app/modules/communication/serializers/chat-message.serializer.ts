import { NotificationContent } from "../models/notification";

export class ChatMessageSerializer {
  static toPlainText(content: NotificationContent): string {
    return [
      content.subject,
      '',
      content.greeting,
      '',
      ...content.body,
      '',
      content.cta ? `${content.cta.text}: ${content.cta.url}` : '',
      '',
      ...content.signature,
    ]
      .filter(Boolean)
      .join('\n');
  }

  static toHtml(content: NotificationContent): string {
    const parts: string[] = [];

    if (content.greeting) {
        parts.push(`<p>${this.escapeHtml(content.greeting)}</p>`);
    }

    if (content.body?.length) {
        for (const line of content.body) {
            parts.push(`<p>${this.escapeHtml(line)}</p>`);
        }
    }

    if (content.cta) {
        parts.push(`
            <p>
                <a
                    href="${this.escapeAttribute(content.cta.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ${this.escapeHtml(content.cta.text)}
                </a>
            </p>
        `);
    }

    if (content.signature?.length) {
        parts.push('<br>');

        for (const line of content.signature) {
            parts.push(`<p>${this.escapeHtml(line)}</p>`);
        }
    }

    return parts.join('');
}

private static escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

private static escapeAttribute(value: string): string {
    return this.escapeHtml(value);
}
}