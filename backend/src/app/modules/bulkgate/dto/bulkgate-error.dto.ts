export interface BulkGateErrorResponse {
  type: string;
  code: number;
  error: string;
  detail?: string | null;
}