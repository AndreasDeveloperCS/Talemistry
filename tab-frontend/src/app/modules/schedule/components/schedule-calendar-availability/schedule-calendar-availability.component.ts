import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { environment } from "../../../../../environments/environment";
import { formatWeekdaysWithRanges, mergeDateAndTime } from "../../../../../shared-functions/shared-functions";
import { ContentService } from "../../../general/services/content.service";
import { RepeatPatternOption, ScheduleDay, TimeFrame } from "../../models/scheduled-meeting";
import { ScheduleDefaultSettingsService } from "../../services/schedule-default-settings.service";

@Component({
  selector: "app-schedule-calendar-availability",
  templateUrl: "./schedule-calendar-availability.component.html",
  styleUrl: "./schedule-calendar-availability.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleCalendarAvailabilityComponent implements OnInit, OnDestroy {
  @Input()
  userId!: string;

  selectedDate: Date = new Date();
  isFormOpen = false;
  editingTimeSlot?: TimeFrame;
  schedule: TimeFrame[] = [];
  selectedScheduleDay!: ScheduleDay;
  today = new Date();
  weekDays: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  userID: string = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  availableTimeFrames: TimeFrame[] = [];
  filteredTimeFrames: TimeFrame[] = [];

  protected _onDestroy = new Subject<void>();

  constructor(
    private scheduleSettingService: ScheduleDefaultSettingsService,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.scheduleSettingService.schedule$.pipe(takeUntil(this._onDestroy)).subscribe((schedule) => {
      this.schedule = schedule;
      this.updateSelectedDay();
      this.cdr.markForCheck();
    });

    this.scheduleSettingService.loadTimeFrames(this.userID);

    this.scheduleSettingService.availableTimeFrames$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(frames => {
        this.availableTimeFrames = frames;
        this.loadTimeFramesForSelectedDate(frames);
        this.cdr.markForCheck();
      });

    this.onDateSelect(new Date());
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  loadTimeFramesForSelectedDate(timeFrames: TimeFrame[]): void {
    console.log('loadTimeFramesForSelectedDate', timeFrames);

    this.filteredTimeFrames = timeFrames
      .filter(tf =>tf)
      .sort((a, b) => {
        const aDateTime = mergeDateAndTime(a.startDate, a.startTime);
        const bDateTime = mergeDateAndTime(b.startDate, b.startTime);
        const [aHours, aMinutes] = a.startTime.toString().split(':').map(Number);
        const [bHours, bMinutes] = b.startTime.toString().split(':').map(Number);

        return aDateTime.getTime() - bDateTime.getTime();
      });
  }

  get year(): number {
    return this.selectedDate.getFullYear();
  }

  get month(): number {
    return this.selectedDate.getMonth();
  }

  get daysInMonth(): number[] {
    const totalDays = new Date(this.year, this.month + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }

  get firstDayOfMonth(): number {
    return new Date(this.year, this.month, 1).getDay();
  }

  isPastDate(day: number): boolean {
    const selected = new Date(this.year, this.month, day);
    return selected < new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
  }

  onDateCustomSelect(year: any, month: any, dateNum: any) {
    const date = new Date(year, month, dateNum);
    this.selectedDate = date;
    console.log('selectedDate', this.selectedDate);
    this.loadTimeFramesForSelectedDate(this.availableTimeFrames);
    this.updateSelectedDay();
  }

  onDateSelect(date: Date): void {
    this.selectedDate = date;
    console.log('selectedDate', this.selectedDate);
    this.updateSelectedDay();
  }

  private updateSelectedDay(): void {
    //this.selectedScheduleDay.date = this.selectedDate;
    //this.selectedScheduleDay = this.schedule.find((day) => isSameDayNative(new Date(day.date), this.selectedDate));
  }
  
  updateIsFormOpen(event: any) {
    this.isFormOpen = event;
  }

  openAddTimeSlotForm(): void {
    this.scheduleSettingService.openTimeSlotForm(
      false,
      this.selectedDate,
      { startDate: this.selectedDate },
      (timeFrameModel: TimeFrame) => {
        console.log('Saved (Add)', timeFrameModel);
      }
    );
  }

  openEditTimeSlotForm(timeFrame: TimeFrame): void {
    this.scheduleSettingService.openTimeSlotForm(
      true,
      this.selectedDate,
      timeFrame,
      (timeFrameModel: TimeFrame) => {
        console.log('Saved (Edit)', timeFrameModel);
      }
    );
  }

  handleDeleteTimeSlot(timeSlotId: any): void {
    this.scheduleSettingService.deleteTimeSlot(this.selectedDate, timeSlotId);
  }

  hasCalendarAvailability(year: number, month: number, dateNum: number) {
    const requestedDate = new Date(year, month, dateNum);
    //console.log("Checking availability for date:", requestedDate);
    return this.scheduleSettingService.isDateAvailable(requestedDate);
  }

  // hasAvailability(date: Date): boolean {
  //   const requestedDate = date;
  //   return this.scheduleSettingService.isDateAvailable(requestedDate);
  // }

  formatDate(date: Date): string {
    return formatDateNative(date);
  }

  nextMonth(): void {
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();
    this.selectedDate = new Date(year, month + 1, 1);
  }

  previousMonth(): void {
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();
    this.selectedDate = new Date(year, month - 1, 1);
  }

  getRepeatPatternLabel(timeFrame: TimeFrame): string {

    const pattern = timeFrame.repeatPattern;

    switch (pattern) {

      case RepeatPatternOption.none:
        return "One time";

      case RepeatPatternOption.daily:
        return "Every day";

      case RepeatPatternOption.weekdaysEast:
        return "(Sunday - Thurthday)";

      case RepeatPatternOption.weekdaysWest:
        return "(Monday - Friday)";

      case RepeatPatternOption.weekly:
        return "Once per week";

      case RepeatPatternOption.monthly:
        return "Once per month";

      case RepeatPatternOption.fortnightly:
        return "Once per 2 weeks";

      case RepeatPatternOption.custom:
        return formatWeekdaysWithRanges(timeFrame.customPattern?.weekDays);

      default:
        return pattern;
    }
  }
}

function isSameDayNative(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
function formatDateNative(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}