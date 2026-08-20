import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { MatDialog } from "@angular/material/dialog"
import { BehaviorSubject, take, type Observable } from "rxjs"
import { environment } from "../../../../environments/environment"
import { getPropertyName } from "../../../../shared-functions/shared-functions"
import { NotificationWindowComponent } from "../../general/dialogs/notification-window/notification-window.component"
import { TimeSpan } from "../../general/models/time-span"
import { CRUDService } from "../../general/services/crud.service"
import { AvailabilityTimeFrame, SlotPeriod } from "../../meetings/models/schedule"
import { TimeFrameFormComponent } from "../components/time-slot-form/time-slot-form.component"
import { PlanningPerspectiveOption, ScheduleDefaultSettings } from "../models/schedule-default-settings"
import { TimeFrame, TimeSlot } from "../models/scheduled-meeting"

@Injectable({
    providedIn: "root",
})
export class ScheduleDefaultSettingsService extends CRUDService<ScheduleDefaultSettings> {
    public settingsModel!: ScheduleDefaultSettings;

    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.scheduleSettings}`;

    userID: string = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';

    private availableTimeFramesSubject = new BehaviorSubject<TimeFrame[]>([]);
    availableTimeFrames$ = this.availableTimeFramesSubject.asObservable();

    private scheduleSubject = new BehaviorSubject<TimeFrame[]>([]);
    private settingsSubject = new BehaviorSubject<ScheduleDefaultSettings>(this.settingsModel);

    public schedule$: Observable<TimeFrame[]> = this.scheduleSubject.asObservable();
    public settings$: Observable<ScheduleDefaultSettings> = this.settingsSubject.asObservable();

    constructor(http: HttpClient,
        private dialog: MatDialog,) {
        super(http);
    }

    loadSettingsModel(userId: any) {
        if (userId) {
            this.getByIdAsync(userId).pipe(take(1)).subscribe((settings: any) => {
                if (settings) {
                    this.settingsModel = settings;
                    this.settingsSubject.next(this.settingsModel);
                    this.loadTimeFrames(userId);
                } else {
                    this.settingsModel = this.getDefaultSettings();
                    this.settingsSubject.next(this.settingsModel);
                    this.availableTimeFramesSubject.next([]);
                }
            }, () => {
                this.settingsModel = this.getDefaultSettings();
                this.settingsSubject.next(this.settingsModel);
                this.availableTimeFramesSubject.next([]);
            });
        }
    }

    loadTimeFrames(userId: string): void {
        if (userId) {
            this.getByIdAsync(userId).pipe(take(1)).subscribe(settings => {
                const frames = settings?.availableTimeFrames ?? [];
                this.scheduleSubject.next(frames);
                this.availableTimeFramesSubject.next(frames);
            }, () => {
                this.scheduleSubject.next([]);
                this.availableTimeFramesSubject.next([]);
            });
        }
    }

    getScheduleLink(): string {
        return `${environment.sourceUrl}/schedule/user/${sessionStorage.getItem(`${environment.storage.userId}`)}`;
    }

    getSchedule(): TimeFrame[] {
        return this.scheduleSubject.getValue()
    }

    getDefaultSettings(): ScheduleDefaultSettings {
        return {
            autoAcception: true,
            autoExtension: true,
            availableTimeFrames: [],
            defaultSlotDurationOption: SlotPeriod.half,
            defaultMeetingDuration: new TimeSpan(1800000).milliseconds,

            defaultPlanningPerspectiveOption: PlanningPerspectiveOption.fortnight,
            defaultPlanningPerspective: new TimeSpan(604800000).milliseconds,
            userId: undefined,
            publicCalendarLink: this.getScheduleLink(),
        }
    }

    updateSchedule(timeFrames: TimeFrame[], date = new Date()): void {
        this.patchAsync(this.settingsModel._id, this.settingsModel,
            getPropertyName<ScheduleDefaultSettings>((e: ScheduleDefaultSettings) => e.availableTimeFrames),
            timeFrames, true, false
        ).subscribe((response: any) => {
            this.loadTimeFrames(this.userID);
        });
    }

    getSettings(): ScheduleDefaultSettings {
        return this.settingsSubject.getValue()
    }

    updateSettings(settings: Partial<ScheduleDefaultSettings>): void {
        const currentSettings = this.settingsSubject.getValue()
        const newSettings = { ...currentSettings, ...settings }
        this.settingsSubject.next(newSettings)
    }

    openTimeSlotForm(isEdit: boolean, date: Date, data: any, onSave: (saved: TimeFrame) => void): void {
        this.dialog.open(TimeFrameFormComponent, {
            panelClass: 'small-panel-class-dialog', data
        }).afterClosed().subscribe((timeFrameModel: TimeFrame) => {
            if (timeFrameModel) {
                if (isEdit) {
                    this.updateTimeSlot(date, timeFrameModel);
                    this.openNotification('Time Frame has been updated');
                } else {
                    this.addTimeSlot(date, timeFrameModel);
                    this.openNotification('Time Frame has been added');
                }

                onSave(timeFrameModel);
            }
        });
    }

    private openNotification(message: string): void {
        this.dialog.open(NotificationWindowComponent, {
            data: { message }
        });
    }

    addTimeSlot(date: Date, timeFrame: TimeFrame): void {
        const timeFrames = this.availableTimeFramesSubject.getValue();
        const updatedFrames = [...timeFrames, timeFrame];
        this.updateSchedule(updatedFrames);
        this.availableTimeFramesSubject.next(updatedFrames);
    }

    updateTimeSlot(date: Date, timeFrame: TimeFrame): void {
        const timeFrames = this.availableTimeFramesSubject.getValue();

        const timeFrameId =
            typeof timeFrame === 'object' && 'value' in timeFrame
                ? timeFrame.value
                : typeof timeFrame.id === 'object'
                    ? timeFrame.id.value
                    : timeFrame.id;

        const timeSlotIndex = timeFrames.findIndex((frame: TimeFrame) => {
            const frameId = typeof frame.id === 'object' ? frame.id.value : frame.id;
            return frameId === timeFrameId;
        });

        if (timeSlotIndex >= 0) {
            const updatedFrames = [...timeFrames];
            updatedFrames[timeSlotIndex] = timeFrame;
            this.updateSchedule(updatedFrames);
            this.availableTimeFramesSubject.next(updatedFrames);
        }
    }

    deleteTimeSlot(date: Date, timeFrame: TimeFrame): void {
        const timeFrames = this.availableTimeFramesSubject.getValue();

        const timeFrameId =
            typeof timeFrame === 'object' && 'value' in timeFrame
                ? timeFrame.value
                : typeof timeFrame.id === 'object'
                    ? timeFrame.id.value
                    : timeFrame.id;

        const frameDeleteIndex = timeFrames.findIndex((frame: TimeFrame) => {
            const frameId = typeof frame.id === 'object' ? frame.id.value : frame.id;
            return frameId === timeFrameId;
        });

        if (frameDeleteIndex < 0) {
            console.warn('Time frame not found for deletion:', timeFrame);
            return;
        }

        const updatedTimeFrames = [...timeFrames];
        updatedTimeFrames.splice(frameDeleteIndex, 1);

        this.updateSchedule(updatedTimeFrames); // persist
        this.availableTimeFramesSubject.next(updatedTimeFrames);
    }

    isDateAvailable(requested: Date): boolean {
        const timeFrames = this.getSchedule();
        return true;
    }

    isAvailable(slot: TimeSlot): boolean {
        const timeFrames = this.getSchedule()
        return timeFrames.some(
            (frame) => frame.startTime <= slot.startTime
                && slot.endTime <= frame.endTime);
    }

    isAvailableTimeRange(start: Date, end: Date): boolean {
        const timeFrames = this.getSchedule()
        return timeFrames.some(
            (frame) => frame.startTime <= start
                && end <= frame.endTime);
    }

    private isSameDay(date1: Date, date2: Date): boolean {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        )
    }
}