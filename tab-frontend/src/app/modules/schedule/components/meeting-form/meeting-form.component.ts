import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from "@angular/core"
import { MeetingsService } from "../../services/meetings.service"
import { ContentService } from "../../../general/services/content.service";
import { Meeting } from "../../../meetings/models/meeting";

@Component({
  selector: "app-meeting-form",
  templateUrl: './meeting-form.component.html',
  styleUrl: './meeting-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingFormComponent implements OnInit {
  @Input() selectedDate?: Date;
  @Input() selectedTime?: string;

  @Output() onSubmit = new EventEmitter<Omit<Meeting, "id">>();
  @Output() onCancel = new EventEmitter<void>();

  meetingTypes = [
    { label: 'Interview', value: 'interview' },
    { label: 'Screening', value: 'screening' },
    { label: 'Team Meeting', value: 'team-meeting' },
    { label: 'Other', value: 'other' }
  ];

  defaultType: string = 'Interview';

  formData: any = {
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    attendees: "",
    type: "interview",
    candidate: "",
    position: "",
    interviewer: "",
    location: "",
    isVirtual: true,
    meetingLink: "",
  };

  timeConflict: string | null = null;

  constructor(
    private meetingsService: MeetingsService,
    public content: ContentService,
  ) { }

  ngOnInit() {
    this.initializeFormData();
  }

  initializeFormData() {
    // Calculate default start and end times
    const startTime = this.getDefaultStartTime();
    const endTime = this.getDefaultEndTime();

    this.formData = {
      title: "",
      description: "",
      startTime,
      endTime,
      attendees: "",
      type: "interview",
      candidate: "",
      position: "",
      interviewer: "",
      location: "",
      isVirtual: true,
      meetingLink: "",
    };

    this.checkTimeConflicts();
  }

  getDefaultStartTime(): string {
    if (this.selectedDate && this.selectedTime) {
      const [hours, minutes] = this.selectedTime.split(":").map(Number);
      const date = new Date(this.selectedDate);
      date.setHours(hours, minutes, 0, 0);
      return this.formatDateTimeForInput(date);
    }
    if (this.selectedDate) {
      const date = new Date(this.selectedDate);
      date.setHours(9, 0, 0, 0); // Default to 9 AM
      return this.formatDateTimeForInput(date);
    }
    return "";
  }

  getDefaultEndTime(): string {
    if (this.selectedDate && this.selectedTime) {
      const [hours, minutes] = this.selectedTime.split(":").map(Number);
      const date = new Date(this.selectedDate);
      date.setHours(hours + 1, minutes, 0, 0); // Default to 1 hour duration
      return this.formatDateTimeForInput(date);
    }
    if (this.selectedDate) {
      const date = new Date(this.selectedDate);
      date.setHours(10, 0, 0, 0); // Default to 10 AM (1 hour after default start)
      return this.formatDateTimeForInput(date);
    }
    return "";
  }

  formatDateTimeForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  checkTimeConflicts() {
    // if (this.formData.startTime && this.formData.endTime) {
    //   const startTime = new Date(this.formData.startTime);
    //   const endTime = new Date(this.formData.endTime);

    //   const conflictingMeetings = this.meetingsService.checkTimeConflict(startTime, endTime);

    //   if (conflictingMeetings.length > 0) {
    //     const conflictTitles = conflictingMeetings.map((m) => m.title).join(", ");
    //     this.timeConflict = `This time conflicts with: ${conflictTitles}`;
    //   } else {
    //     this.timeConflict = null;
    //   }
    // }
  }

  handleSubmit() {
    // if (this.timeConflict) {
    //   return; // Don't submit if there's a conflict
    // }

    // const meeting: Omit<Meeting, "id"> = {
    //   title: this.formData.title,
    //   description: this.formData.description,
    //   startTime: new Date(this.formData.startTime),
    //   endTime: new Date(this.formData.endTime),
    //   attendees: this.formData.attendees.split(",").map((email: string) => email.trim()),
    //   type: this.formData.type,
    //   candidate: this.formData.candidate,
    //   position: this.formData.position,
    //   interviewer: this.formData.interviewer,
    //   location: this.formData.location,
    //   isVirtual: this.formData.isVirtual,
    //   meetingLink: this.formData.meetingLink,
    // };

    // this.onSubmit.emit(meeting);
  }

  getSelectedType(): string {
    return this.formData.get('type')?.value;
  }
}
