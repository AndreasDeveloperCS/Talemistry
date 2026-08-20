import { Injectable } from '@nestjs/common';
import { BulkGateSenderId } from '../../bulkgate/enums/bulkgate-sender-id.enum';
import { BulkGateService } from '../../bulkgate/services/bulkgate.service';
import { TelegramService } from '../../communication/services/telegram.service';
import { EmailService } from '../../email/services/email.service';
import { NotificationTemplate } from '../enums/notification-templates.enum';
import { TemplateVariables } from '../models/chat-message';
import { WhatsappService } from './whatsapp.service';
import { NotificationContent, UserNotificationTarget } from '../models/notification';
import { SmsRenderer } from '../renderers/sms.renderer';
import { TelegramRenderer } from '../renderers/telegram.renderer';
import { EmailRenderer } from '../renderers/email.renderer';

export interface NotificationDeliveryResult {
  channel: 'sms' | 'email' | 'telegram' | 'whatsapp';
  success: boolean;
  skipped?: boolean;
  reason?: string;
}

@Injectable()
export class NotificationsService {
  
  constructor(private readonly bulkGate: BulkGateService,
    private emailService: EmailService,
    private telegramService: TelegramService,
    private whatsappService: WhatsappService,
    private smsRenderer: SmsRenderer,
    private emailRenderer: EmailRenderer,
    private telegramRenderer: TelegramRenderer,
  ) {}

  async notifyUserAboutNewMessage(
    user: UserNotificationTarget, 
    content: NotificationContent,
    messageTemplate?: NotificationTemplate | NotificationTemplate,
    variables?: TemplateVariables
  ): Promise<NotificationDeliveryResult[]> {
    if (!user.preferences.enabled) { 
      return []; 
    }

    //console.log('Available WhatsApp templates retrieving:');
    //await this.whatsappService.getTemplates();

    const tasks: Promise<NotificationDeliveryResult>[] = [];

    // ---------- BulkGate channels ----------
    const bulkGateChannels: Array<{ name: string; payload: any }> = [];

    // SMS Bulkgate

    if (user.preferences.sms && user.phoneNumber) {
      bulkGateChannels.push({
        name: 'sms',
        payload: {
          sender_id: BulkGateSenderId.TEXT,
          sender_id_value: 'EVRYKA',
          unicode: true,
        },
      });
    } else if (user.preferences.sms) {
      tasks.push(Promise.resolve({
        channel: 'sms',
        success: false,
        skipped: true,
        reason: 'missing phone number',
      }));
    }

    for (const ch of bulkGateChannels) {
      const smsText = this.smsRenderer.render(content);

      const task: Promise<NotificationDeliveryResult> = this.bulkGate
        .sendTransactionalMessage({
          application_id: process.env.BULKGATE_APP_ID!,
          application_token: process.env.BULKGATE_APP_TOKEN!,
          number: [user.phoneNumber.replace('+', '')],
          text: smsText,
          variables: { first_name: user.firstName },
          channel: { [ch.name]: ch.payload },
        })
        .then(() => ({ channel: 'sms' as const, success: true }))
        .catch((err) => {
          console.error(`BulkGate ${ch.name} failed`, err);
          return { channel: 'sms' as const, success: false, reason: 'send failed' };
        });

      tasks.push(task);
    }

    // ---------- Email ----------
    if (user.preferences.email && user.email) {
      const email = this.emailRenderer.render(content);
      tasks.push(
        (async () => {
          try {
            const msg = this.emailService.getNewMessageNotification(
              user.email,
              email.html, 
              email.subject, 
            );

            const res = await this.emailService.sendMessage(msg);
            return { channel: 'email', success: true } as NotificationDeliveryResult;
          } catch (err) {
            console.error(`Email failed for ${user.email}`, err);
            return { channel: 'email', success: false, reason: 'send failed' } as NotificationDeliveryResult;
          }
        })(),
      );
    } else if (user.preferences.email) {
      tasks.push(Promise.resolve({
        channel: 'email',
        success: false,
        skipped: true,
        reason: 'missing email address',
      }));
    }

    // ----------- Telegram -----------

    if(user.preferences.telegram && user.telegramChatId) {
      const telegramText = this.telegramRenderer.render(content);
      tasks.push(
        (async () => {
          try {
            const res = await this.telegramService.sendMessage(
                user.telegramChatId!,
                telegramText,
            );
            return { channel: 'telegram', success: true } as NotificationDeliveryResult;
          } catch (err) {
            console.error(`Telegram failed for ${user}`, err);
            return { channel: 'telegram', success: false, reason: 'send failed' } as NotificationDeliveryResult;
          }
        })(),
      );
    } else if (user.preferences.telegram) {
      tasks.push(Promise.resolve({
        channel: 'telegram',
        success: false,
        skipped: true,
        reason: 'missing Telegram chat id',
      }));
    }

    // ----------- Whatsapp -----------

    if (user.preferences.whatsapp && messageTemplate && user.phoneNumber) {
      tasks.push(
        this.whatsappService.sendNotification({
          template: messageTemplate,
          user: {
            phone: user.phoneNumber.replace('+', ''),
            firstName: user.firstName,
          },
          data: variables,
        })
          .then(() => ({ channel: 'whatsapp', success: true } as NotificationDeliveryResult))
          .catch((err) => {
            console.error(`WhatsApp failed for ${user.phoneNumber}`, err);
            return { channel: 'whatsapp', success: false, reason: 'send failed' } as NotificationDeliveryResult;
          }),
      );
    } else if (user.preferences.whatsapp) {
      tasks.push(Promise.resolve({
        channel: 'whatsapp',
        success: false,
        skipped: true,
        reason: !messageTemplate ? 'missing WhatsApp template' : 'missing phone number',
      }));
    }

    return Promise.all(tasks);
  }
}

// Viber Bulkgate

//if (user.preferences.viber) {
  // bulkGateChannels.push({
  //   name: 'viber',
  //   payload: {
  //     sender: 'EVRYKA',
  //     expiration: 120,
  //   },
  // });
//}