import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/services/user.service';
import { TelegramService } from '../services/telegram.service';
import { TelegramConnectionService } from '../services/telegram-connection.service';

@Controller('telegram')
export class TelegramController {
    private readonly webhookSecret: string;

    constructor(
        private readonly telegramService: TelegramService,
        private readonly userService: UsersService,
        private readonly telegramConnectionService: TelegramConnectionService,
    ) {
        this.webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET!;
    }

    @Post('webhook')
    async handleUpdate(
        @Body() update: TelegramUpdate,
        @Headers('x-telegram-bot-api-secret-token')
        secretToken: string,
    ) {
        console.log('HEADER TOKEN:', secretToken);
        console.log('ENV TOKEN:', process.env.TELEGRAM_WEBHOOK_SECRET);
        console.log('handleUpdate', update?.message?.chat, update?.message?.chat?.id);

        console.log('handleUpdate 1', update, update.message, update.message?.chat?.id);
        if (secretToken !== this.webhookSecret) {
            throw new UnauthorizedException();
        }

        if (!update.message) {
            return { ok: true };
        }

        const msg = update.message;
        const chatId = msg.chat.id;
        const text = msg.text || '';

        console.log('handleUpdate 2', msg, chatId, text);

        if (text.startsWith('/start')) {

            const [, connectToken] = text.split(' ');

            if (!connectToken) {
                await this.telegramService.sendMessage(
                    chatId,
                    'Please open me from your EVRYKA profile to connect your Telegram 🧩',
                );
                return { ok: true };
            }

            const user = await this.userService.findByTelegramConnectToken(connectToken);

            if (
                !user ||
                !user.telegram?.connectTokenExpiresAt ||
                user.telegram.connectTokenExpiresAt < new Date()
            ) {
                await this.telegramService.sendMessage(
                    chatId,
                    '❌ Invalid or expired link. Please generate a new one from your profile.',
                );
                return { ok: true };
            }
            console.log('Linking Telegram for user:', chatId);

            await this.userService.linkTelegram(user._id, {
                chatId: chatId.toString(),
                username: msg.from?.username,
            });

            await this.telegramService.sendMessage(
                chatId,
                `✅ Hi, ${user.firstname}! You will now receive EVRYKA updates here.`,
            );

            // Notify the user via WebSocket that Telegram is now linked
            const userIdString = user._id;
            console.log('📡 Broadcasting Telegram linked event for userId:', userIdString);

            this.telegramConnectionService.notifyUserTelegramLinked(
                userIdString,
                {
                    chatId: chatId.toString(),
                    username: msg.from?.username,
                    enabled: true,
                }
            );

            console.log('✅ Telegram linked notification sent for userId:', userIdString);
        }

        return { ok: true };
    }
}
