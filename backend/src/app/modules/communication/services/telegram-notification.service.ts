import { Injectable } from '@nestjs/common';
import { TelegramService } from './telegram.service';

interface TelegramInterview {
    id: string;
    applicantId: string;
    positionTitle: string;
    startTime: Date;
    format: 'online' | 'offline';
    locationOrLink?: string;
}

interface TelegramApplicant {
    telegramChatId: string;
    telegramOptIn: boolean;
}

@Injectable()
export class TelegramNotificationsService {
    constructor(
        private readonly telegramService: TelegramService,
    ) { }

    async notifyInterviewScheduled(interview: TelegramInterview, applicant: TelegramApplicant) {
        if (!applicant || !applicant.telegramOptIn || !applicant.telegramChatId) return;

        const dateStr = interview.startTime.toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

        const text =
            `<b>New interview scheduled</b>\n\n` +
            `Position: <b>${interview.positionTitle}</b>\n` +
            `Date & time: <b>${dateStr}</b>\n` +
            `Format: <b>${interview.format}</b>\n` +
            (interview.locationOrLink
                ? `Details: ${interview.locationOrLink}\n`
                : '') +
            `\nIf you have questions, reply to your recruiter via email.`;

        await this.telegramService.sendMessage(applicant.telegramChatId, text, {
            parseMode: 'HTML',
        });
    }

    async notifyInterviewUpdated(interview: TelegramInterview, applicant: TelegramApplicant) {
        if (!applicant || !applicant.telegramOptIn || !applicant.telegramChatId) return;

        const dateStr = interview.startTime.toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

        const text =
            `<b>Interview updated</b>\n\n` +
            `Position: <b>${interview.positionTitle}</b>\n` +
            `Date & time: <b>${dateStr}</b>\n` +
            `Format: <b>${interview.format}</b>\n` +
            (interview.locationOrLink
                ? `Details: ${interview.locationOrLink}\n`
                : '') +
            `\nPlease acknowledge receipt.`;

        await this.telegramService.sendMessage(applicant.telegramChatId, text, {
            parseMode: 'HTML',
        });
    }

    async notifyInterviewCancelled(interview: TelegramInterview, applicant: TelegramApplicant) {
        if (!applicant || !applicant.telegramOptIn || !applicant.telegramChatId) return;

        const text =
            `<b>Interview cancelled</b>\n\n` +
            `Position: <b>${interview.positionTitle}</b>\n` +
            `You will be contacted with further details.`;

        await this.telegramService.sendMessage(applicant.telegramChatId, text, {
            parseMode: 'HTML',
        });
    }
}