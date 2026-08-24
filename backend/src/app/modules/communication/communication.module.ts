import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as multer from 'multer';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { LogModule } from '../log/log.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { UserModule } from '../users/user.module';
import { VisitorsModule } from '../visitors/visitors.module';
import { ChatMessageController } from './controllers/chat-message.controller';
import { ChatRoomController } from './controllers/chat-room.controller';
import { VideoChatRoomController } from './controllers/video-chat-room.controller';
import { ChatGateway } from './gateways/chat.gateway';
import { InterviewTaskGateway } from './gateways/interview-task-gateway';
import { NotifyGateway } from './gateways/notify.gateway';
import { RTCGateway } from './gateways/rtc.gateway';
import { TextChatGateway } from './gateways/text-chat-gateway';
import { ChatMessage, ChatMessageSchema } from './models/chat-message';
import { ChatRoom, ChatRoomSchema } from './models/chat-room';
import { VideoChatRoom, VideoChatRoomSchema } from './models/video-chat-room';
import { ChatMessageService } from './services/chat-message.service';
import { ChatRoomService } from './services/chat-room.service';
import { RoomsService } from './services/rooms.service';
import { VideoChatRoomService } from './services/video-chat-room.service';
import { SchemaFactory } from '@nestjs/mongoose';
import { Applicant } from './models/applicant';
import { ApplicantsService } from './services/applicants.service';
import { BulkgateModule } from '../bulkgate/bulkgate.module';
import { VideoModule } from '../video/video.module';
import { MessangerController } from './controllers/messanger.controller';
import { TelegramNotificationsController } from './controllers/telegram-notifications.controller';
import { TelegramController } from './controllers/telegram.controller';
import { ViberController } from './controllers/viber.controller';
import { VideoChatRoomParticipantController } from './controllers/video-chat-room-participant.controller';
import { WhatsappController } from './controllers/whatsapp.controller';
import { TelegramConnectionGateway } from './gateways/telegram-connection.gateway';
import { VideoInterviewGateway } from './gateways/video-interview.gateway';
import { VideoTextChatGateway } from './gateways/video-text-chat.gateway';
import { TelegramNotification, TelegramNotificationSchema } from './models/telegram-notification';
import { VideoChatRoomParticipant, VideoChatRoomParticipantSchema } from './models/video-chat-room-participant';
import { EmailRenderer } from './renderers/email.renderer';
import { SmsRenderer } from './renderers/sms.renderer';
import { TelegramRenderer } from './renderers/telegram.renderer';
import { NotificationTemplatesService } from './services/notification-templates.service';
import { NotificationsService } from './services/notifications.service';
import { TelegramConnectionService } from './services/telegram-connection.service';
import { TelegramNotificationsService } from './services/telegram-notification.service';
import { TelegramService } from './services/telegram.service';
import { VideoChatRoomParticipantService } from './services/video-chat-room-participant.service';
import { VideoInterviewService } from './services/video-interview.service';
import { WhatsappService } from './services/whatsapp.service';
import { WsEmitter } from './services/ws-emitter';
import { WsRegistry } from './services/ws-registry.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ChatRoom,
            ChatMessage,
            VideoChatRoom,
            VideoChatRoomParticipant,
            TelegramNotification,
        ]),
        MongooseModule.forFeature([
            {
                name: ChatRoom.name, schema: ChatRoomSchema
            },
            {
                name: ChatMessage.name, schema: ChatMessageSchema
            },
            {
                name: VideoChatRoom.name, schema: VideoChatRoomSchema
            },
            {
                name: VideoChatRoomParticipant.name, schema: VideoChatRoomParticipantSchema
            },
            {
                name: TelegramNotification.name, schema: TelegramNotificationSchema
            },
            {
                name: Applicant.name, schema: SchemaFactory.createForClass(Applicant)
            },
        ]),
        MulterModule.register({
            storage: multer.memoryStorage(),
        }),
        HttpModule.registerAsync({
            useFactory: () => ({
                timeout: 5000,
                maxRedirects: 5,
            }),
        }),
        EmailModule,
        VisitorsModule,
        UserModule,
        AuthModule,
        forwardRef(() => MeetingsModule),
        LogModule,
        ProfilesModule,
        VideoModule,
        BulkgateModule
    ],
    controllers: [
        ChatRoomController,
        ChatMessageController,
        VideoChatRoomController,
        VideoChatRoomParticipantController,
        MessangerController,
        TelegramController,
        TelegramNotificationsController,
        ViberController,
        WhatsappController
    ],
    providers: [
        ChatRoomService,
        ChatMessageService,

        RoomsService,

        VideoChatRoomService,
        VideoChatRoomParticipantService,
        VideoInterviewService,
        ChatGateway,
        RTCGateway,
        TextChatGateway,
        VideoTextChatGateway,
        VideoInterviewGateway,

        NotifyGateway,
        WsEmitter,
        WsRegistry,

        ApplicantsService,


        //VideoClientGateway,
        //VideoChatGateway,
        InterviewTaskGateway,

        TelegramService,
        TelegramNotificationsService,
        NotificationsService,
        NotificationTemplatesService,
        TelegramConnectionGateway,
        TelegramConnectionService,
        WhatsappService,

        SmsRenderer,
        EmailRenderer,
        TelegramRenderer
    ],
    exports: [
        MongooseModule,
        VideoTextChatGateway,
        ChatRoomService,
        ChatMessageService,
        VideoChatRoomService,
        VideoChatRoomParticipantService,

        ApplicantsService,

        MongooseModule,
        WsEmitter,
        WsRegistry,

        //VideoClientGateway,

        RTCGateway,
        ChatGateway,
        TextChatGateway,
        //VideoChatGateway,
        TelegramConnectionGateway,
        TelegramConnectionService,
        InterviewTaskGateway,
        NotificationsService,
        WhatsappService,
    ],
})
export class CommunicationModule { }
