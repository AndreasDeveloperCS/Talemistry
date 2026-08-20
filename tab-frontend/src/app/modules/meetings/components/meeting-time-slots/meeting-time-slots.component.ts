import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { format, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { Subject, take, takeUntil } from 'rxjs';
import { calendarLocalToUtc } from 'src/app/modules/general/utils/timezone.utils';
import { TimeSpan } from '../../../general/models/time-span';
import { ContentService } from '../../../general/services/content.service';
import { planningPerspectiveMapping } from '../../../schedule/models/planning-perspective-mapping';
import { PlanningPerspectiveOption, ScheduleDefaultSettings } from '../../../schedule/models/schedule-default-settings';
import { TimeFrame } from '../../../schedule/models/scheduled-meeting';
import { ScheduleDefaultSettingsService } from '../../../schedule/services/schedule-default-settings.service';
import { ScheduleService } from '../../../schedule/services/schedule-services';
import { Meeting } from '../../models/meeting';
import { AvailabilityTimeFrame, SlotPeriod, TimeSlot } from '../../models/schedule';
import { MeetingScheduleService } from '../../services/meeting-schedule.service';
import { MeetingService } from '../../services/meeting.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';

@Component({
  selector: 'app-meeting-time-slots',
  templateUrl: './meeting-time-slots.component.html',
  styleUrl: './meeting-time-slots.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingTimeSlotsComponent implements OnInit, OnDestroy {
  @Input()
  userId: string = '';

  @Input()
  selectedTime!: any;

  @Input()
  availableTimeSlots: TimeSlot[] = [];

  @Input()
  selectedTimeSlot!: TimeSlot;

  @Input()
  selectedDate: Date = new Date();

  @Input()
  selectedSlotPeriod: SlotPeriod = SlotPeriod.half;

  @Input()
  isScheduleInfoDefault: boolean = true;

  @Input()
  selectedTimezone!: any;

  @Output() timeSelected = new EventEmitter<string>();

  @Output() timezoneChanged = new EventEmitter<string>();

  protected _onDestroy = new Subject<void>();
  view: 'duration' | 'timeslot' = 'duration';
  defaultTimeFrameStart: string = '09:00';
  defaultTimeFrameEnd: string = '20:00';
  availableTimeFrames: AvailabilityTimeFrame[] = [];
  scheduledMeetings: Meeting[] = [];
  timeSlots: TimeSlot[] = [];
  timeFrames: TimeFrame[] = [];
  isFilteringTimeFrames: boolean = true;
  planningPerspective!: PlanningPerspectiveOption;
  perspectiveStart: Date = new Date();
  perspectiveEnd!: Date;
  selectedDuration!: any;
  currentUserTimezone!: any;
  calendarOwnerTimezone!: any;

  durations = [
    { time: SlotPeriod.quater, label: 'Quick Chat', icon: 'schedule', description: 'Perfect for brief introductions and quick updates.', popular: false },
    { time: SlotPeriod.half, label: 'Regular Meeting', icon: 'event', description: 'Great for most discussions and consultations.', popular: true },
    { time: SlotPeriod.threeQauters, label: 'Extended Discussion', icon: 'timer', description: 'Ideal for detailed planning and strategy sessions.', popular: false },
    { time: SlotPeriod.hour, label: 'Deep Dive', icon: 'hourglass_full', description: 'Comprehensive meetings for complex topics', popular: false },
    { time: SlotPeriod.twoHour, label: 'Workshop', icon: 'work', description: 'Amazing for workshops or planning sessions.', popular: false },
  ];

  constructor(private service: MeetingScheduleService,
    private meetingService: MeetingService,
    private scheduleService: ScheduleService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private scheduleSettingService: ScheduleDefaultSettingsService,
    public content: ContentService,
  ) { }

  ngOnInit(): void {
    this.selectedSlotPeriod = this.selectedSlotPeriod ? this.selectedSlotPeriod : SlotPeriod.half;
    this.currentUserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    this.scheduleSettingService.getByIdAsync(this.userId, true)
      .pipe(take(1))
      .subscribe((settings: any) => {
        this.initializeSettings(settings);
        this.cdr.markForCheck();
      }, () => {
        this.initializeSettings(undefined as any);
        this.cdr.markForCheck();
      });

    this.initialTimeSlotsPreparation(new Date());
    this.service.dateSelected
      .pipe(takeUntil(this._onDestroy))
      .subscribe((date: Date) => {
        this.isFilteringTimeFrames = true;
        this.selectedDate = date;
        this.timeFrames = this.scheduleService.getTimeFrames();
        this.initialTimeSlotsPreparation(this.selectedDate);
        if (this.userId && this.perspectiveEnd) {
          this.getScheduledMeetings(this.userId);
        }
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private initializeSettings(settings: ScheduleDefaultSettings): void {
    const rawPerspective = settings?.defaultPlanningPerspectiveOption;
    this.calendarOwnerTimezone = settings?.calendarTimeZone || this.selectedTimezone || this.currentUserTimezone;

    this.planningPerspective = planningPerspectiveMapping[rawPerspective?.toLowerCase()] || PlanningPerspectiveOption.month;

    this.perspectiveEnd = this.scheduleService.getPerspectiveEnd(this.perspectiveStart, this.planningPerspective);
    if (this.userId && this.perspectiveEnd) {
      this.getScheduledMeetings(this.userId);
    }
  }

  private getScheduledMeetings(userId: any) {
    const email = this.authService.getCurrentUser()?.email;
    if (email) {
      this.meetingService.getMeetingsByRangeAsync(this.selectedDate, this.perspectiveEnd, true)
        .pipe(take(1)).subscribe({
          next: (data) => {
            this.scheduledMeetings = data;
            this.initialTimeSlotsPreparation(this.selectedDate);
            this.filterTimeFramesByMeetings();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error loading Scheduled Meetings', err);
            this.cdr.markForCheck();
          },
        });
    }
  }

  initialTimeSlotsPreparation(date: Date) {
    this.populateAvailableTimeFrames(date);
    this.filterFramesByViewerDate(date);
    this.populateTimeSlotsGeneral(this.availableTimeFrames, this.selectedSlotPeriod);
    this.sortSlots();
  }

  private isValidDate(date: any): date is Date {
    return date instanceof Date && !isNaN(date.getTime());
  }

  private getDateRangeForTimezone(viewerDate: Date): Date[] {
    const viewerTz = this.selectedTimezone;
    const calendarTz = this.calendarOwnerTimezone;
    if (!this.isValidDate(viewerDate) || !viewerTz || !calendarTz) {
      return [];
    }

    const viewerDayStartUtc = fromZonedTime(`${format(viewerDate, 'yyyy-MM-dd')}T00:00:00`, viewerTz);
    const calendarStart = toZonedTime(viewerDayStartUtc, calendarTz);

    const dates: Date[] = [];

    for (let offset = -1; offset <= 1; offset++) {
      const d = new Date(calendarStart);
      d.setDate(d.getDate() + offset);
      d.setHours(0, 0, 0, 0);
      dates.push(d);
    }

    return dates;
  }

  private truncateFramesToViewerDay(viewerDate: Date) {
    if (!viewerDate) return;

    const viewerDayStart = new Date(viewerDate);
    viewerDayStart.setHours(0, 0, 0, 0);

    const viewerDayEnd = new Date(viewerDate);
    viewerDayEnd.setDate(viewerDayEnd.getDate() + 1);
    viewerDayEnd.setHours(0, 0, 0, 0);

    this.availableTimeFrames = this.availableTimeFrames
      .map(frame => {
        let start = frame.startTime;
        let end = frame.endTime;

        if (start < viewerDayStart) {
          start = viewerDayStart;
        }

        if (end > viewerDayEnd) {
          end = viewerDayEnd;
        }

        if (start >= end) {
          return null;
        }

        return { ...frame, startTime: start, endTime: end };
      })
      .filter(f => f !== null);
  }

  private populateAvailableTimeFrames(selectedDate: Date) {
    const calendarTz = this.calendarOwnerTimezone;
    const viewerTz = this.selectedTimezone;

    this.availableTimeFrames = [];

    const datesToCheck = this.getDateRangeForTimezone(selectedDate);

    if (!this.isScheduleInfoDefault) {

      for (const tf of this.timeFrames) {
        for (const date of datesToCheck) {
          if (!this.isFrameActiveOnCalendarDate(tf, date)) {
            continue;
          }
          const dateStr = format(date, 'yyyy-MM-dd');

          const utcStart = calendarLocalToUtc(dateStr, tf.startTime, calendarTz);
          let utcEnd = calendarLocalToUtc(dateStr, tf.endTime, calendarTz);

          if (utcEnd <= utcStart) {
            utcEnd.setUTCDate(utcEnd.getUTCDate() + 1);
          }

          const viewerStart = toZonedTime(utcStart, viewerTz);
          const viewerEnd = toZonedTime(utcEnd, viewerTz);

          const clipped = this.splitFrameByViewerDay(viewerStart, viewerEnd, selectedDate);

          if (!clipped) {
            continue;
          }

          this.availableTimeFrames.push({ slots: [], startTime: clipped.start, endTime: clipped.end });
        }
      }

      this.truncateFramesToViewerDay(selectedDate);
    } else {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const utcStart = calendarLocalToUtc(dateStr, this.defaultTimeFrameStart, calendarTz);

      const utcEnd = calendarLocalToUtc(dateStr, this.defaultTimeFrameEnd, calendarTz);

      this.availableTimeFrames = [{ slots: [], startTime: toZonedTime(utcStart, viewerTz), endTime: toZonedTime(utcEnd, viewerTz) }];
    }
  }

  private splitFrameByViewerDay(start: Date, end: Date, viewerDate: Date): { start: Date; end: Date } | null {

    const dayStart = new Date(viewerDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const finalStart = start < dayStart ? dayStart : start;
    const finalEnd = end > dayEnd ? dayEnd : end;

    if (finalStart >= finalEnd) {
      return null;
    }

    return { start: finalStart, end: finalEnd };
  }

  private isFrameActiveOnCalendarDate(frame: any, calendarDate: Date): boolean {
    const frameStartDate = new Date(frame.startDate);
    frameStartDate.setHours(0, 0, 0, 0);

    const target = new Date(calendarDate);
    target.setHours(0, 0, 0, 0);

    if (target < frameStartDate) {
      return false;
    }

    const day = target.getDay();

    switch (frame.repeatPattern) {
      case 'weekdays-west':
        return [1, 2, 3, 4, 5].includes(day);
      case 'weekdays-east':
        return [0, 1, 2, 3, 4].includes(day);
      case 'daily':
        return true;
      case 'weekly':
        return frameStartDate.getDay() === day;
      case 'monthly':
        return frameStartDate.getDate() === target.getDate();
      default:
        return false;
    }
  }

  private filterTimeFramesByMeetings(): void {
    if (!this.scheduledMeetings?.length) {
      return;
    }

    const viewerTz = this.selectedTimezone;

    const meetingsInViewerTz = this.scheduledMeetings
      .filter(meeting => meeting.startTime && meeting.endTime)
      .map(meeting => {
        return {
          start: toZonedTime(meeting.startTime!, viewerTz).getTime(),
          end: toZonedTime(meeting.endTime!, viewerTz).getTime(),
        };
      });

    this.timeSlots = this.timeSlots.filter(slot => {
      if (!slot.endTime) return true;

      const slotStart = slot.startTime.getTime();
      const slotEnd = slot.endTime.getTime();

      return !meetingsInViewerTz.some(meeting => {
        return slotStart < meeting.end && slotEnd > meeting.start;
      });
    });
  }

  onSlotPeriodChangeDiv(slot: SlotPeriod) {
    this.selectedSlotPeriod = slot;
    this.timeSlots.splice(0, this.timeSlots.length);

    if (this.selectedSlotPeriod == SlotPeriod.custom) {
      console.log('custom 3', this.selectedSlotPeriod);
    }
    this.populateTimeSlotsGeneral(this.availableTimeFrames, slot as SlotPeriod);
    this.sortSlots();
  }

  onSlotPeriodChange($event: any) {
    this.timeSlots.splice(0, this.timeSlots.length);

    if (this.selectedSlotPeriod == SlotPeriod.custom) {
      console.log('custom 3', this.selectedSlotPeriod);
    }
    this.populateTimeSlotsGeneral(this.availableTimeFrames, $event as SlotPeriod);
    this.sortSlots();
  }

  populateTimeSlotsGeneral(availableTimeFrames: AvailabilityTimeFrame[], selectedSlotPeriod: SlotPeriod) {
    switch (selectedSlotPeriod) {
      case SlotPeriod.quater:
        this.timeSlots = this.populateTimeSlots(availableTimeFrames, [15]);
        break;
      case SlotPeriod.half:
        this.timeSlots = this.populateTimeSlots(availableTimeFrames, [30, 15]);
        break;
      case SlotPeriod.threeQauters:
        this.timeSlots = this.populateTimeSlots(availableTimeFrames, [45, 30, 15]);
        break;
      case SlotPeriod.hour:
        this.timeSlots = this.populateTimeSlots(availableTimeFrames, [60, 45, 30, 15]);
        break;
      case SlotPeriod.twoHour:
        this.timeSlots = this.populateTimeSlots(availableTimeFrames, [120, 60, 45, 30, 15]);
        break;
      default:
        break;
    }

    this.deduplicateSlots();
    this.sortSlots();
    this.filterPastSlotsForToday(this.selectedDate);

    this.isFilteringTimeFrames = false;
  }

  private filterPastSlotsForToday(date: Date) {
    if (!this.timeSlots || this.timeSlots.length === 0) {
      return;
    }

    const now = this.getNowInSelectedTimezone();

    this.timeSlots = this.timeSlots.filter(slot => {
      const slotDate = slot.startTime;

      const isSameDay =
        slotDate.getFullYear() === this.selectedDate.getFullYear() &&
        slotDate.getMonth() === this.selectedDate.getMonth() &&
        slotDate.getDate() === this.selectedDate.getDate();

      if (!isSameDay) {
        return true;
      }

      return slotDate.getTime() > now.getTime();
    });
  }

  private getNowInSelectedTimezone(): Date {
    const now = new Date();
    const zonedNow = toZonedTime(now, this.selectedTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    return zonedNow;
  }

  populateTimeSlots(availableTimeFrames: AvailabilityTimeFrame[], minutes: number[]) {
    if (minutes.length == 0) {
      return [];
    }
    const timeSlots: TimeSlot[] = [];
    const slotMilliSeconds = this.convertMinutesToMilliseconds(minutes[0]);
    availableTimeFrames.forEach((timeFrame: AvailabilityTimeFrame) => {
      timeFrame.slots.splice(0, timeFrame.slots.length);
      let startTime = timeFrame.startTime;
      let endTimeMilliseconds = (timeFrame.startTime.getTime() + slotMilliSeconds)

      while (endTimeMilliseconds <= timeFrame.endTime.getTime()) {
        timeFrame.slots.push({
          startTime: startTime,
          endTime: new Date(endTimeMilliseconds),
          duration: new TimeSpan(slotMilliSeconds),
          isSelected: false
        });
        startTime = new Date(startTime.getTime() + slotMilliSeconds);
        endTimeMilliseconds = (startTime.getTime() + slotMilliSeconds)
      }

      timeSlots.push(...timeFrame.slots);
    });
    return timeSlots;
  }

  convertMinutesToMilliseconds(minutes: number) {
    return minutes * 60000;
  }

  onTimeSelect(time: any) {
    this.meetingService.validateAndEmit();
    this.timeSelected.emit(time);
  }

  onTimezoneChange(newTz: string) {
    this.currentUserTimezone = newTz;
    this.timezoneChanged.emit(newTz);
    this.cdr.markForCheck();
  }

  private filterFramesByViewerDate(viewerDate: Date) {
    const dayStart = new Date(viewerDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(viewerDate);
    dayEnd.setDate(dayEnd.getDate() + 1);
    dayEnd.setHours(0, 0, 0, 0);

    this.availableTimeFrames = this.availableTimeFrames.filter(frame => {
      const frameStart = frame.startTime.getTime();
      const frameEnd = frame.endTime.getTime();

      return frameEnd > dayStart.getTime() && frameStart < dayEnd.getTime();
    });
  }

  private deduplicateSlots() {
    const seen = new Set<number>();

    this.timeSlots = this.timeSlots.filter(slot => {
      const time = slot.startTime.getTime();
      if (seen.has(time)) {
        return false;
      }
      seen.add(time);
      return true;
    });
  }

  private sortSlots() {
    this.timeSlots.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }
}