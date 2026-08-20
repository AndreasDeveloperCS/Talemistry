import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Subject, take, takeUntil } from "rxjs";
import { PlanningPerspectiveOption, ScheduleDefaultSettings, SlotDuration } from "../../models/schedule-default-settings";
import { ScheduleDefaultSettingsService } from "../../services/schedule-default-settings.service";
import { environment } from "../../../../../environments/environment";
import { ContentService } from "../../../general/services/content.service";
import { NotificationWindowComponent } from "../../../general/dialogs/notification-window/notification-window.component";
import { TimeSpan } from "../../../general/models/time-span";
import { getPropertyName } from "../../../../../shared-functions/shared-functions";
import { SlotPeriod } from "../../../meetings/models/schedule";
import { TimeFrame } from "../../models/scheduled-meeting";

@Component({
  selector: "app-schedule-settings",
  templateUrl: "./schedule-settings.component.html",
  styleUrl: "./schedule-settings.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleSettingsComponent implements OnInit, OnDestroy {
  activeTab = "timeFrames";
  userId: string = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  selectedMeetingDuration!: SlotPeriod;
  selectedPlanningPerspectiveOption!: PlanningPerspectiveOption;

  autoAcception = true;
  autoExtension = true;

  protected _onDestroy = new Subject<void>();

  bufferTimeOptions = [
    { value: 0, label: 'No buffer' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 30, label: '30 minutes' },
  ];

  durationOptions = [
    { value: SlotDuration.quater, label: SlotDuration.quater },
    { value: SlotDuration.half, label: SlotDuration.half },
    { value: SlotDuration.threeQaurters, label: SlotDuration.threeQaurters },
    { value: SlotDuration.hour, label: SlotDuration.hour },
    //{ value: SlotDuration.ninety, label: SlotDuration.ninety },
    { value: SlotDuration.two, label: SlotDuration.two },
    { value: SlotDuration.custom, label: SlotDuration.custom } // Custom duration option
  ];

  planningPerspectiveOptions = [
    { value: 'day', label: PlanningPerspectiveOption.day },
    { value: 'week', label: PlanningPerspectiveOption.week },
    { value: 'fortnight', label: PlanningPerspectiveOption.fortnight },
    { value: 'month', label: PlanningPerspectiveOption.month },
    { value: 'quarter', label: PlanningPerspectiveOption.quarter },
    { value: 'year', label: PlanningPerspectiveOption.year },
    { value: 'custom', label: PlanningPerspectiveOption.custom }
  ];

  settingsID: any = null;
  bufferTime: number = 0;
  availableTimeFrames: TimeFrame[] = [];
  loading: boolean = false;
  selectedTimezone: string = '';

  constructor(
    private scheduleSettingService: ScheduleDefaultSettingsService,
    public content: ContentService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loading = true;

    this.scheduleSettingService.loadTimeFrames(this.userId);

    this.scheduleSettingService.getByIdAsync(this.userId)
      .pipe(takeUntil(this._onDestroy))
      .subscribe((settings: any) => {
        this.initializeSettings(settings);
        this.cdr.markForCheck();
      });

    this.scheduleSettingService.availableTimeFrames$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(frames => {
        this.availableTimeFrames = frames;
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private initializeSettings(settings: ScheduleDefaultSettings): void {
    if (!settings) {

      console.warn('No settings found, initializing with default values.');
      this.settingsID = null;
      this.autoAcception = true;
      this.autoExtension = true;

      this.selectedMeetingDuration = SlotPeriod.half;
      this.selectedPlanningPerspectiveOption = PlanningPerspectiveOption.fortnight;
    } else {
      this.scheduleSettingService.settingsModel = settings;
      this.settingsID = settings._id;
      this.autoAcception = settings.autoAcception;
      this.autoExtension = settings.autoExtension;
      this.selectedTimezone = settings.calendarTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      this.selectedMeetingDuration = settings.defaultSlotDurationOption;
      this.selectedPlanningPerspectiveOption = settings.defaultPlanningPerspectiveOption;
      console.log('settings loaded', settings);
      console.log('selectedMeetingDuration', settings.defaultSlotDurationOption, this.selectedMeetingDuration);
      console.log('selectedPlanningPerspectiveOption', settings.defaultPlanningPerspective, this.selectedPlanningPerspectiveOption);
    }
  }

  save() {
    const defaultSettings: ScheduleDefaultSettings = {
      autoAcception: this.autoAcception,
      autoExtension: this.autoExtension,
      defaultPlanningPerspectiveOption: this.selectedPlanningPerspectiveOption,
      defaultSlotDurationOption: this.selectedMeetingDuration,
      userId: sessionStorage.getItem(`${environment.storage.userId}`),
      defaultPlanningPerspective: this.convertPlanningPerspective(this.selectedPlanningPerspectiveOption),
      defaultMeetingDuration: this.convertMeetingDuration(this.selectedMeetingDuration),
      calendarTimeZone: this.selectedTimezone,
      publicCalendarLink: this.scheduleSettingService.getScheduleLink(),
      availableTimeFrames: this.availableTimeFrames,
      createdBy: sessionStorage.getItem(`${environment.storage.userId}`)
    };

    console.log('SAVE defaultSettings', defaultSettings);

    if (!this.settingsID) {
      this.scheduleSettingService.createAsync(defaultSettings, true, false).pipe(take(1)).subscribe((response: any) => {
        console.log('create scheduleSettingService', response);
        this.dialog.open(NotificationWindowComponent, {
          data: {
            message: "Changes have been saved"
          }
        });
        this.cdr.markForCheck();
      });
    } else {
      defaultSettings._id = this.settingsID;
      defaultSettings.modifiedBy = sessionStorage.getItem(`${environment.storage.userId}`);
      this.scheduleSettingService.updateAsync(defaultSettings, true, false).pipe(take(1)).subscribe((response: any) => {
        console.log('update scheduleSettingService', response);
        this.dialog.open(NotificationWindowComponent, {
          data: {
            message: "Changes have been saved"
          }
        });
      });
      this.cdr.markForCheck();
    }
  }

  convertMeetingDuration(meetingDuration: any): number {
    console.log('meetingDuration', meetingDuration);
    switch (meetingDuration) {
      case 15:
        return new TimeSpan(15 * 60 * 1000).milliseconds;
      case 30:
        return new TimeSpan(30 * 60 * 1000).milliseconds;
      case 45:
        return new TimeSpan(45 * 60 * 1000).milliseconds;
      case 60:
        return new TimeSpan(60 * 60 * 1000).milliseconds;
      // case 90:
      //   return new TimeSpan(90 * 60 * 1000).milliseconds;
      case 120:
        return new TimeSpan(120 * 60 * 1000).milliseconds;
      case 'custom':
        // TODO: open dialog and get custom value
        return new TimeSpan(120 * 60 * 1000).milliseconds;
      default:
        return new TimeSpan(30 * 60 * 1000).milliseconds;
    }
  }

  convertPlanningPerspective(planningPerspective: string) {
    console.log('planningPerspective', planningPerspective);
    switch (planningPerspective) {
      case 'day':
        return new TimeSpan(24 * 3600 * 1000).milliseconds;
      case 'week':
        return new TimeSpan(7 * 24 * 3600 * 1000).milliseconds;
      case 'fortnight':
        return new TimeSpan(14 * 24 * 3600 * 1000).milliseconds;
      case 'month':
        return new TimeSpan(31 * 24 * 3600 * 1000).milliseconds;
      case 'quarter':
        return new TimeSpan(92 * 24 * 3600 * 1000).milliseconds;
      case 'year':
        return new TimeSpan(366 * 24 * 3600 * 1000).milliseconds;
      case 'custom':
        //TODO Open Dialog to select custom time span
        //this.dialogService.openDialog()
        return new TimeSpan(366 * 24 * 3600 * 1000).milliseconds;
      default:
        return new TimeSpan(14 * 24 * 3600 * 1000).milliseconds;
    }
  }

  toggleAutoAccept(): void {
    this.updateAutoAccept(!this.autoAcception);
  }

  updateAutoAccept(value: boolean): void {
    this.autoAcception = value;
    if (this.scheduleSettingService.settingsModel._id != null) {
      this.scheduleSettingService.patchAsync(this.scheduleSettingService.settingsModel._id,
        this.scheduleSettingService.settingsModel, getPropertyName<ScheduleDefaultSettings>((e: ScheduleDefaultSettings) => e.autoAcception),
        value, true, false).pipe(take(1)).subscribe((response: any) => {
          console.log('updateAutoAccept response', response);
          this.cdr.markForCheck();
        });
    }
  }

  updateBufferTime(event: Event): void {
    const value = Number.parseInt((event.target as HTMLSelectElement).value);
    this.bufferTime = value;
    //this.scheduleService.updateSettings({ bufferTime: value });
  }

  updateDefaultDuration(value: SlotPeriod): void {
    // const value = Number.parseInt((event.target as HTMLSelectElement).value);
    console.log('updateDefaultDuration', value);
    this.selectedMeetingDuration = value;
    //this.scheduleService.updateSettings({ defaultSlotDurationOption: value });
  }

  updateDefaultRepeatPattern(event: Event): void {
    // const value = event.target ? (event.target as HTMLSelectElement).value as RepeatPatternOption : RepeatPatternOption.none;
    // this.selectedRepeatPattern = value;
    //this.scheduleService.updateSettings({ defaultRepeatPattern: value });
  }

  updatePlanningPerspective(value: PlanningPerspectiveOption): void {
    console.log('updatePlanningPerspective', value);
    this.selectedPlanningPerspectiveOption = value;
    //this.scheduleService.updateSettings({ planningPerspective: value });
  }

  onTimezoneChange(tz: string) {
    this.selectedTimezone = tz;
    console.log("Selected timezone:", tz);
  }

  toggleAutoExtend(): void {
    this.updateAutoExtend(!this.autoExtension);
  }

  updateAutoExtend(value: boolean): void {
    this.autoExtension = value;
    if (this.scheduleSettingService.settingsModel._id != null) {
      this.scheduleSettingService.patchAsync(this.scheduleSettingService.settingsModel._id,
        this.scheduleSettingService.settingsModel, getPropertyName<ScheduleDefaultSettings>((e: ScheduleDefaultSettings) => e.autoExtension),
        value, true, false).pipe(take(1)).subscribe((response: any) => {
          console.log('updateAutoExtend response', response);
          this.cdr.markForCheck();
        });
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  getScheduleLink(): string {
    return this.scheduleSettingService.getScheduleLink();
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.getScheduleLink());
  }

  copyIFrameToClipboard(): void {
    navigator.clipboard.writeText(`<iframe src="${this.getScheduleLink()}" width="100%" height="600" frameborder="0"></iframe>`);
  }
}