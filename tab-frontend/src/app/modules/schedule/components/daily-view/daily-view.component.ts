import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CalendarUtilsService } from '../../services/calendar-utils.service';
import { CalendarDay } from '../../models/meeting.model';
import { Meeting } from '../../../meetings/models/meeting';
import { MeetingService } from '../../../meetings/services/meeting.service';
import { ScheduleService } from '../../services/schedule-services';
import { ScheduleDefaultSettingsService } from '../../services/schedule-default-settings.service';
import { environment } from '../../../../../environments/environment';
import { TimeFrame } from '../../models/scheduled-meeting';
import { Subject, take, takeUntil } from 'rxjs';
import { PlanningPerspectiveOption, ScheduleDefaultSettings } from '../../models/schedule-default-settings';
import { planningPerspectiveMapping } from '../../models/planning-perspective-mapping';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';

@Component({
  selector: 'app-daily-view',
  templateUrl: './daily-view.component.html',
  styleUrl: './daily-view.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyViewComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('dayGrid') dayGridRef!: ElementRef<HTMLDivElement>;
  @Input() currentDate: Date = new Date()
  @Output() onMeetingClick = new EventEmitter<Meeting>();

  dayData!: CalendarDay;
  timeSlots: Date[] = [];
  slotDuration: number = 60;

  selectedDate: Date = new Date();
  selectedDayMeetings: Meeting[] = [];
  userId = sessionStorage.getItem(`${environment.storage.userId}`);
  availableTimeFrames: TimeFrame[] = [];
  scheduledMeetings: Meeting[] = [];

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
  timeSlotHeight = 80; 
  updateInterval: any;
  slotMeetingsMap = new Map<number, { meetings: Meeting[]; status: 'free' | 'booked' | 'unavailable' }>();

  protected _onDestroy = new Subject<void>();

  constructor(private calendarService: CalendarUtilsService,
    private scheduleSettingService: ScheduleDefaultSettingsService,
    private scheduleService: ScheduleService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private meetingService: MeetingService,
  ) { }

  ngOnInit(): void {
    this.generateCalendarInfo();
    this.updateCurrentTimeLine();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["currentDate"]) {
      this.loadDayData();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateCurrentTimeLine();
      this.scrollToCurrentTime();
      this.cdr.markForCheck();
    }, 300);
  }
  
  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this._onDestroy.next();
    this._onDestroy.complete();
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

      //this.getScheduledMeetings(this.userId);

      this.scheduleSettingService.availableTimeFrames$
        .pipe(take(1))
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
          this.loadDayData();
          this.loading = false;
          this.cdr.markForCheck();
        });
    }
  }

  private initializeSettings(settings: ScheduleDefaultSettings): void {
    const rawPerspective = settings?.defaultPlanningPerspectiveOption;

    this.planningPerspective = planningPerspectiveMapping[rawPerspective?.toLowerCase()] || PlanningPerspectiveOption.month;

    this.perspectiveEnd = this.scheduleService.getPerspectiveEnd(this.perspectiveStart, this.planningPerspective);
  }

  private getScheduledMeetings(userId: any) {
    console.log('getScheduledMeetings', userId);
    const email = this.authService.getCurrentUser()?.email;
    if (email) {
      this.meetingService.getSelectedDateMeetingsAsync(this.currentDate, true)
        .pipe(take(1)).subscribe({
          next: (data) => {
            console.log('Scheduled Meetings:', data);
            this.dayData.meetings = data;
            this.scheduledMeetings = data;
            this.prepareSlotMeetings();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error loading Scheduled Meetings', err);
            this.cdr.markForCheck();
          },
        });
    }
  }

  prepareSlotMeetings(): void {
    this.slotMeetingsMap.clear();

    if (!this.dayData) return;

    for (const slot of this.timeSlots) {
      const slotDateStart = new Date(this.dayData.date);
      slotDateStart.setHours(slot.getHours(), slot.getMinutes(), 0, 0);

      const slotDateEnd = new Date(slotDateStart.getTime() + this.slotTimeDuration * 60000);

      const meetingsForSlot = this.dayData.meetings?.filter(meeting => {
        const meetingStart = new Date(meeting.startTime);
        const meetingEnd = new Date(
          meeting.endTime ?? meetingStart.getTime() + this.slotTimeDuration * 60000
        );
        return meetingEnd > slotDateStart && meetingStart < slotDateEnd;
      }) ?? [];

      const status = this.getSlotStatus(slot);

      this.slotMeetingsMap.set(slot.getTime(), { meetings: meetingsForSlot, status });
    }
  }

  loadDayData(): void {
    this.getScheduledMeetings(this.userId);
    this.dayData = this.calendarService.getDayData(this.currentDate);
    console.log('Load dayData', this.dayData);
    this.cdr.markForCheck();
  }

  openMeetingLink(meeting: Meeting, event: MouseEvent): void {
    event.stopPropagation();
    const link = this.scheduleService.getMeetingLink(meeting);
    if (link) {
      window.open(link, '_blank'); 
    } else {
      console.warn('No meeting link available');
    }
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

  scrollToCurrentTime(): void {
    if (this.currentTimeTop > 0 && this.dayGridRef) {
      setTimeout(() => {
        const container = this.dayGridRef?.nativeElement;
        container.scrollTo({ 
          top: this.currentTimeTop - 100, 
          behavior: 'smooth' 
        });
        this.cdr.markForCheck();
      }, 0);
    }
  }

  private updateCurrentTimeLine(): void {
    const now = new Date();

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

  getSlotStatus(slotTime: Date): "free" | "booked" | "unavailable" {
    if(this.dayData === null) {
      return "unavailable";
    }
    const slotDateStart = new Date(this.dayData.date);
    slotDateStart.setHours(slotTime.getHours(), slotTime.getMinutes(), 0, 0);

    const slotDateEnd = new Date(slotDateStart.getTime() + this.slotTimeDuration * 60000); 

    const isWithinTimeFrame = this.dayData.timeFrames.some((tf) => {
      const [startHour, startMinute] = tf.startTime.split(':').map(Number);
      const [endHour, endMinute] = tf.endTime.split(':').map(Number);

      const frameStart = new Date(this.dayData.date);
      frameStart.setHours(startHour, startMinute, 0, 0);

      const frameEnd = new Date(this.dayData.date);
      frameEnd.setHours(endHour, endMinute, 0, 0);

      return slotDateEnd > frameStart && slotDateStart < frameEnd;
    });

    if (!isWithinTimeFrame) return "unavailable";

    const hasMeeting = this.dayData.meetings.some((meeting) => {
      const meetingStart = new Date(meeting.startTime);
      const meetingEnd = new Date(meeting.endTime || meetingStart.getTime() + this.slotTimeDuration * 60000);

      return meetingEnd > slotDateStart && meetingStart < slotDateEnd;
    });

    return hasMeeting ? "booked" : "free";
  }

  getMeetingForSlot(slotTime: Date): Meeting | null {
    if (!this.dayData || !this.dayData.meetings?.length) {
      return null;
    }

    const slotStartMinutes = slotTime.getHours() * 60 + slotTime.getMinutes();
    const slotEndMinutes = slotStartMinutes + this.slotTimeDuration;

    const meeting = this.dayData.meetings.find((m) => {
      const meetingStart = new Date(m.startTime);

      const meetingEnd = new Date(m.endTime || meetingStart.getTime() + this.slotTimeDuration * 60000);

      const meetingStartMinutes = meetingStart.getHours() * 60 + meetingStart.getMinutes();
      const meetingEndMinutes = meetingEnd.getHours() * 60 + meetingEnd.getMinutes();

      return meetingStartMinutes < slotEndMinutes && meetingEndMinutes > slotStartMinutes;
    });

    return meeting || null;
  }

  getMeetingHeight(meeting: Meeting): number {
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime || start.getTime() + 30 * 60000);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const slots = durationMinutes / 60;
    return slots * 80 - 2;
  }

  getMeetingTopOffset(meeting: Meeting, slot: Date): number {
    const slotStartMinutes = slot.getHours() * 60 + slot.getMinutes();
    const meetingStartMinutes = new Date(meeting.startTime).getHours() * 60 + new Date(meeting.startTime).getMinutes();
    const pixelsPerMinute = this.timeSlotHeight / this.slotTimeDuration;
    return (meetingStartMinutes - slotStartMinutes) * pixelsPerMinute;
  }

  formatTime(date: Date): string {
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
}
