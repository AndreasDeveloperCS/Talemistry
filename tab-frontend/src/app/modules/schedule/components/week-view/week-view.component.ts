import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from "@angular/core"
import { ContentService } from "../../../general/services/content.service"
import { CalendarUtilsService } from "../../services/calendar-utils.service"
import { Meeting } from "../../../meetings/models/meeting";

@Component({
  selector: "app-week-view",
  templateUrl: './week-view.component.html',
  styleUrl: './week-view.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeekViewComponent implements OnChanges {
  @Input() currentDate!: Date;

  @Output() onDateChange = new EventEmitter<any>();
  @Output() onCreateMeeting = new EventEmitter<void>();
  @Output() onCreateMeetingForDateTime = new EventEmitter<{ date: Date; time: string }>();
  @Output() onMeetingClick = new EventEmitter<Meeting>();

  weekDays: any[] = [];
  weekRange = "";
  workingHours: number[] = [];
  allWeekMeetings: Meeting[] = [];

  constructor(
    private calendarUtils: CalendarUtilsService,
    public content: ContentService,
  ) {
    this.workingHours = this.calendarUtils.getWorkingHours();
  }

  ngOnChanges() {
    this.weekDays = this.calendarUtils.getWeekDays(this.currentDate);
    this.weekRange = this.calendarUtils.getWeekRange(this.weekDays);
    this.allWeekMeetings = this.weekDays.flatMap((day) => day.meetings);
  }

  navigateWeek(direction: "prev" | "next") {
    const newDate = new Date(this.currentDate);
    newDate.setDate(this.currentDate.getDate() + (direction === "prev" ? -7 : 7));
    this.onDateChange.emit(newDate);
  }

  formatHour(hour: number): string {
    return new Date(0, 0, 0, hour).toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  }

  getTimeSlotClass(day: any, hour: number): string {
    const timeString = `${hour.toString().padStart(2, "0")}:00`;
    const timeSlot = day.timeSlots.find((slot: any) => slot.time === timeString);
    const isAvailable = timeSlot?.isAvailable ?? true;

    let classes = "p-1 border-r border-color-hover min-h-[60px] relative ";

    if (isAvailable) {
      classes += "hover:bg-color-hover/10 cursor-pointer group";
    } else {
      classes += "bg-red-50 dark:bg-red-900/20 cursor-not-allowed";
    }

    return classes;
  }

  isTimeSlotAvailable(day: any, hour: number): boolean {
    const timeString = `${hour.toString().padStart(2, "0")}:00`;
    const timeSlot = day.timeSlots.find((slot: any) => slot.time === timeString);
    return timeSlot?.isAvailable ?? true;
  }

  getMeetingsForHour(day: any, hour: number): Meeting[] {
    const timeString = `${hour.toString().padStart(2, "0")}:00`;
    const timeSlot = day.timeSlots.find((slot: any) => slot.time === timeString);
    return timeSlot?.meetings ?? [];
  }

  handleTimeSlotClick(day: any, hour: number) {
    const timeString = `${hour.toString().padStart(2, "0")}:00`;
    if (this.isTimeSlotAvailable(day, hour)) {
      this.onCreateMeetingForDateTime.emit({
        date: day.date,
        time: timeString,
      });
    }
  }
}
