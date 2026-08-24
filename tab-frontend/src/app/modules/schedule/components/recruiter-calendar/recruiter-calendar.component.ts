import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CalendarUtilsService } from '../../services/calendar-utils.service';
import { TimeFrame } from '../../models/scheduled-meeting';
import { ScheduleDefaultSettingsService } from '../../services/schedule-default-settings.service';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { Meeting } from '../../../meetings/models/meeting';
import { ScheduledMeetingInfoComponent } from '../scheduled-meeting-info/scheduled-meeting-info.component';

@Component({
  selector: 'app-recruiter-calendar',
  templateUrl: './recruiter-calendar.component.html',
  styleUrl: './recruiter-calendar.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruiterCalendarComponent {
  activeView: "week" | "day" = "week"
  currentDate: Date = new Date()

  constructor(
    public calendarService: CalendarUtilsService,
    private scheduleSettingService: ScheduleDefaultSettingsService,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private dialogHelper: DialogHelperService,
  ) {}

  handleMeetingClick(meeting: any) {
    console.log("Meeting clicked:", meeting);
    this.dialogHelper.openDialog(ScheduledMeetingInfoComponent, () => {
      this.cdr.markForCheck();
     }, 
      { data: meeting, panelClass: 'panel-class-dialog' });
  }

  openAddTimeSlotForm(): void {
    this.scheduleSettingService.openTimeSlotForm(
      false,
      this.currentDate,
      { startDate: this.currentDate },
      (timeFrameModel: TimeFrame) => {
        console.log('Saved (Add)', timeFrameModel);
      }
    );
  }

  setView(view: "week" | "day"): void {
    this.activeView = view;
  }

  goToPreviousWeek(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() - 7);
    this.currentDate = newDate;
  }

  goToNextWeek(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + 7);
    this.currentDate = newDate;
  }

  goToToday(): void {
    this.currentDate = new Date();
  }

  goToPreviousDay(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() - 1);
    this.currentDate = newDate;
  }

  goToNextDay(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + 1);
    this.currentDate = newDate;
  }
}
