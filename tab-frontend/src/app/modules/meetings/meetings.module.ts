import { CommonModule } from '@angular/common';
import { NgModule, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { GeneralModule } from '../general/general.module';
import { DatepickerComponent } from './components/datepicker/datepicker.component';
import { MeetingBookingRequestFormComponent } from './components/meeting-booking-request-form/meeting-booking-request-form.component';
import { MeetingScheduleNewComponent } from './components/meeting-schedule-new/meeting-schedule-new.component';
import { MeetingTimeSlotsComponent } from './components/meeting-time-slots/meeting-time-slots.component';
import { ScheduleDemoWrapperComponent } from './components/schedule-demo-wrapper/schedule-demo-wrapper.component';
import { BookingScheduleComponent } from './components/schedule/schedule.component';
import { MeetingRequestFormComponent } from './components/meeting-request-form/meeting-request-form.component';
import { MeetingScheduleComponent } from './components/meeting-schedule/meeting-schedule.component';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';

const routes: Routes = [
  { 
    path: 'user/:userId', 
    component: BookingScheduleComponent,
    canActivate: [AuthGuardService] 
  },
  { 
    path: 'event/:bookingToken', 
    component: BookingScheduleComponent,
    canActivate: [AuthGuardService] 
  },
  { 
    path: environment.routes.demo, 
    component: ScheduleDemoWrapperComponent 
  }
];

@NgModule({
  declarations: [
    DatepickerComponent,
    MeetingBookingRequestFormComponent,
    MeetingScheduleNewComponent,
    MeetingTimeSlotsComponent,
    BookingScheduleComponent,
    ScheduleDemoWrapperComponent,
    MeetingRequestFormComponent,
    MeetingScheduleComponent,
  ],
  exports: [
    DatepickerComponent,
    MeetingBookingRequestFormComponent,
    MeetingScheduleNewComponent,
    MeetingTimeSlotsComponent,
    BookingScheduleComponent,
    ScheduleDemoWrapperComponent,
    MeetingRequestFormComponent,
    MeetingScheduleComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatButtonToggleModule,
    MatExpansionModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    { 
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None 
    }
  ]
})
export class MeetingsModule { }
