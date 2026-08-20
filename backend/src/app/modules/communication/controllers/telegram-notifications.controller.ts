import { Controller, Post, Body, NotFoundException } from '@nestjs/common';
import { TelegramService } from '../services/telegram.service';
import { ApplicantsService } from '../services/applicants.service';

@Controller('telegram-notifications')
export class TelegramNotificationsController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly applicantsService: ApplicantsService,
  ) {}

  @Post()
  async notifyFromFrontend(
    @Body()
    body: {
      roomId: string;
      content: string;
      userId: string;
      createdBy: string;
      createdDate: Date;
    },
  ) {
    // 1️⃣ Find applicant/user connected to this room
    const applicant = await this.applicantsService.findById(body.roomId); // findByRoomId method to be implemented
    if (!applicant) {
      throw new NotFoundException('Applicant not found');
    }
    console.log('notifyFromFrontend for applicant', applicant._id, applicant.telegramChatId);
    
    // 2️⃣ Check if user linked Telegram
    if (!applicant.telegramChatId) {
      return {
        ok: false,
        reason: 'User has not connected Telegram.',
      };
    }

    // 3️⃣ Send message
    await this.telegramService.sendMessage(
      applicant.telegramChatId,
      body.content,
    );

    return { ok: true };
  }
}