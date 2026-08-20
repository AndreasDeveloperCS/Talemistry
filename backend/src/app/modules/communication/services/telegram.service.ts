import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly baseUrl: string;

    constructor(
        private readonly http: HttpService,
    ) {
        const token = process.env.TELEGRAM_BOT_TOKEN!;
        this.baseUrl = `https://api.telegram.org/bot${token}`;
    }

    async sendMessage(chatId: number | string, text: string, options?: {
        parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
        disableNotification?: boolean;
    }) {
        const payload: any = {
            chat_id: chatId,
            text,
            parse_mode: options?.parseMode ?? 'HTML',
            disable_notification: options?.disableNotification ?? false,
        };

        try {
            const res$ = this.http.post(`${this.baseUrl}/sendMessage`, payload);
            const res = await firstValueFrom(res$);
            console.log('Telegram message sent', res.data);
            return res.data;
        } catch (err) {
            console.error('Telegram message sent', err);
            this.logger.error(`Failed to send Telegram message`, err?.response?.data || err);
        }
    }

}
