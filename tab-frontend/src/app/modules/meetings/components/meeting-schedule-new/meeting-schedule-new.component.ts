import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject, take, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { WarningsErrorsDialogComponent } from '../../../general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { NotificationWindowComponent } from '../../../general/dialogs/notification-window/notification-window.component';
import { ContentService } from '../../../general/services/content.service';
import { TimeFrame } from '../../../schedule/models/scheduled-meeting';
import { ScheduleDefaultSettingsService } from '../../../schedule/services/schedule-default-settings.service';
import { Meeting } from '../../models/meeting';
import { SlotPeriod, TimeSlot } from '../../models/schedule';
import { CalendarService } from '../../services/calendar.service';
import { MeetingScheduleService } from '../../services/meeting-schedule.service';
import { MeetingService } from '../../services/meeting.service';

@Component({
  selector: 'app-meeting-schedule-new',
  templateUrl: './meeting-schedule-new.component.html',
  styleUrl: './meeting-schedule-new.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingScheduleNewComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  selectedDate: Date = new Date();
  selectedDuration!: number;
  selectedTime!: string;
  isFormOpen: boolean = false;
  isMeetingFormValid = false;
  selectedSlotPeriod: SlotPeriod = SlotPeriod.half;
  isScheduleInfoDefault: boolean = true;
  isLoading: boolean = true;

  userId: any;
  schedule: TimeFrame[] = [];

  availableTimeFrames: TimeFrame[] = [];
  filteredTimeFrames: TimeFrame[] = [];

  private _timeSlotSelected!: TimeSlot;

  public get timeSlotSelected(): TimeSlot {
    return this._timeSlotSelected;
  }

  public set timeSlotSelected(value: TimeSlot) {
    this._timeSlotSelected = value;
  }

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<MeetingScheduleNewComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    private calendarService: CalendarService,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private scheduleSettingService: ScheduleDefaultSettingsService,
    private scheduleService: MeetingScheduleService,
    private service: MeetingService) {
    this.service.model = new Meeting();
    console.log('Data received in MeetingScheduleNewComponent:', data);
  }

  ngOnInit(): void {
    this.selectedDate = new Date();
    this.service.model.date = this.selectedDate;
    this.emitSelectedDate(this.selectedDate);
    this.scheduleService.timeSlotSelected
      .pipe(takeUntil(this._onDestroy))
      .subscribe((timeSlot: TimeSlot) => {
        this.timeSlotSelected = timeSlot;
        console.log('timeSlotSelected', this.timeSlotSelected);
        this.cdr.markForCheck();
      });
    this.service.validity$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((valid) => {
        this.isMeetingFormValid = valid;
        this.cdr.markForCheck();
      });

    this.getOwnerId();

    if(this.userId) {
      this.scheduleSettingService.loadSettingsModel(this.userId);
      this.getScheduleSettings(this.userId);
      this.cdr.markForCheck();
    } else {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  getOwnerId() {
    this.userId = this.data ? this.data 
      : sessionStorage.getItem(`${environment.storage.userId}`) 
      ? sessionStorage.getItem(`${environment.storage.userId}`) : undefined;

    console.log("Meeting UserId", this.userId);

    this.service.model.userId = this.userId;
  }

  getScheduleSettings(userId: any) {
    this.scheduleSettingService.schedule$
      .pipe(takeUntil(this._onDestroy)).subscribe((schedule) => {
      if(schedule?.length > 0) {
        this.schedule = schedule;
        console.log('Schedule', schedule);
        this.cdr.markForCheck();
      }
    });

    this.scheduleSettingService.loadTimeFrames(userId);

    this.scheduleSettingService.availableTimeFrames$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(frames => {
        if(frames?.length > 0) {
          this.availableTimeFrames = frames;
          console.log('availableTimeFrames', this.availableTimeFrames);

          console.log('Setting Model', this.scheduleSettingService.settingsModel);
          if(this.scheduleSettingService.settingsModel !== undefined) {
            console.log('Duration', this.scheduleSettingService.settingsModel.defaultSlotDurationOption);
            this.isScheduleInfoDefault = false;
            this.selectedSlotPeriod = this.scheduleSettingService.settingsModel.defaultSlotDurationOption;
            this.isLoading = false;
            this.cdr.markForCheck();
          } else {
            this.isScheduleInfoDefault = false;
            this.selectedSlotPeriod = SlotPeriod.half;
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        }
      });

    this.onDateSelect(new Date());
  }

  onDateSelect(date: Date): void {
    this.selectedDate = date;
    console.log('selectedDate', this.selectedDate);
  }

  onFormValidityChanged(valid: boolean) {
    this.isMeetingFormValid = valid;
  }

  setDate(date: any): void {
    console.log('setDate', date);
    this.selectedDate = date as unknown as Date;
    this.service.model.date = this.selectedDate;
    this.service.model.timeSlot.startTime = date;
    this.emitSelectedDate(this.selectedDate);
  }

  setTime(slot: any): void {
    console.log('setTime', slot);
    this.selectedTime = slot;
    this.service.model.startTime = slot;
    this.service.model.timeSlot = slot;
  }

  emitSelectedDate(date: Date) {
    this.scheduleService.dateSelected.emit(date);
  }

  confirmSlot() {
    if (this.selectedDate && this.selectedTime) {
      console.log('Selected Date:', this.selectedDate);
      console.log('Selected Time:', this.selectedTime);
    }
  }

  openDetails() {
    this.isFormOpen = true;
  }

  sendRequest() {
    this.service.model.startTime = this.service.model.timeSlot.startTime;
    this.service.model.endTime = this.service.model.timeSlot.endTime;
    this.service.model.duration = this.service.model.timeSlot.duration;
    this.service.model.selectedSlotPeriod = this.selectedSlotPeriod;
    const event = this.calendarService.getEvent(this.service.model);
    const invite1 = this.calendarService.generateGoogleCalendarLink(event);
    const invite2 = this.calendarService.generateIcsCalendarLink(event);
    const invite3 = this.calendarService.generateOffice365CalendarLink(event);
    const invite4 = this.calendarService.generateOutlookCalendarLink(event);
    const invite5 = this.calendarService.generateYahooCalendarLink(event);

    console.log('sendRequest', this.service.tartgetUrl, this.service.model, event, invite1, invite2, invite3, invite4, invite5);
    console.log(this.service.model, event, invite1, invite2, invite3, invite4, invite5);
    this.service.createAsync(this.service.model, true, false).pipe(take(1)).subscribe({
      next: (saved) => {
        console.log('saved', saved);
        const notificationRef = this.dialog.open(NotificationWindowComponent, {
          data: { message: "Your meeting has been scheduled!" }
        });
        setTimeout(() => {
          this.dialogRef.close();
          notificationRef.close(); 
          this.cdr.markForCheck();
        }, 5000);
      }, error: (err) => {
        console.error('Error updating company', err);
        this.dialog.open(WarningsErrorsDialogComponent, {
          data: { message: "Error scheduling the meeting!" }
        });
        this.cdr.markForCheck();
      }
    });
  }

  back() {
    this.isFormOpen = false;
  }

  convertMinutesToMilliseconds(minutes: number) {
    return minutes * 60000;
  }

  closeDialog() {
    this.dialogRef.close();
  }
}