export enum CommunicationMean {
  email = 'email',
  sms = 'sms',
  viber = 'viber',
  whatsapp = 'whatsapp',
  telegram = 'telegram',

  phone = 'phone',
  onlineMeeting = 'onlineMeeting',
  personalMeeting = 'personalMeeting',
}

export interface MessageNotificationPreferences {
  channels: Record<NotificationChannelId, boolean>;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: MessageNotificationPreferences = {
  channels: {
    email: true,
    sms: true,
    viber: false,
    whatsapp: false,
    telegram: false,
  },
};

export type NotificationChannelId =
  | CommunicationMean.email
  | CommunicationMean.sms
  | CommunicationMean.viber
  | CommunicationMean.whatsapp
  | CommunicationMean.telegram;

export type ChannelPreferences = {
  enabled: boolean;
} & Record<NotificationChannelId, boolean>;