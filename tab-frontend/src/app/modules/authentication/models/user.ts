import { AbstractControl } from "@angular/forms";
import { BaseEntity } from "../../general/models/base-entity";
import { DEFAULT_NOTIFICATION_PREFERENCES, MessageNotificationPreferences } from "../../communication/models/notification-channel";

export class User implements BaseEntity {
  _id: any;
  firstname: string = "";
  lastname: string = "";
  fullName: string = `${this.firstname} ${this.lastname}`;
  email: string = "";
  phone: string = "";
  username?: string;
  telegram?: TelegramNotification;
  messageNotificationPreferences?: MessageNotificationPreferences = structuredClone(DEFAULT_NOTIFICATION_PREFERENCES);

  login?: string;
  isVerifiedEmail?: boolean;
  isVerifiedPhone?: boolean;
  createdDate: Date = new Date();
  modifiedDate?: Date;
  roles?: any;
  role?: any;
  photo?: string;
}

export interface TelegramNotification {
  chatId: string;
  username?: string;
  enabled: boolean;
  connectToken?: string;
  connectTokenExpiresAt?: Date;
  linkedAt: Date;
}

export class UserCredentials extends User {
  password?: string;
  newPassword?: string;
}

export class UserInfo {
  firstname?: AbstractControl<any, any>;
  lastname?: AbstractControl<any, any>;
  phone?: AbstractControl<any, any>;
  email?: AbstractControl<any, any>;
  username?: AbstractControl<any, any>;
  title?: AbstractControl<any, any>;
  // currentPassword?: AbstractControl<any, any>;
  // newPassword?: AbstractControl<any, any>;
  // repeatNewPassword?: AbstractControl<any, any>;
  // verificationCode ?: AbstractControl<any, any>;
  // comment?: AbstractControl<any, any>;
}