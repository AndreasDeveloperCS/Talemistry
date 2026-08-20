import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CalendarView } from "../../models/meeting.model";
import { MeetingsService } from "../../services/meetings.service";
import { ThemeService } from "../../services/theme.service";
import { ContentService } from '../../../general/services/content.service';
import { Meeting } from '../../../meetings/models/meeting';

@Component({
  selector: 'app-schedule-management',
  templateUrl: './schedule-management.component.html',
  styleUrl: './schedule-management.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleManagementComponent {
  currentView: CalendarView = "month";
  currentDate = new Date();
  isCreateMeetingOpen = false;
  selectedDate?: Date;
  selectedTime?: string;

  constructor(
    public content: ContentService,
    public themeService: ThemeService,
  ) { }

  setCurrentView(view: CalendarView) {
    this.currentView = view;
  }

  setCurrentDate(date: Date) {
    this.currentDate = date;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  handleCreateMeeting() {
    this.selectedDate = undefined;
    this.selectedTime = undefined;
    this.isCreateMeetingOpen = true;
  }

  handleCreateMeetingForDate(date: Date) {
    this.selectedDate = date;
    this.selectedTime = undefined;
    this.isCreateMeetingOpen = true;
  }

  handleCreateMeetingForDateTime(event: { date: Date; time: string }) {
    this.selectedDate = event.date;
    this.selectedTime = event.time;
    this.isCreateMeetingOpen = true;
  }

  handleMeetingSubmit(meeting: Omit<Meeting, "id">) {
    //this.meetingsService.addMeeting(meeting);
    this.isCreateMeetingOpen = false;
    this.selectedDate = undefined;
    this.selectedTime = undefined;
  }

  handleMeetingCancel() {
    this.isCreateMeetingOpen = false;
    this.selectedDate = undefined;
    this.selectedTime = undefined;
  }

  handleMeetingClick(meeting: Meeting) {
    console.log("Meeting clicked:", meeting);
  }

  handleModalBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.handleMeetingCancel();
    }
  }

  getDialogTitle(): string {
    let title = "Create New Meeting";
    if (this.selectedDate) {
      const dateStr = this.selectedDate.toLocaleDateString();
      if (this.selectedTime) {
        const timeStr = new Date(`2000-01-01T${this.selectedTime}`).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        title += ` for ${dateStr} at ${timeStr}`;
      } else {
        title += ` for ${dateStr}`;
      }
    }
    return title;
  }
}