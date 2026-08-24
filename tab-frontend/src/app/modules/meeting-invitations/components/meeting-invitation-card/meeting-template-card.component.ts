import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MeetingInvitation } from '../../models/meeting-invitation';
import { MeetingPlatfrom } from '../../../meetings/models/meeting';

@Component({
  selector: 'app-meeting-invitation-card',
  templateUrl: './meeting-invitation-card.component.html',
  styleUrl: './meeting-invitation-card.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingInvitationCardComponent {
  @Input()
  invitation!: MeetingInvitation;

  @Output() delete = new EventEmitter<string>();

  getPlatformName(value: number): string {
    return MeetingPlatfrom[value];
  }

  onDeleteClick(): void {
    this.delete.emit(this.invitation._id);
  }
}
