import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { addDays } from 'date-fns';
import { format } from 'date-fns-tz';
import { Subject, take, takeUntil } from 'rxjs';
import { CalendarDay } from '../../../schedule/models/meeting.model';
import { planningPerspectiveMapping } from '../../../schedule/models/planning-perspective-mapping';
import { PlanningPerspectiveOption, ScheduleDefaultSettings } from '../../../schedule/models/schedule-default-settings';
import { TimeFrame } from '../../../schedule/models/scheduled-meeting';
import { CalendarUtilsService } from '../../../schedule/services/calendar-utils.service';
import { ScheduleDefaultSettingsService } from '../../../schedule/services/schedule-default-settings.service';
import { ScheduleService } from '../../../schedule/services/schedule-services';
import { Meeting } from '../../models/meeting';
import { MeetingService } from '../../services/meeting.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';

@Component({
  selector: 'app-datepicker',
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatepickerComponent implements OnInit, OnDestroy {
  @Input()
  userId: string = '';

  @Input()
  timezone!: any;

  @Input()
  selectedDate!: Date;

  @Output() dateSelected = new EventEmitter<Date>();

  protected _onDestroy = new Subject<void>();
  availableTimeFrames: TimeFrame[] = [];
  scheduledMeetings: Meeting[] = [];
  today = new Date();
  calendarDays: CalendarDay[] = [];
  loading: boolean = true;
  isDefaultCalendarView: boolean = true;
  currentDate = new Date();
  planningPerspective!: PlanningPerspectiveOption;
  perspectiveStart: Date = new Date();
  perspectiveEnd: Date = new Date();
  calendarOwnerTimezone: any;
  weekDays: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


  get month() {
    return this.currentDate.getMonth();
  }

  get year() {
    return this.currentDate.getFullYear();
  }

  get monthName() {
    return this.currentDate.toLocaleString('en-US', { month: 'long' });
  }

  get daysInMonth(): number[] {
    const days = new Date(this.year, this.month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  }

  get firstDayOfWeek(): number {
    return new Date(this.year, this.month, 1).getDay();
  }

  constructor(
    private scheduleSettingService: ScheduleDefaultSettingsService,
    private scheduleService: ScheduleService,
    private authService: AuthService,
    private meetingService: MeetingService,
    private cdr: ChangeDetectorRef,
    private calendarUtils: CalendarUtilsService
  ) { }

  ngOnInit() {
    console.log('Filtered time frames', this.availableTimeFrames);
    if (this.userId) {
      this.isDefaultCalendarView = false;
      this.loading = true;

      this.scheduleSettingService.getByIdAsync(this.userId, true)
        .pipe(take(1))
        .subscribe((settings: any) => {
          this.initializeSettings(settings);
          this.cdr.markForCheck();
        });

      this.scheduleSettingService.loadTimeFrames(this.userId);

      this.getScheduledMeetings(this.userId);

      this.scheduleSettingService.availableTimeFrames$
        .pipe(takeUntil(this._onDestroy))
        .subscribe(frames => {
          if (frames?.length > 0) {
            this.availableTimeFrames = frames;
            this.loading = false;
          }

          this.calendarDays = this.scheduleService
            .loadCalendarDays(this.currentDate, this.perspectiveStart, this.perspectiveEnd, 
            this.availableTimeFrames, this.scheduledMeetings);
          this.predefineSelectedDay();
          this.cdr.markForCheck();
        });
    } else {
      this.isDefaultCalendarView = true;
      this.cdr.markForCheck();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDate'] && changes['selectedDate'].currentValue) {
      this.selectedDate = changes['selectedDate'].currentValue;
      const day = this.calendarDays.find(d => this.isSameDate(d.date, this.selectedDate));

      if (day) {
        this.selectedDate = day.date;
      }
      this.cdr.markForCheck();
    }
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  isSameDate(d1: Date, d2: Date | null | undefined): boolean {
    if (!d1 || !d2) {
      return false;
    }
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  private getScheduledMeetings(userId: any) {
    const { startDate, endDate } = this.calendarUtils.getCalendarRange(this.currentDate);
    const email = this.authService.getCurrentUser()?.email;

    if (email) {
      this.meetingService.getMeetingsByRangeAsync(new Date(), endDate)
        .pipe(take(1)).subscribe({
          next: (data) => {
            console.log('Scheduled Meetings:', data);
            this.scheduledMeetings = data;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error loading Scheduled Meetings', err);
            this.cdr.markForCheck();
          },
        });
    }
  }

  predefineSelectedDay() {
    const todayIndex = this.calendarDays.findIndex(day => day.isToday);
    if (todayIndex !== -1) {
      const availableDay = this.calendarDays.slice(todayIndex).find(day => day.timeFrames.length > 0);

      if (availableDay) {
        this.selectDate(availableDay);
      } else {
        console.warn('No available days found starting from today');
      }
    }
  }

  private initializeSettings(settings: ScheduleDefaultSettings): void {
    const rawPerspective = settings?.defaultPlanningPerspectiveOption;
    this.calendarOwnerTimezone = settings?.calendarTimeZone;
    this.planningPerspective = planningPerspectiveMapping[rawPerspective?.toLowerCase()] || PlanningPerspectiveOption.month;
    this.perspectiveEnd = this.scheduleService.getPerspectiveEnd(this.perspectiveStart, this.planningPerspective);
  }

  navigateMonth(direction: 'prev' | 'next') {
    const newDate = new Date(this.currentDate);
    if (direction === 'prev') {
      newDate.setMonth(this.currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(this.currentDate.getMonth() + 1);
    }
    this.currentDate = newDate;
    this.calendarDays = this.scheduleService
      .loadCalendarDays(this.currentDate, this.perspectiveStart, this.perspectiveEnd, 
      this.availableTimeFrames, this.scheduledMeetings);
    this.cdr.markForCheck();
  }

  selectDateNumber(day: number) {
    if (!this.isPastDateNumber(day)) {
      this.selectedDate = new Date(this.year, this.month, day);
      this.dateSelected.emit(this.selectedDate);
    }
  }

  selectDate(day: CalendarDay) {
    this.setDate(day);
    this.dateSelected.emit(this.selectedDate);
  }

  setDate(day: CalendarDay) {
    if (this.isPastDate(day.date)) {
      return;
    }

    this.selectedDate = day.date;

    const prevDay = this.calendarDays.find(d =>
      format(d.date, 'yyyy-MM-dd') ===
      format(addDays(day.date, -1), 'yyyy-MM-dd')
    );

    const nextDay = this.calendarDays.find(d =>
      format(d.date, 'yyyy-MM-dd') ===
      format(addDays(day.date, 1), 'yyyy-MM-dd')
    );

    const combinedTimeFrames: TimeFrame[] = [
      ...(prevDay?.timeFrames ?? []),
      ...(day.timeFrames ?? []),
      ...(nextDay?.timeFrames ?? [])
    ];

    this.scheduleService.setTimeFrames(combinedTimeFrames);
  }

  isSelectedDateNumber(day: number): boolean {
    if (!this.selectedDate) {
      return false;
    }
    return (
      this.selectedDate.getDate() === day &&
      this.selectedDate.getMonth() === this.month &&
      this.selectedDate.getFullYear() === this.year
    );
  }

  isSelectedDate(day: CalendarDay): boolean {
    if (!this.selectedDate) return false;
    return this.selectedDate === day.date;
  }

  isPastDateNumber(day: number): boolean {
    const selected = new Date(this.year, this.month, day);
    return selected < new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
  }

  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }

  isPrevMonthDisabled(): boolean {
    return (
      this.year < this.today.getFullYear() ||
      (this.year === this.today.getFullYear() && this.month <= this.today.getMonth())
    );
  }
}