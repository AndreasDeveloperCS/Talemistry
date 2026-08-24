import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { GeneralModule } from '../general/general.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { CalendarPageComponent } from './components/calendar-page/calendar-page.component';
import { DailyViewComponent } from './components/daily-view/daily-view.component';
import { DayViewComponent } from './components/day-view/day-view.component';
import { MeetingBookingWrapperComponent } from './components/meeting-booking-wrapper/meeting-booking-wrapper.component';
import { MeetingCardComponent } from './components/meeting-card/meeting-card.component';
import { MeetingFormComponent } from './components/meeting-form/meeting-form.component';
import { MeetingsListComponent } from './components/meetings-list/meetings-list.component';
import { MonthViewComponent } from './components/month-view/month-view.component';
import { RecruiterCalendarComponent } from './components/recruiter-calendar/recruiter-calendar.component';
import { ScheduleCalendarAvailabilityComponent } from './components/schedule-calendar-availability/schedule-calendar-availability.component';
import { ScheduleCalendarComponent } from './components/schedule-calendar/schedule-calendar.component';
import { ScheduleDashboardComponent } from './components/schedule-dashboard/schedule-dashboard.component';
import { ScheduleManagementComponent } from './components/schedule-management/schedule-management.component';
import { ScheduleSettingsComponent } from './components/schedule-settings/schedule-settings.component';
import { ScheduleTimeFramesSettingsComponent } from './components/schedule-time-frames-settings/schedule-time-frames-settings.component';
import { ScheduleComponent } from './components/schedule/schedule.component';
import { ThemeSwitcherComponent } from './components/theme-switcher/theme-switcher.component';
import { TimeFramesMonthViewComponent } from './components/time-frames-month-view/time-frames-month-view.component';
import { TimeFrameFormComponent } from './components/time-slot-form/time-slot-form.component';
import { ViewSwitcherComponent } from './components/view-switcher/view-switcher.component';
import { WeekViewComponent } from './components/week-view/week-view.component';
import { WeeklyViewComponent } from './components/weekly-view/weekly-view.component';

const routes: Routes = [
  {
    path: '',
    component: ScheduleComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: environment.routes.schedule.scheduleCalendar,
        component: CalendarPageComponent,
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.schedule.scheduleSchedule,
        // component: ScheduleManagementComponent,
        component: RecruiterCalendarComponent,
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.schedule.scheduleSettings,
        component: ScheduleSettingsComponent,
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.schedule.calendarBookMeeting,
        component: MeetingBookingWrapperComponent,
        canActivate: [AuthGuardService],
      }
    ]
  },
  { path: '', redirectTo: environment.routes.schedule.scheduleCalendar, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    ScheduleCalendarComponent,
    ViewSwitcherComponent,
    MeetingFormComponent,
    CalendarPageComponent,
    ScheduleComponent,
    TimeFrameFormComponent,
    WeekViewComponent,
    DayViewComponent,
    MonthViewComponent,
    MeetingCardComponent,
    MeetingsListComponent,
    ScheduleCalendarAvailabilityComponent,
    ScheduleManagementComponent,
    ScheduleSettingsComponent,
    ThemeSwitcherComponent,
    ScheduleTimeFramesSettingsComponent,
    TimeFramesMonthViewComponent,
    ScheduleDashboardComponent,
    MeetingBookingWrapperComponent,
    //ScheduledMeetingInfoComponent,
    DailyViewComponent,
    WeeklyViewComponent,
    RecruiterCalendarComponent,
  ],
  exports: [
    ScheduleCalendarComponent,
    ViewSwitcherComponent,
    MeetingFormComponent,
    CalendarPageComponent,
    ScheduleComponent,
    TimeFrameFormComponent,
    WeekViewComponent,
    DayViewComponent,
    MonthViewComponent,
    MeetingCardComponent,
    MeetingsListComponent,
    ScheduleCalendarAvailabilityComponent,
    ScheduleManagementComponent,
    ScheduleSettingsComponent,
    ThemeSwitcherComponent,
    ScheduleTimeFramesSettingsComponent,
    TimeFramesMonthViewComponent,
    ScheduleDashboardComponent,
    MeetingBookingWrapperComponent,
    //ScheduledMeetingInfoComponent,
    DailyViewComponent,
    WeeklyViewComponent,
    RecruiterCalendarComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    MatIconModule,
    MatTabsModule,
    FormsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatExpansionModule,
    MeetingsModule,
    MatTabsModule,
    MatMenuModule,
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
  ]
})
export class ScheduleModule { }
