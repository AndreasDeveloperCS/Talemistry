import { BulkGateSenderId } from '../enums/bulkgate-sender-id.enum';

export interface BulkGateSmsChannel {
  text?: string;
  sender_id?: BulkGateSenderId;
  sender_id_value?: string;
  unicode?: boolean;
}

export interface BulkGateViberChannel {
  sender: string;
  expiration?: number;
  text?: string;
  use_template?: boolean;
}

export interface BulkGateWhatsAppChannel {
  sender: string;
  expiration?: number;
  message: {
    text: string;
  };
}

export interface BulkGateChannelCascade {
  sms?: BulkGateSmsChannel;
  viber?: BulkGateViberChannel;
  whatsapp?: BulkGateWhatsAppChannel;
}