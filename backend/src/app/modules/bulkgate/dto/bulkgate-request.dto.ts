import { BulkGateChannelCascade } from "../interfaces/bulkgate-channel-interface";

export class BulkGateTransactionalRequestDto {
  application_id: string;
  application_token: string;

  number?: string[];
  admin?: string;

  text: string;
  variables?: Record<string, string>;

  country?: string;
  schedule?: string | number;
  duplicates_check?: 'on' | 'off';
  tag?: string;

  channel?: BulkGateChannelCascade;
}