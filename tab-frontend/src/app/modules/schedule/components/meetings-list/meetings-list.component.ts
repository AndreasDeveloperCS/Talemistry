import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core"
import { ContentService } from "../../../general/services/content.service";
import { Meeting } from "../../../meetings/models/meeting";

@Component({
  selector: "app-meetings-list",
  templateUrl: './meetings-list.component.html',
  styleUrl: './meetings-list.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingsListComponent {
  @Input() meetings: Meeting[] = [];
  @Input() selectedDate: Date = new Date;
  @Input() title = "Meetings";
  @Input() emptyMessage = "No meetings scheduled for this date.";

  @Output() onCreateMeeting = new EventEmitter<void>();
  @Output() onMeetingClick = new EventEmitter<any>();

  constructor(
    public content: ContentService,
  ) { }

  ngOnInit() {
    console.log('MeetingsListComponent', this.meetings);
  }

  ngOnChanges() {
    console.log('MeetingsListComponent', this.meetings);
  }
}
