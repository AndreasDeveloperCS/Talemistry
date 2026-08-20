import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TelegramConnectionGateway } from '../gateways/telegram-connection.gateway';
import { ObjectId } from 'bson';

@Injectable()
export class TelegramConnectionService {
    private readonly logger = new Logger(TelegramConnectionService.name);

    constructor(
        private readonly telegramGateway: TelegramConnectionGateway,
    ) { }

    /**
     * Notify a user that their Telegram account has been linked
     */
    notifyUserTelegramLinked(
        userId: ObjectId,
        telegramData: {
            chatId: string;
            username?: string;
            enabled: boolean;
        }
    ): void {
        this.logger.log(`🔔 Notifying user ${userId} of Telegram link with chatId: ${telegramData.chatId}`);
        this.logger.log(`📊 Telegram data:`, JSON.stringify(telegramData));
        this.telegramGateway.notifyTelegramLinked(userId, telegramData);
    }

    getConnectionStats(): {
        activeListeners: number;
        totalSockets: number;
    } {
        return {
            activeListeners: this.telegramGateway.getActiveListenersCount(),
            totalSockets: this.telegramGateway.getTotalSocketsCount(),
        };
    }

    /**
     * Clean up stale connections every 5 minutes
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    handleConnectionCleanup(): void {
        const stats = this.getConnectionStats();
        this.logger.log(
            `Running cleanup. Active listeners: ${stats.activeListeners}, Total sockets: ${stats.totalSockets}`
        );

        this.telegramGateway.cleanupStaleConnections();
    }

    /**
     * Log memory stats every 10 minutes
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    logMemoryStats(): void {
        const stats = this.getConnectionStats();
        this.logger.log(
            `Memory stats - Active listeners: ${stats.activeListeners}, Total sockets: ${stats.totalSockets}`
        );
    }
}
