import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { GeneralModule } from '../general/general.module';
import { CommunicationComponent } from './components/communication/communication.component';
import { InterviewCallComponent } from './components/interview-call/interview-call.component';
import { InterviewsComponent } from './components/interviews/interviews.component';
import { TextChatComponent } from './components/text-chat/text-chat.component';
import { VideoChatComponent } from './components/video-chat/video-chat.component';
import { VideoInterviewComponent } from './components/video-interview/video-interview.component';
import { VideoRoomFormComponent } from './components/video-room-form/video-room-form.component';
import { VideoRoomsComponent } from './components/video-rooms/video-rooms.component';
import { VideoInterviewService } from './services/video-interview.service';
import { SunSpinnerComponent } from '../general/components/sun-spinner/sun-spinner.component';

const routes: Routes = [
  {
    path: '',
    component: CommunicationComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: environment.routes.communication.interviews,
        component: VideoInterviewComponent,
        //component: InterviewCallComponent,
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.communication.textChat,
        component: TextChatComponent,
        data: {
          reuseComponent: 'communication-text-chat',
          cacheComponent: 'communication-text-chat',
        },
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.communication.videoChat,
        component: VideoRoomsComponent,
        canActivate: [AuthGuardService]
      },
      {
        path: `${environment.routes.communication.room}/:id`,
        redirectTo: `${environment.routes.communication.room}/:id/${environment.routes.communication.textChat}`,
        pathMatch: 'full'
      },
      {
        path: `${environment.routes.communication.room}/:id/${environment.routes.communication.textChat}`,
        component: TextChatComponent,
        data: {
          reuseComponent: 'communication-text-chat',
          cacheComponent: 'communication-text-chat',
        },
        canActivate: [AuthGuardService]
      },
      {
        path: `${environment.routes.communication.room}/:id/${environment.routes.communication.videoChat}`,
        component: VideoChatComponent,
        data: {
          reuseComponent: 'communication-live-video-chat',
          cacheComponent: 'communication-live-video-chat',
        },
        canActivate: [AuthGuardService]
      },
      {
        path: `${environment.routes.communication.videoChat}/:id`,
        redirectTo: `${environment.routes.communication.room}/:id/${environment.routes.communication.videoChat}`,
        pathMatch: 'full'
      },
      // {
      //   path: environment.routes.communication.videoInterview,
      //   component: VideoInterviewComponent,
      //   canActivate: [AuthGuardService]
      // },
      // {
      //   path: `${environment.routes.communication.videoInterview}/:id`,
      //   component: VideoInterviewComponent,
      //   canActivate: [AuthGuardService]
      // },
    ]
  },
  { path: '', redirectTo: environment.routes.communication.textChat, pathMatch: 'full' },
];
@NgModule({
  declarations: [
    InterviewCallComponent,
    TextChatComponent,
    VideoChatComponent,
    CommunicationComponent,
    InterviewsComponent,
    VideoRoomsComponent,
    VideoRoomFormComponent,
    VideoInterviewComponent,
  ],
  exports: [
    InterviewCallComponent,
    TextChatComponent,
    VideoChatComponent,
    CommunicationComponent,
    InterviewsComponent,
    VideoRoomsComponent,
    VideoRoomFormComponent,
    VideoInterviewComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatIconModule,
    SunSpinnerComponent,
    RouterModule.forChild(routes)
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
    , VideoInterviewService
  ]
})
export class InterviewsModule { }
