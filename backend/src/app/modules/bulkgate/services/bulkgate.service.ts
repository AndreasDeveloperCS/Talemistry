import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BulkGateTransactionalRequestDto } from '../dto/bulkgate-request.dto';
import { BulkGateTransactionalResponse } from '../dto/bulkgate-response.dto';

@Injectable()
export class BulkGateService {
  private readonly logger = new Logger(BulkGateService.name);

  constructor(private readonly http: HttpService) {}

  async sendTransactionalMessage(payload: BulkGateTransactionalRequestDto): Promise<BulkGateTransactionalResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<BulkGateTransactionalResponse>(
          process.env.BULKGATE_API_URL!,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          },
        ),
      );
      console.log('Bulkgate send message response success', response);
      return response.data;
    } catch (error: any) {
      this.logger.error('BulkGate request failed',  error?.response?.data || error.message,);
      console.log('Bulkgate send message response error', error);
    }
  }
}