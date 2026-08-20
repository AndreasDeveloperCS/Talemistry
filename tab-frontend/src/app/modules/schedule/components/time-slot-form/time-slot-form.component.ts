import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";

import { Inject } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Guid } from "guid-typescript";
import { Subject, takeUntil } from "rxjs";
import { toLocalDateString } from "../../../../../shared-functions/shared-functions";
import { ContentService } from "../../../general/services/content.service";
import { RepeatPatternOption, TimeFrame } from "../../models/scheduled-meeting";

@Component({
  selector: "app-time-slot-form",
  templateUrl: "./time-slot-form.component.html",
  styleUrl: "./time-slot-form.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeFrameFormComponent implements OnInit, OnDestroy {
  @Input() selectedRepeatPatternOption!: RepeatPatternOption;
  @Input() open = false;
  @Input() data?: TimeFrame;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<TimeFrame>();

  form!: FormGroup;

  weekdays = [
    { id: 1, label: "Monday" },
    { id: 2, label: "Tuesday" },
    { id: 3, label: "Wednesday" },
    { id: 4, label: "Thursday" },
    { id: 5, label: "Friday" },
    { id: 6, label: "Saturday" },
    { id: 0, label: "Sunday" },
  ];

  repeatPatternOptions = [
    { value: RepeatPatternOption.none, label: 'No Repeat' },
    { value: RepeatPatternOption.daily, label: 'Every Day' },
    { value: RepeatPatternOption.weekdaysWest, label: 'Every Weekday (Mon-Fri)' },
    { value: RepeatPatternOption.weekdaysEast, label: 'Every Weekday (Sun-Thu)' },
    { value: RepeatPatternOption.weekly, label: 'Once per Week' },
    { value: RepeatPatternOption.monthly, label: 'Once per Month' },
    { value: RepeatPatternOption.custom, label: 'Custom' }
  ];

  protected _onDestroy = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<TimeFrameFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public initialData: TimeFrame
  ) { }

  ngOnInit(): void {
    console.log('initialData', this.initialData);
    this.initForm();
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private initForm(): void {
    const currentDate = this.initialData?.startDate || new Date();
    console.log('currentDate', currentDate);
    const yyyyMMdd = toLocalDateString(currentDate);
    console.log('initial Date', yyyyMMdd);
    this.form = this.fb.group({
      startDate: [yyyyMMdd, Validators.required],
      startTime: [this.initialData?.startTime || "09:00", Validators.required],
      endTime: [this.initialData?.endTime || "17:00", Validators.required],
      repeatPattern: [this.initialData?.repeatPattern || RepeatPatternOption.weekdaysEast, Validators.required],
      customDays: [this.initialData?.customPattern?.weekDays || undefined],
    });

    this.selectedRepeatPatternOption = this.initialData?.repeatPattern || RepeatPatternOption.weekdaysEast;
    this.form.get("repeatPattern")?.setValue(RepeatPatternOption.weekdaysWest);

    this.form.get(this.form.value.repeatPattern)?.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((value: RepeatPatternOption) => {
        console.log('repeatPattern', value);
        if (value === RepeatPatternOption.custom) {
          this.form.get("customDays")?.setValidators([Validators.required]);
        } else {
          this.form.get("customDays")?.clearValidators();
        }
        this.form.get("customDays")?.updateValueAndValidity();
        this.cdr.markForCheck();
      });
  }

  updateRepeatPattern(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as RepeatPatternOption;
    this.form.get("repeatPattern")?.setValue(value);
    this.selectedRepeatPatternOption = RepeatPatternOption[value as keyof typeof RepeatPatternOption];
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const values = this.form.value;
    const timeFrame: TimeFrame = {
      id: this.initialData?.id || Guid.create(),
      startTime: values.startTime,
      endTime: values.endTime,
      startDate: values.startDate,
      repeatPattern: values.repeatPattern as RepeatPatternOption,
      customPattern: values.repeatPattern == RepeatPatternOption.custom ? {
        dates: [] = [],
        weekDays: [] = [],
        weeks: [] = [],
        months: [] = [],
      } : undefined,
    };

    if (values.repeatPattern === "custom" && values.customDays?.length) {
      timeFrame.customPattern = {
        weekDays: values.customDays,
      };
    }
    console.log('customPattern', timeFrame.customPattern);

    // this.save.emit(timeSlot);
    // this.closeDialog();

    this.dialogRef.close(timeFrame);
  }

  closeDialog(): void {
    this.openChange.emit(false);
    this.dialogRef.close();
  }

  toggleCustomDay(dayId: number): void {
    const customDays = [...(this.form.get("customDays")?.value || [])];
    const index = customDays.indexOf(dayId);
    console.log('toggleCustomDay', customDays);

    if (index === -1) {
      customDays.push(dayId);
    } else {
      customDays.splice(index, 1);
    }

    this.form.get("customDays")?.setValue(customDays);
  }

  isDaySelected(dayId: number): boolean {
    return (this.form.get("customDays")?.value || []).includes(dayId);
  }
}
