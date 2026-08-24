import { CommunicationMean } from "../../interviews/models/communication-mean";

export interface NotificationChannel {
  id: NotificationChannelId;
  name: string;
  icon?: string;
  image?: string;
  description?: string;
  popular?: boolean;
  enabled?: boolean;
  disabled?: boolean;
  pending?: boolean;
}

export type NotificationChannelId =
  | CommunicationMean.email
  | CommunicationMean.sms
  | CommunicationMean.viber
  | CommunicationMean.whatsapp
  | CommunicationMean.telegram;

export interface MessageNotificationPreferences {
  channels: Record<NotificationChannelId, boolean>;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: MessageNotificationPreferences = {
  channels: {
    email: true,
    sms: true,
    viber: false,
    whatsapp: false,
    telegram: false
  }
};