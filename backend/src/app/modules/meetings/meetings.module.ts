import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { BaseModule } from '../base/base.module';
import { CoreModule } from '../core/core.module';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../users/user.module';
import { InterviewController } from './controllers/interview.controller';
import { MeetingInvitationsController } from './controllers/meeting-invitations.controller';
import { MeetingsController } from './controllers/meetings.controller';
import { ScheduleDefaultSettingsController } from './controllers/schedule-default-settings.controller';
import { ScheduleController } from './controllers/schedule.controller';
import { ZoomController } from './controllers/zoom.controller';
import { CalendarInvitation, CalendarInvitationSchema } from './model/calendar-invitation';
import { Interview, InterviewSchema } from './model/interview';
import { Meeting, MeetingSchema } from './model/meeting';
import { MeetingInvitation, MeetingInvitationSchema } from './model/meeting-invitation';
import { ScheduleDefaultSettings, ScheduleDefaultSettingsSchema } from './model/schedule-settings';
import { ScheduleTimeFrame, ScheduleTimeFrameSchema } from './model/schedule-timeframes';
import { CalendarInvitationService } from './services/calendar-invitation.service';
import { CalendarService } from './services/calendar.service';
import { GoogleMeetMeetingService } from './services/google-meet-meeting.service';
import { InterviewService } from './services/interview.service';
import { MeetingInvitationsService } from './services/meeting-invitations.service';
import { MeetingsService } from './services/meetings.service';
import { ScheduleDefaultSettingsService } from './services/schedule-default-settings.service';
import { ScheduleService } from './services/schedule.service';
import { TeamsService } from './services/team.service';
import { ZoomService } from './services/zoom.service';
import { MeetingTemplate, MeetingTemplateSchema } from './model/meeting-template';
import { MeetingTemplatesService } from './services/meeting-templates.service';
import { MeetingTemplatesController } from './controllers/meeting-templates.controller';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Meeting,
      CalendarInvitation,
      Interview,
      ScheduleTimeFrame,
      ScheduleDefaultSettings,
      MeetingInvitation,
      MeetingTemplate,
    ]),
    HttpModule,
    MongooseModule.forFeature([
      {
        name: Meeting.name, schema: MeetingSchema
      },
      {
        name: Interview.name, schema: InterviewSchema
      },
      {
        name: CalendarInvitation.name, schema: CalendarInvitationSchema
      },
      {
        name: ScheduleTimeFrame.name, schema: ScheduleTimeFrameSchema
      },
      {
        name: ScheduleDefaultSettings.name, schema: ScheduleDefaultSettingsSchema
      },
      {
        name: MeetingInvitation.name, schema: MeetingInvitationSchema
      },
      {
        name: MeetingTemplate.name, schema: MeetingTemplateSchema
      },
    ]),
    BaseModule,
    CoreModule,
    EmailModule,
    UserModule,
    forwardRef(() => CommunicationModule),
  ],
  controllers: [
    MeetingsController,
    InterviewController,
    ScheduleController,
    ZoomController,
    ScheduleController,
    ScheduleDefaultSettingsController,
    MeetingInvitationsController,
    MeetingTemplatesController,
  ],
  providers: [
    TeamsService,
    ZoomService,
    MeetingsService,
    CalendarService,
    CalendarInvitationService,
    InterviewService,
    ScheduleService,
    ScheduleDefaultSettingsService,
    GoogleMeetMeetingService,
    MeetingInvitationsService,
    MeetingTemplatesService,
  ],
  exports: [
    MeetingsService
  ]
})
export class MeetingsModule { }