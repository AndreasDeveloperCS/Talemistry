import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from "../../../../../environments/environment";
import { ContentService } from "../../../general/services/content.service";
import { DialogHelperService } from "../../../general/services/dialog-helper.service";
import { Meeting } from "../../../meetings/models/meeting";
import { CalendarView } from "../../models/meeting.model";
import { ThemeService } from "../../services/theme.service";
import { ScheduledMeetingInfoComponent } from "../scheduled-meeting-info/scheduled-meeting-info.component";

@Component({
  selector: "app-calendar-page",
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarPageComponent {
  currentView: CalendarView = "month";
  currentDate = new Date();
  isCreateMeetingOpen = false;
  selectedDate?: Date;
  selectedTime?: string;
  userID: string = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';

  constructor(
    private dialogHelper: DialogHelperService,
    public content: ContentService,
    public themeService: ThemeService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) { }

  setCurrentView(view: CalendarView) {
    this.currentView = view;
  }

  setCurrentDate(day: Date) {
    this.currentDate = day;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  handleCreateMeeting() {
    this.selectedDate = undefined;
    this.selectedTime = undefined;
    //this.isCreateMeetingOpen = true;
    this.router.navigate([environment.routes.recruitmentTab.schedule.bookMeeting], 
      { relativeTo: this.route }
    );
  }

  handleCreateMeetingForDate(date: Date) {
    this.selectedDate = date;
    this.selectedTime = undefined;
    //this.isCreateMeetingOpen = true;
    this.router.navigate([environment.routes.recruitmentTab.schedule.bookMeeting], 
      { relativeTo: this.route }
    );
  }

  handleCreateMeetingForDateTime(event: { date: Date; time: string }) {
    this.selectedDate = event.date;
    this.selectedTime = event.time;
    //this.isCreateMeetingOpen = true;
    this.router.navigate([environment.routes.recruitmentTab.schedule.bookMeeting], 
      { relativeTo: this.route }
    );
  }

  handleMeetingSubmit(meeting: Omit<Meeting, "id">) {
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
    this.dialogHelper.openDialog(ScheduledMeetingInfoComponent, () => {
      this.cdr.markForCheck();
     }, 
      { data: meeting, panelClass: 'panel-class-dialog' }
    );
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
