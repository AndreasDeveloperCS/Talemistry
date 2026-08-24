import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { ContentService } from '../../../general/services/content.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Meeting } from '../../../meetings/models/meeting';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-scheduled-meeting-info',
  templateUrl: './scheduled-meeting-info.component.html',
  styleUrl: './scheduled-meeting-info.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduledMeetingInfoComponent {

  constructor(public content: ContentService,
    public dialogRef: MatDialogRef<ScheduledMeetingInfoComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: Meeting
  ) {
    console.log('ScheduledMeetingInfoComponent data', data);
   }

  get formattedAgenda(): string {
    return this.data?.agenda
      ? this.data.agenda.replace(/\r?\n/g, '<br>')
      : '';
  }

  onCancel() {
    this.dialogRef.close();
  }
}
