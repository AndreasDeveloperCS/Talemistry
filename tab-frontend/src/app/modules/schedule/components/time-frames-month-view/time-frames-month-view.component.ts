import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ContentService } from '../../../general/services/content.service';
import { CalendarDay } from '../../models/meeting.model';
import { planningPerspectiveMapping } from '../../models/planning-perspective-mapping';
import { PlanningPerspectiveOption, ScheduleDefaultSettings } from '../../models/schedule-default-settings';
import { TimeFrame } from '../../models/scheduled-meeting';
import { ScheduleDefaultSettingsService } from '../../services/schedule-default-settings.service';
import { ScheduleService } from '../../services/schedule-services';

@Component({
  selector: 'app-time-frames-month-view',
  templateUrl: './time-frames-month-view.component.html',
  styleUrl: './time-frames-month-view.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeFramesMonthViewComponent implements OnInit, OnDestroy {
  @Output() onDateChange = new EventEmitter<Date>();
  @Output() onCreateMeeting = new EventEmitter<void>();

  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekDays: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  userID: string = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  availableTimeFrames: TimeFrame[] = [];

  planningPerspective!: PlanningPerspectiveOption;
  perspectiveStart: Date = new Date();
  perspectiveEnd: Date = new Date();

  loading: boolean = true;
  editingTimeSlot: boolean = false;

  protected _onDestroy = new Subject<void>();

  constructor(
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private scheduleService: ScheduleService,
    private scheduleSettingService: ScheduleDefaultSettingsService,
  ) { }

  ngOnInit() {
    this.loading = true;

    this.scheduleSettingService.getByIdAsync(this.userID, true)
      .pipe(takeUntil(this._onDestroy))
      .subscribe((settings: any) => {
        this.initializeSettings(settings);
        this.cdr.markForCheck();
      });

    this.scheduleSettingService.loadTimeFrames(this.userID);

    this.scheduleSettingService.availableTimeFrames$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(frames => {
        this.availableTimeFrames = frames;
        this.calendarDays = this.scheduleService
          .loadTimeFrames(this.currentDate, this.availableTimeFrames, this.perspectiveStart, this.perspectiveEnd);
        this.loading = false;
        this.cdr.markForCheck();
      });
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private initializeSettings(settings: ScheduleDefaultSettings): void {
    const rawPerspective = settings?.defaultPlanningPerspectiveOption;

    this.planningPerspective = planningPerspectiveMapping[rawPerspective?.toLowerCase()] || PlanningPerspectiveOption.month;

    this.perspectiveEnd = this.scheduleService.getPerspectiveEnd(this.perspectiveStart, this.planningPerspective);

    console.log('Mapped planningPerspective:', this.planningPerspective);
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
      .loadTimeFrames(this.currentDate, this.availableTimeFrames, this.perspectiveStart, this.perspectiveEnd);
  }

  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // ignore time
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
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

  openEditTimeSlotForm(timeFrame: TimeFrame): void {
    console.log('openEditTimeSlotForm timeFrame', timeFrame);
    this.scheduleSettingService.openTimeSlotForm(
      true,
      this.currentDate,
      timeFrame,
      (timeFrameModel: TimeFrame) => {
        console.log('Saved (Edit)', timeFrameModel);
      }
    );
  }
}
