import { Module } from '@nestjs/common';
import { InterviewRoomGateway } from './gateways/interview-room.gateway';
import { VideoModule } from '../video/video.module';

@Module({
  imports: [
    //CommonModule
    VideoModule
  ],
  providers: [
    //InterviewRoomGateway
  ],
  exports: [
    //InterviewRoomGateway
  ]
})
export class InterviewsModule { }
