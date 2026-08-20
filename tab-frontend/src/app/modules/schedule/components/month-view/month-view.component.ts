import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Router } from "@angular/router";
import { take } from "rxjs";
import { AuthService } from "src/app/modules/authentication/services/auth.service";
import { MeetingInvitationsService } from "src/app/modules/meeting-invitations/services/meeting-invitations.service";
import { environment } from "../../../../../environments/environment";
import { ContentService } from "../../../general/services/content.service";
import { Meeting } from "../../../meetings/models/meeting";
import { MeetingService } from "../../../meetings/services/meeting.service";
import { CalendarDay } from "../../models/meeting.model";
import { CalendarUtilsService } from "../../services/calendar-utils.service";
import { ScheduleService } from "../../services/schedule-services";

@Component({
  selector: "app-month-view",
  templateUrl: './month-view.component.html',
  styleUrl: './month-view.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonthViewComponent implements OnInit {
  @Input() currentDate: Date = new Date();

  @Output() onDateChange = new EventEmitter<Date>();
  @Output() onCreateMeeting = new EventEmitter<void>();
  @Output() onCreateMeetingForDate = new EventEmitter<Date>();
  @Output() onMeetingClick = new EventEmitter<any>();

  calendarDays: CalendarDay[] = [];
  weekDays: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  userId = sessionStorage.getItem(`${environment.storage.userId}`);
  selectedDay: CalendarDay | null = null;
  timezone!: any;

  constructor(
    private calendarUtils: CalendarUtilsService,
    public content: ContentService,
    private scheduleService: ScheduleService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private meetingService: MeetingService,
    private meetingInvitationService: MeetingInvitationsService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.populateCalendar(this.currentDate);
    //this.deleteMeetingInvitation('69fa0cc60c6ad462612e08f6');
  }

  private populateCalendar(currentDate: Date): void {
    const { startDate, endDate } = this.calendarUtils.getCalendarRange(currentDate);

    if(this.userId) {
      this.getScheduledMeetings(this.userId, startDate, endDate);
    }
    this.cdr.markForCheck();
  }

  private getScheduledMeetings(userId: any, startDate: Date, endDate: Date) {
    const email = this.authService.getCurrentUser()?.email;
    if (email) {
      this.meetingService.getMeetingsByRangeAsync(startDate, endDate, true)
        .pipe(take(1)).subscribe({
          next: (data: Meeting[]) => {

            this.calendarDays = this.scheduleService.loadScheduledMeetings(this.currentDate, data);
            const today = new Date();
            const todayCell = this.calendarDays.find(day =>
              day.date.toDateString() === today.toDateString() && day.isCurrentMonth
            );
            if (todayCell) {
              this.selectedDay = todayCell;
              this.onDateChange.emit(todayCell.date); 
            }
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error loading Scheduled Meetings', err);
            this.cdr.markForCheck();
          },
      });
    }
  }

  deleteMeeting(id: string) {
    if (this.userId) {
      this.meetingService.deleteAsync(id, true, false)
        .pipe(take(1)).subscribe({
          next: () => {
            console.log('Meeting with 695638c40f43671e50118113 was deleted');
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error deleting meeting', err);
            this.cdr.markForCheck();
          },
      });
    }
  }

  deleteMeetingInvitation(id: string) {
    if (this.userId) {
      this.meetingInvitationService.deleteAsync(id, true, false)
        .pipe(take(1)).subscribe({
          next: () => {
            console.log('Meeting invitation with 695638c40f43671e50118113 was deleted');
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error deleting meeting', err);
            this.cdr.markForCheck();
          },
      });
    }
  }

  navigateMonth(direction: "prev" | "next") {
    const newDate = new Date(this.currentDate);
    if (direction === "prev") {
      newDate.setMonth(this.currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(this.currentDate.getMonth() + 1);
    }
    this.onDateChange.emit(newDate);

    this.populateCalendar(newDate);
  }

  onDayClick(day: CalendarDay) {
    if (!day.isCurrentMonth) return; 
    this.selectedDay = day;
    this.onDateChange.emit(day.date);
  }

  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }

  openNewMeetingDialog() {
    this.router.navigate(['/schedule/user/']);
  }
}