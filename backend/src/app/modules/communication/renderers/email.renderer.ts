import { Injectable } from "@nestjs/common";
import { NotificationContent } from "../models/notification";

@Injectable()
export class EmailRenderer {
  render(content: NotificationContent) {
    return {
      subject: content.subject,
      html: `
        <p>${content.greeting}</p>
        ${content.body.map(p => `<p>${p}</p>`).join('')}
        ${
          content.cta
            ? `<p><a href="${content.cta.url}">${content.cta.text}</a></p>`
            : ''
        }
        <br/>
        ${content.signature.map(s => `<p>${s}</p>`).join('')}
      `,
    };
  }
}