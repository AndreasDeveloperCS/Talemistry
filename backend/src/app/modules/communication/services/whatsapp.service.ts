import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { WhatsAppTemplates, WhatsAppTemplateVariables } from '../enums/whatsapp-templates.enum';
import { buildTemplateComponents } from '../utils/whatsapp.utils';
import { NotificationTemplate } from '../enums/notification-templates.enum';
import { WhatsAppNotificationPayload } from '../models/whatsapp';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly version = process.env.WHATSAPP_API_VERSION || 'v19.0';
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  private readonly businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  private readonly baseUrlMessages: string = `${process.env.FACEBOOK_BASE_URL}/${this.version}/${this.phoneNumberId}/messages`;
  private readonly baseUrlMessageTemplates: string = `${process.env.FACEBOOK_BASE_URL}/${this.version}/${this.businessAccountId}/message_templates`;

  private readonly websiteLink = process.env.WEBSITE_LINK;
  private readonly positionBaseUrl: string = `${process.env.WEBSITE_LINK}${process.env.POSITION_BASE_URL}`;
  private readonly screeningBaseUrl: string = `${process.env.WEBSITE_LINK}${process.env.SCREENING_BASE_URL}`;
  private readonly calendarBaseUrl: string = `${process.env.WEBSITE_LINK}${process.env.CALENDAR_BASE_URL}`;
  private readonly meetingBaseUrl: string = `${process.env.WEBSITE_LINK}${process.env.MEETING_BASE_URL}`;
  private readonly feedbackBaseUrl: string = `${process.env.WEBSITE_LINK}${process.env.FEEDBACK_BASE_URL}`;

  constructor(private readonly http: HttpService) { }

  async sendNotification(payload: WhatsAppNotificationPayload) {
    const { template, user, data } = payload;
    
    //const templates = this.getTemplates();

    const vars = this.buildVariables(template, user, data);

    return this.sendTemplateMessage({
      to: user.phone,
      templateName: WhatsAppTemplates[template].name,
      languageCode: WhatsAppTemplates[template].language,
      components: buildTemplateComponents(template, vars),
    });
  }

  private buildVariables(
    template: NotificationTemplate,
    user: { firstName: string },
    data: WhatsAppNotificationPayload['data'],
  ) {
    switch (template) {
      case NotificationTemplate.DIRECT_CALL_INVITE:
        return {
          candidate_name: user.firstName,
          caller_name: String(data.callerName || 'A participant'),
          call_type: String(data.callType || 'video'),
          room_name: String(data.roomName || 'Direct call'),
          direct_call_link: String(data.directCallLink || this.websiteLink),
        };

      case NotificationTemplate.INTERVIEW_SETUP:
        return {
          candidate_name: user.firstName,
          position_name: data.positionName,
          company_name: data.companyName,
          book_slot_link: `${this.calendarBaseUrl}${data.calendarLinkId}`,
          position_link: `${data.positionId}`,
          slot_calendar_link: `${data.calendarLinkId}`,
        };

      case NotificationTemplate.PRESCREEN_INVITATION_QUESTIONNAIRE:
        return {
          candidate_name: user.firstName,
          position_name: data.positionName,
          company_name: data.companyName,
          assessment_link: `${this.screeningBaseUrl}${data.screeningLinkId}`,
          position_link: `${data.positionId}`,
          screening_link: `${data.screeningLinkId}`,
        };

      case NotificationTemplate.INTERVIEW_SCHEDULED_CONFIRMATION:
        return {
          candidate_name: user.firstName,
          position_name: data.positionName,
          company_name: data.companyName,
          time_slot: data.timeSlot,
          meeting_link: `${this.meetingBaseUrl}${data.joinInterviewLink}`,
          position_link: `${data.positionId}`,
          join_interview_link: `${data.joinInterviewLink}`,
        };

      case NotificationTemplate.INTERVIEW_FEEDBACK:
        return {
          candidate_name: user.firstName,
          position_name: data.positionName,
          company_name: data.companyName,
          position_link: `${this.positionBaseUrl}${data.positionId}`,
          feedback_link: `${this.feedbackBaseUrl}${data.feedbackLink}`,
        };

      default:
        throw new Error(`Unsupported WhatsApp template: ${template}`);
    }
  }

  async sendTemplateMessage(params: { to: string; templateName: string; languageCode?: string; components?: any[]; }) {
    const payload = {
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: {
          code: params.languageCode ?? 'en_US',
        },
        components: params.components ?? [],
      },
    };

    try {
      const res$ = this.http.post(this.baseUrlMessages, payload, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      const res = await firstValueFrom(res$);
      console.log('WhatsApp response', res);
      this.logger.log(`WhatsApp message sent to ${params.to}`);
      return res.data;
    } catch (err) {
      this.logger.error(
        'Failed to send WhatsApp message',
        err?.response?.data || err,
      );
      throw err;
    }
  }

  async getTemplates() {
    try {
      const res$ = this.http.get(this.baseUrlMessageTemplates, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        params: { },
      });

      const res = await firstValueFrom(res$);
      console.log('Retrieved WhatsApp templates', JSON.stringify(res.data.data, null, 2));
      return res.data.data; 
    } catch (err) {
      this.logger.error(
        'Failed to retrieve WhatsApp templates',
        err?.response?.data || err,
      );
      throw err;
    }
  }
}