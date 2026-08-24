import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core"
import { Meeting } from "../../../meetings/models/meeting";

@Component({
  selector: "app-meeting-card",
  templateUrl: './meeting-card.component.html',
  styleUrl: './meeting-card.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingCardComponent {
  @Input() meeting!: Meeting;
  @Output() onMeetingClick = new EventEmitter<Meeting>();
}
