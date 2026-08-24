import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Subject, take, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Meeting } from '../../../meetings/models/meeting';
import { SlotPeriod } from '../../../meetings/models/schedule';
import { MeetingService } from '../../../meetings/services/meeting.service';
import { CalendarDay } from '../../models/meeting.model';
import { planningPerspectiveMapping } from '../../models/planning-perspective-mapping';
import { PlanningPerspectiveOption, ScheduleDefaultSettings } from '../../models/schedule-default-settings';
import { TimeFrame } from '../../models/scheduled-meeting';
import { CalendarUtilsService } from '../../services/calendar-utils.service';
import { ScheduleDefaultSettingsService } from '../../services/schedule-default-settings.service';
import { ScheduleService } from '../../services/schedule-services';
import { format, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';

@Component({
  selector: 'app-weekly-view',
  templateUrl: './weekly-view.component.html',
  styleUrl: './weekly-view.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeeklyViewComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('weekGrid') weekGridRef!: ElementRef<HTMLDivElement>;

  @Input() currentDate: Date = new Date();
  @Output() onMeetingClick = new EventEmitter<Meeting>();

  weekDays: CalendarDay[] = [];
  selectedDate: Date = new Date();
  selectedDayMeetings: Meeting[] = [];
  timeSlots: Date[] = [];
  userId = sessionStorage.getItem(`${environment.storage.userId}`);
  availableTimeFrames: TimeFrame[] = [];
  scheduledMeetings: Meeting[] = [];
  slotDuration: number = 60;

  today = new Date(); 
  calendarDays: CalendarDay[] = [];
  currentWeekLabel: string = '';
  loading: boolean = true;

  planningPerspective!: PlanningPerspectiveOption;
  perspectiveStart: Date = new Date();
  perspectiveEnd: Date = new Date();
  slotHeight: number = 60;
  slotTimeDuration: number = 60;

  currentTimeTop: number = 0;
  currentDayIndex: number | null = null;
  timeSlotHeight = 65; 
  updateInterval: any;
  weekSlotMeetingsMap = new Map<any, Map<number, { meetings: Meeting[]; status: 'free' | 'booked' | 'unavailable' }>>();

  protected _onDestroy = new Subject<void>();

  constructor(private calendarService: CalendarUtilsService,
    private scheduleSettingService: ScheduleDefaultSettingsService,
    private scheduleService: ScheduleService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private meetingService: MeetingService,
  ) { }

  ngOnInit() {
    this.generateCalendarInfo();
    this.updateInterval = setInterval(() => this.updateCurrentTimeLine(), 60000);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["currentDate"]) {
      this.selectedDate = new Date(this.currentDate);
      this.loadWeekData();
      this.updateSelectedDayMeetings();
      this.updateCurrentTimeLine();
    }
  }
  
  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  scrollToCurrentTime(): void {
    if (this.currentTimeTop > 0) {
      setTimeout(() => {
        const container = this.weekGridRef?.nativeElement;
        container.scrollTo({ top: this.currentTimeTop - 100, behavior: 'smooth' });
        this.cdr.markForCheck();
      }, 0);
    }
  }

  generateCalendarInfo() {
    if(this.userId) {
      this.scheduleSettingService.getByIdAsync(this.userId, true)
        .pipe(take(1))
        .subscribe((settings: any) => {
          // if(settings?.length > 0) {
            console.log('Settings', settings);
            this.initializeSettings(settings);
            this.cdr.markForCheck();
          // }
        });

      this.scheduleSettingService.loadTimeFrames(this.userId);

      this.getScheduledMeetings();

      this.scheduleSettingService.availableTimeFrames$
        .pipe(takeUntil(this._onDestroy))
        .subscribe(frames => {
          console.log('availableTimeFrames', frames);
          if(frames?.length > 0) {
            this.availableTimeFrames = frames;
          }

          this.calendarDays = this.scheduleService
            .loadCalendarDays(this.currentDate, this.perspectiveStart, this.perspectiveEnd, this.availableTimeFrames, this.scheduledMeetings);
          console.log('Calendar Days', this.calendarDays);
          this.calendarService.calendarData = this.calendarDays;
          this.generateTimeSlots();
          this.loadWeekData();
          this.updateSelectedDayMeetings();
          this.loading = false;
          this.cdr.markForCheck();
          //setTimeout(() => this.scrollToCurrentTime(), 0);
        });
    }
  }

  prepareWeekSlotMeetings(): void {
    this.weekSlotMeetingsMap.clear();

    for (const day of this.weekDays) {
      const dayMap = new Map<number, { meetings: Meeting[]; status: 'free' | 'booked' | 'unavailable' }>();

      for (const slot of this.timeSlots) {
        const slotDateStart = new Date(day.date);
        slotDateStart.setHours(slot.getHours(), slot.getMinutes(), 0, 0);
        const slotDateEnd = new Date(slotDateStart.getTime() + this.slotTimeDuration * 60000);

        // --- STATUS using your existing method
        const status = this.getSlotStatus(day, slot);

        // --- Multiple meetings in this slot
        const meetingsForSlot = day.meetings?.filter((meeting) => {
          const meetingStart = new Date(meeting.startTime);
          const meetingEnd = new Date(
            meeting.endTime ?? meetingStart.getTime() + this.slotTimeDuration * 60000
          );

          return meetingEnd > slotDateStart && meetingStart < slotDateEnd;
        }) ?? [];

        dayMap.set(slot.getTime(), { meetings: meetingsForSlot, status });
      }

      this.weekSlotMeetingsMap.set(day.date, dayMap);
    }
  }

  private updateCurrentTimeLine(): void {
    const now = new Date();

    this.currentDayIndex = this.weekDays.findIndex(
      d => d.date.toDateString() === now.toDateString()
    );

    if (this.currentDayIndex === -1) {
      this.currentDayIndex = null;
      return;
    }

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const startHour = 0; 
    const endHour = 23;  

    if (hours < startHour || hours >= endHour) {
      this.currentTimeTop = -1;
      return;
    }

    const totalMinutes = (hours - startHour) * 60 + minutes;

    const pixelsPerMinute = this.timeSlotHeight / 60; 
    this.currentTimeTop = totalMinutes * pixelsPerMinute;

    this.scrollToCurrentTime();
  }

  private getScheduledMeetings() {
    const { startOfWeek, endOfWeek } = this.calendarService.getWeekViewRange(this.currentDate);
    console.log('Calendar visible range:', startOfWeek, '→', endOfWeek);
    const email = this.authService.getCurrentUser()?.email;
    if (email) {
      this.meetingService.getMeetingsByRangeAsync(startOfWeek, endOfWeek, true)
        .pipe(take(1)).subscribe({
          next: (data) => {
            console.log('Scheduled Meetings:', data);
            this.scheduledMeetings = data;
            this.mapMeetingsToWeekDays();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error loading Scheduled Meetings', err);
            this.cdr.markForCheck();
          },
        });
    }
  }

  private mapMeetingsToWeekDays(): void {
    if (!this.weekDays || !this.scheduledMeetings) return;

    this.weekDays.forEach(day => day.meetings = []);

    this.scheduledMeetings.forEach(meeting => {
      const meetingDate = new Date(meeting.startTime);
      
      const day = this.weekDays.find(d =>
        d.date.getFullYear() === meetingDate.getFullYear() &&
        d.date.getMonth() === meetingDate.getMonth() &&
        d.date.getDate() === meetingDate.getDate()
      );

      if (day) {
        day.meetings.push(meeting);
      }
    });

    console.log('Week days with meetings mapped:', this.weekDays);
    this.prepareWeekSlotMeetings();
  }

  private initializeSettings(settings: ScheduleDefaultSettings): void {
    const rawPerspective = settings?.defaultPlanningPerspectiveOption;
    //this.slotDuration = settings?.defaultMeetingDuration / 60000;

    this.planningPerspective = planningPerspectiveMapping[rawPerspective?.toLowerCase()] || PlanningPerspectiveOption.month;

    this.perspectiveEnd = this.scheduleService.getPerspectiveEnd(this.perspectiveStart, this.planningPerspective);
  }

  loadWeekData(): void {
    this.weekDays = this.calendarService.getWeekDays(this.currentDate);
    console.log('Week days', this.weekDays);
    this.getScheduledMeetings();
    this.currentWeekLabel = this.getWeekRangeLabel();
  }

  openMeetingLink(meeting: Meeting): void {
    const link = this.scheduleService.getMeetingLink(meeting);
    if (link) {
      window.open(link, '_blank'); 
    } else {
      console.warn('No meeting link available');
    }
  }

  getWeekRangeLabel(): string {
    if (!this.weekDays?.length) return '';

    const start = this.weekDays[0].date;
    const end = this.weekDays[this.weekDays.length - 1].date;

    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (sameMonth && sameYear) {
      // Example: 5 – 11 October 2025
      return `${start.getDate()} – ${end.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    }

    if (!sameMonth && sameYear) {
      // Example: 29 September – 5 October 2025
      return `${start.getDate()} ${monthNames[start.getMonth()]} – ${end.getDate()} ${monthNames[end.getMonth()]} ${start.getFullYear()}`;
    }

    // Example: 29 December 2025 – 4 January 2026
    return `${start.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()} – ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
  }

  generateTimeSlots(): void {
    const slots: Date[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(24, 0, 0, 0);

    const slot = new Date(start);
    while (slot < end) {
      slots.push(new Date(slot));
      slot.setMinutes(slot.getMinutes() + this.slotDuration);
    }

    this.timeSlots = slots;
  }

  selectDate(date: Date): void {
    this.selectedDate = new Date(date);
    this.updateSelectedDayMeetings();
  }

  updateSelectedDayMeetings(): void {
    const day = this.weekDays.find((d) => d.date.toDateString() === this.selectedDate.toDateString());
    this.selectedDayMeetings = day?.meetings || [];
  }

  getSlotStatus(day: CalendarDay, slotTime: Date): "free" | "booked" | "unavailable" {
    const slotDateStart = new Date(day.date);
    slotDateStart.setHours(slotTime.getHours(), slotTime.getMinutes(), 0, 0);

    const slotDateEnd = new Date(slotDateStart.getTime() + this.slotTimeDuration * 60000); // each slot = 60 min

    const isWithinTimeFrame = day.timeFrames.some((tf) => {
      const [startHour, startMinute] = tf.startTime.split(':').map(Number);
      const [endHour, endMinute] = tf.endTime.split(':').map(Number);

      const frameStart = new Date(day.date);
      frameStart.setHours(startHour, startMinute, 0, 0);

      const frameEnd = new Date(day.date);
      frameEnd.setHours(endHour, endMinute, 0, 0);

      return slotDateEnd > frameStart && slotDateStart < frameEnd;
    });

    if (!isWithinTimeFrame) return "unavailable";

    const hasMeeting = day.meetings.some((meeting) => {
      const meetingStart = new Date(meeting.startTime);
      const meetingEnd = new Date(meeting.endTime || meetingStart.getTime() + this.slotTimeDuration * 60000);

      return meetingEnd > slotDateStart && meetingStart < slotDateEnd;
    });

    return hasMeeting ? "booked" : "free";
  }

  getMeetingForSlot(day: CalendarDay, slotTime: Date): Meeting | null {
    const slotStart = new Date(day.date);
    slotStart.setHours(slotTime.getHours(), slotTime.getMinutes(), 0, 0);

    const slotEnd = new Date(slotStart.getTime() + this.slotTimeDuration * 60000);

    const meeting = day.meetings.find((m) => {
      const meetingStart = new Date(m.startTime);
      const meetingEnd = new Date(m.endTime || meetingStart.getTime() + this.slotTimeDuration * 60000);
      return meetingEnd > slotStart && meetingStart < slotEnd;
    });

    if (meeting) {
      const meetingStart = new Date(meeting.startTime);
      if (meetingStart >= slotStart && meetingStart < slotEnd) {
        return meeting;
      }
    }

    return null;
  }

  getMeetingHeight(meeting: Meeting): number {
    const meetingStart = new Date(meeting.startTime);
    const meetingEnd = new Date(meeting.endTime || meetingStart.getTime() + this.slotTimeDuration * 60000);

    const durationMinutes = (meetingEnd.getTime() - meetingStart.getTime()) / 60000;
    const slotMinutes = this.slotTimeDuration;

    return (durationMinutes / slotMinutes) * this.slotHeight - 2;
  }

  getMeetingTopOffset(meeting: Meeting, slotTime: Date): number {
    const meetingStart = new Date(meeting.startTime);

    const meetingMinutes = meetingStart.getHours() * this.slotHeight + meetingStart.getMinutes();
    const slotMinutes = slotTime.getHours() * this.slotHeight + slotTime.getMinutes();

    const offsetMinutes = meetingMinutes - slotMinutes;

    const pixelsPerMinute = this.slotHeight / this.slotTimeDuration; 
    return offsetMinutes * pixelsPerMinute;
  }

  formatTime(date: Date): any {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  isToday(date: Date): boolean {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  isSelectedDate(date: Date): boolean {
    return date.toDateString() === this.selectedDate.toDateString()
  }

  getDayOfWeek(date: Date): string {
    return date.toLocaleDateString("en-US", { weekday: "short" })
  }

  getDayOfMonth(date: Date): number {
    return date.getDate()
  }

  isPastDay(day: CalendarDay): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0); 

    return dayDate < today;
  }
}
