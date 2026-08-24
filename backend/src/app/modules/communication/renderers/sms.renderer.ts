import { Injectable } from "@nestjs/common";
import { NotificationContent } from "../models/notification";

@Injectable()
export class SmsRenderer {
  render(content: NotificationContent): string {
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
    ].join('\n');
  }
}