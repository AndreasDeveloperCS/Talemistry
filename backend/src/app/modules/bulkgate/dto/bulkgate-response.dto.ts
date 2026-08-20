export interface BulkGateMessageStatus {
  status:
    | 'sent'
    | 'accepted'
    | 'scheduled'
    | 'error'
    | 'blacklisted'
    | 'invalid_number'
    | 'invalid_sender'
    | 'duplicity_message';

  message_id: string;
  part_id: string[];
  number: string;
  channel: string;
}

export interface BulkGateTransactionalResponse {
  data: {
    total: {
      status: Record<string, number>;
    };
    response: BulkGateMessageStatus[];
  };
}