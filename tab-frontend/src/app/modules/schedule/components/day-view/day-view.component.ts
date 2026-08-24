import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from "@angular/core"
import { ContentService } from "../../../general/services/content.service"
import { TimeSlot } from "../../models/meeting.model"
import { CalendarUtilsService } from "../../services/calendar-utils.service"
import { MeetingsService } from "../../services/meetings.service"
import { Meeting } from "../../../meetings/models/meeting"

@Component({
  selector: "app-day-view",
  templateUrl: './day-view.component.html',
  styleUrl: './day-view.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DayViewComponent implements OnChanges {
  @Input() currentDate!: Date;

  @Output() onDateChange = new EventEmitter<any>();
  @Output() onCreateMeeting = new EventEmitter<Date>();
  @Output() onCreateMeetingForDateTime = new EventEmitter<{ date: Date; time: string }>();
  @Output() onMeetingClick = new EventEmitter<Meeting>();

  dayMeetings: Meeting[] = [];
  timeSlots: TimeSlot[] = [];
  isToday = false;
  extendedHours: number[] = [];

  constructor(
    public content: ContentService,
    private calendarUtils: CalendarUtilsService,
  ) {
    this.extendedHours = this.calendarUtils.getExtendedHours();
  }

  ngOnChanges() {
    this.isToday = this.currentDate.toDateString() === new Date().toDateString();
  }

  navigateDay(direction: "prev" | "next") {
    const newDate = new Date(this.currentDate);
    newDate.setDate(this.currentDate.getDate() + (direction === "prev" ? -1 : 1));
    this.onDateChange.emit(newDate);
  }

  formatHour(hour: number): string {
    return new Date(0, 0, 0, hour).toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  }

  getTimeSlotContainerClass(hour: number): string {
    return (
      "flex border-b border-color-hover " +
      (this.isTimeSlotAvailable(hour) ? "hover:bg-color-hover/10 cursor-pointer group" : "cursor-not-allowed")
    );
  }

  getTimeSlotContentClass(hour: number): string {
    return "flex-1 p-3 min-h-[80px] relative " + (!this.isTimeSlotAvailable(hour) ? "bg-red-50 dark:bg-red-900/20" : "");
  }

  isTimeSlotAvailable(hour: number): boolean {
    const timeString = `${hour.toString().padStart(2, "0")}:00`;
    const timeSlot = this.timeSlots.find((slot) => slot.time === timeString);
    return timeSlot?.isAvailable ?? true;
  }

  getSlotMeetings(hour: number): Meeting[] {
    const timeString = `${hour.toString().padStart(2, "0")}:00`;
    const timeSlot = this.timeSlots.find((slot) => slot.time === timeString);
    return timeSlot?.meetings ?? [];
  }

  handleTimeSlotClick(hour: number) {
    const timeString = `${hour.toString().padStart(2, "0")}:00`;
    if (this.isTimeSlotAvailable(hour)) {
      this.onCreateMeetingForDateTime.emit({
        date: this.currentDate,
        time: timeString,
      });
    }
  }
}
