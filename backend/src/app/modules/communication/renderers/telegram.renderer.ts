import { Injectable } from "@nestjs/common";
import { NotificationContent } from "../models/notification";

@Injectable()
export class TelegramRenderer {
  render(content: NotificationContent): string {
    return `
<b>${content.subject}</b>

${content.greeting}

${content.body.join('\n')}

${
  content.cta
    ? `<a href="${content.cta.url}">${content.cta.text}</a>`
    : ''
}

${content.signature.join('\n')}
`;
  }
}