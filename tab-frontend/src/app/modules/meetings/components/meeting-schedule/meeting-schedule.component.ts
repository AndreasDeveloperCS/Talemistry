import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { format, fromZonedTime } from 'date-fns-tz';
import { catchError, map, Observable, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { InvitationStatus, MeetingInvitation } from 'src/app/modules/meeting-invitations/models/meeting-invitation';
import { environment } from '../../../../../environments/environment';
import { WarningsErrorsDialogComponent } from '../../../general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { NotificationWindowComponent } from '../../../general/dialogs/notification-window/notification-window.component';
import { ContentService } from '../../../general/services/content.service';
import { TimeFrame } from '../../../schedule/models/scheduled-meeting';
import { ScheduleDefaultSettingsService } from '../../../schedule/services/schedule-default-settings.service';
import { Meeting, MeetingStatus } from '../../models/meeting';
import { SlotPeriod, TimeSlot } from '../../models/schedule';
import { CalendarService } from '../../services/calendar.service';
import { MeetingScheduleService } from '../../services/meeting-schedule.service';
import { MeetingService } from '../../services/meeting.service';
import { MeetingInvitationsService } from 'src/app/modules/meeting-invitations/services/meeting-invitations.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { ROLES } from 'src/app/modules/authentication/models/roles';

export interface MeetingScheduleDialogData {
  userId?: string;
  invitation?: MeetingInvitation;
  ownerId?: string;
}

@Component({
  selector: 'app-meeting-schedule',
  templateUrl: './meeting-schedule.component.html',
  styleUrl: './meeting-schedule.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingScheduleComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  selectedDuration!: number;
  selectedTime!: string;
  isMeetingFormValid = false;
  selectedSlotPeriod: SlotPeriod = SlotPeriod.half;
  isScheduleInfoDefault: boolean = true;
  isLoading: boolean = true;
  selectedTimezone!: string;
  selectedDate!: Date;
  userId: any;
  schedule: TimeFrame[] = [];
  availableTimeFrames: TimeFrame[] = [];
  filteredTimeFrames: TimeFrame[] = [];
  isByInvitation: boolean = false;

  private _timeSlotSelected!: TimeSlot;

  public get timeSlotSelected(): TimeSlot {
    return this._timeSlotSelected;
  }

  public set timeSlotSelected(value: TimeSlot) {
    this._timeSlotSelected = value;
  }

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<MeetingScheduleComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: MeetingScheduleDialogData,
    private calendarService: CalendarService,
    public content: ContentService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private scheduleSettingService: ScheduleDefaultSettingsService,
    private scheduleService: MeetingScheduleService,
    private meetingInvitationService: MeetingInvitationsService,
    private service: MeetingService) {
    this.service.model = new Meeting();
    console.log('data in schedule component', data);
    if(data?.invitation) {
      this.isByInvitation = true;
    }
  }

  ngOnInit(): void {
    //this.deleteMeeting('69fa0fe00c6ad462612e0a78');
    this.selectedDate = new Date();
    this.selectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.service.model.date = this.selectedDate;
    this.emitSelectedDate(this.selectedDate);
    const role = this.authService.getCurrentRole();

    this.scheduleService.timeSlotSelected
      .pipe(takeUntil(this._onDestroy))
      .subscribe((timeSlot: TimeSlot) => {
        this.timeSlotSelected = timeSlot;
        this.cdr.markForCheck();
      });
    this.service.validity$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((valid) => {
        this.isMeetingFormValid = valid;
        this.cdr.markForCheck();
      });

    if (role?.includes(ROLES.HR) || role?.includes(ROLES.HM) || role?.includes(ROLES.RC)) {
      this.scheduleSettingService.loadSettingsModel(this.userId);
      this.getScheduleSettings(this.userId);
      this.isScheduleInfoDefault = false;
      this.cdr.markForCheck();
    } else if(role?.includes(ROLES.TALENT) && this.data?.invitation && this.data?.userId){
      this.scheduleSettingService.loadSettingsModel(this.data?.userId);
      this.getScheduleSettings(this.data?.userId);
      this.isScheduleInfoDefault = false;
      this.cdr.markForCheck();
    } else {
      this.isLoading = false;
      this.isScheduleInfoDefault = true;
      this.cdr.markForCheck();
    }

    this.getOwnerId();
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  getOwnerId() {
    this.userId = typeof this.data === 'string'
      ? this.data
      : this.data?.userId || this.data?.ownerId || sessionStorage.getItem(`${environment.storage.userId}`) || undefined;

    this.service.model.userId = this.userId;
  }

  getScheduleSettings(userId: any) {
    this.scheduleSettingService.schedule$
      .pipe(takeUntil(this._onDestroy)).subscribe((schedule) => {
        this.schedule = schedule ?? [];
        this.cdr.markForCheck();
      });

    this.scheduleSettingService.loadTimeFrames(userId);

    this.scheduleSettingService.availableTimeFrames$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(frames => {
        this.availableTimeFrames = frames ?? [];

        if (this.scheduleSettingService.settingsModel !== undefined) {
          //this.isScheduleInfoDefault = false;
          this.selectedSlotPeriod = this.scheduleSettingService.settingsModel.defaultSlotDurationOption || SlotPeriod.half;
        } else {
          //this.isScheduleInfoDefault = false;
          this.selectedSlotPeriod = SlotPeriod.half;
        }

        this.isLoading = false;
        this.cdr.markForCheck();
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
    console.log('setDate', date, this.service.model);
    this.selectedDate = date as Date;

    const tz = this.selectedTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;;

    const startOfDayUtc = fromZonedTime(
      `${format(this.selectedDate, 'yyyy-MM-dd')}T00:00:00`,
      tz
    );

    this.service.model.date = startOfDayUtc;
    this.service.model.timeZone = tz;

    if (this.service.model.timeSlot) {
      this.service.model.timeSlot.startTime = startOfDayUtc;
      this.service.model.timeSlot.endTime = startOfDayUtc;
    }

    this.emitSelectedDate(this.selectedDate);
  }

  setTime(slot: any): void {
    if (!slot || !this.selectedTimezone) {
      return;
    }

    const tz = this.selectedTimezone;
    const startUtc = fromZonedTime(slot.startTime, tz);
    const endUtc = fromZonedTime(slot.endTime, tz);

    this.selectedTime = slot;

    this.service.model.startTime = startUtc;
    this.service.model.endTime = endUtc;
    this.service.model.timeZone = tz;

    this.service.model.timeSlot = {
      ...slot,
      startTime: startUtc,
      endTime: endUtc,
    };
  }

  emitSelectedDate(date: Date) {
    this.scheduleService.dateSelected.emit(date);
  }

  sendRequest() {
    this.service.model.startTime = this.service.model.timeSlot.startTime;
    this.service.model.endTime = this.service.model.timeSlot.endTime;
    this.service.model.duration = this.service.model.timeSlot.duration;
    this.service.model.selectedSlotPeriod = this.selectedSlotPeriod;
    this.service.model.timeZone = this.selectedTimezone;
    this.service.model.status = this.isByInvitation ? MeetingStatus.confirmed : MeetingStatus.cancelled;
    console.log('Invitation Info', this.data?.invitation);
    if(this.isByInvitation && this.data?.invitation && this.data?.invitation?._id 
      && this.data?.invitation?.participants?.length > 0
    ) {
      this.service.model.participants.push(...this.data?.invitation.participants);
      this.service.model.invitationId = this.data?.invitation?._id;
      this.service.model.positionId = this.data?.invitation?.positionId;
    }
    const event = this.calendarService.getEvent(this.service.model);
    const invite1 = this.calendarService.generateGoogleCalendarLink(event);
    const invite2 = this.calendarService.generateIcsCalendarLink(event);
    const invite3 = this.calendarService.generateOffice365CalendarLink(event);
    const invite4 = this.calendarService.generateOutlookCalendarLink(event);
    const invite5 = this.calendarService.generateYahooCalendarLink(event);

    console.log('sendRequest', this.service.model);
    this.service.createAsync(this.service.model, true, false).pipe(
      take(1),
      switchMap((saved: Meeting) => {
        if (!saved) {
          throw new Error('Meeting not saved');
        }

        console.log('Meeting scheduled', saved);

        return this.updateMeetingInvitation(saved._id).pipe(
          map(() => saved) // pass meeting forward
        );
      })
    ).subscribe({
      next: (saved: Meeting) => {
        const notificationRef = this.dialog.open(NotificationWindowComponent, {
          data: { message: "Your meeting has been scheduled!" }
        });

        // ✅ Close AFTER showing notification (optional delay)
        setTimeout(() => {
          this.dialogRef.close(saved);
          notificationRef.close();
          this.cdr.markForCheck();
        }, 3000);
      },
      error: (err) => {
        console.error('Error scheduling meeting', err);
        this.dialog.open(WarningsErrorsDialogComponent, {
          data: { message: "Error scheduling the meeting!" }
        });
        this.cdr.markForCheck();
      }
    });
  }

  updateMeetingInvitation(meetingId: any): Observable<MeetingInvitation | null> {
    if (!this.data?.invitation) {
      return of(null);
    }

    const updatedInvitation: MeetingInvitation = {
      ...this.data.invitation,
      meetingId: meetingId,
      status: InvitationStatus.booked,
    };

    return this.meetingInvitationService.updateAsync(updatedInvitation, true, false).pipe(
      take(1),
      tap((saved) => console.log('Meeting invitation updated', saved)),
      catchError((err) => {
        console.error('Error updating meeting invitation', err);
        return of(null); // prevent breaking the chain
      })
    );
  }

  convertMinutesToMilliseconds(minutes: number) {
    return minutes * 60000;
  }

  closeDialog() {
    this.dialogRef.close();
  }

  onTimezoneChange(newTz: string) {
    this.selectedTimezone = newTz;
    this.selectedDate = this.selectedDate;

    if (!this.selectedDate) {
      return;
    }

    const calendarDate = format(this.selectedDate, 'yyyy-MM-dd');
    const [year, month, day] = calendarDate.split('-').map(Number);
    this.selectedDate = new Date(year, month - 1, day);

    this.emitSelectedDate(this.selectedDate);
  }

  deleteMeeting(meetingId: string) {
    this.service
      .deleteAsync(meetingId, true, false)
      .pipe(take(1))
      .subscribe({
        next: (deleted) => {
          console.log('Meeting deleted', deleted);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error updating meeting', err);
          this.cdr.markForCheck();
        },
    });
  }
}