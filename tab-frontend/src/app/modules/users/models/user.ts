import { AbstractControl } from "@angular/forms";
import { BaseEntity } from "../../general/models/base-entity";

export class User implements BaseEntity {
  _id?: any;
  firstname: string = "";
  lastname: string = "";
  fullName: string = `${this.firstname} ${this.lastname}`;
  email: string = "";
  phone: string = "";
  paymentSubscription?: PaymentSubscriptionState;
  login?: string;
  isVerifiedEmail?: boolean;
  isVerifiedPhone?: boolean;
  createdDate: Date = new Date();
  modifiedDate?: Date;
  roles?: any;
  role?: any;
}

export interface MetadataMap {
  [key: string]: string | number | boolean | undefined;
}

export type BillingCycle = 'monthly' | 'yearly';

export type PaymentProvider = 'stripe' | 'gocardless';

export interface PaymentEventRecord {
  id?: string;
  type?: string;
  action?: string;
  resourceType?: string;
  summary?: string;
  processedAt: string;
}

export interface PaymentBillingContact {
  email?: string;
  fullName?: string;
  givenName?: string;
  familyName?: string;
  companyName?: string;
  phone?: string;
}

export interface PaymentSubscriptionState {
  provider?: PaymentProvider;
  planId?: string;
  planName?: string;
  billingCycle?: BillingCycle;
  status?: string;
  customerId?: string;
  subscriptionId?: string;
  checkoutSessionId?: string;
  mandateId?: string;
  redirectFlowId?: string;
  amount?: number;
  currency?: string;
  companyId?: string;
  billingContact?: PaymentBillingContact;
  metadata?: MetadataMap;
  lastEvent?: PaymentEventRecord;
  updatedAt?: string;
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
  // currentPassword?: AbstractControl<any, any>;
  // newPassword?: AbstractControl<any, any>;
  // repeatNewPassword?: AbstractControl<any, any>;
  // verificationCode ?: AbstractControl<any, any>;
  // comment?: AbstractControl<any, any>;
}