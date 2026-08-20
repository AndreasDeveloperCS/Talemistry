export interface UserNotificationPreferences {
  enabled: boolean;
  viber?: boolean;
  whatsapp?: boolean;
  sms?: boolean;
  email?: boolean;
  telegram?: boolean;
}

export interface UserNotificationTarget {
  phoneNumber: string;
  firstName: string;
  email: string;
  telegramChatId?: string;
  preferences: UserNotificationPreferences;
}

export interface NotificationContent {
  subject: string;
  greeting: string;
  body: string[];
  cta?: {
    text: string;
    url: string;
  };
  signature: string[];
}