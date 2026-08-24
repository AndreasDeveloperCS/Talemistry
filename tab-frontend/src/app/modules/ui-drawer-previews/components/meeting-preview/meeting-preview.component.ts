import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { CopyToastService } from 'src/app/modules/general/services/copy-toast.service';
import { Meeting, meetingPlatformLabels, MeetingPlatfrom, MeetingStatus, meetingStatusLabels } from 'src/app/modules/meetings/models/meeting';
import { MeetingService } from 'src/app/modules/meetings/services/meeting.service';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { ROLES } from 'src/app/modules/authentication/models/roles';

@Component({
  selector: 'app-meeting-preview',
  standalone: true,
  imports: [CommonModule, MatIconModule, SunSpinnerComponent,],
  templateUrl: './meeting-preview.component.html',
  styleUrl: './meeting-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingPreviewComponent implements OnInit {
  @Input() 
  meetingId!: string;

  meeting!: Meeting;
  loading: boolean = true;
  isRecruiter: boolean = false;
  isTalent: boolean = false;
  isMeetingUpcoming: boolean = true;

  constructor(
    private meetingService: MeetingService,
    private uiInteractionService: UiInteractionService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private copyToastService: CopyToastService
  ) {
    const roles = this.authService.getRoles();
    if(roles.includes(ROLES.HR) || roles.includes(ROLES.HM) || roles.includes(ROLES.RC)) {
      this.isRecruiter = true;
    }
    if(roles.includes(ROLES.TALENT)) {
      this.isTalent = true;
    }
  }

  ngOnInit(): void {
    this.loadMeeting();
  }

  loadMeeting(): void {
    if (!this.meetingId) {
      return;
    }

    this.meetingService
      .getByIdAsync(this.meetingId)
      .pipe(take(1))
      .subscribe({
        next: (res: Meeting) => {
          console.log('Selected meeting:', res);
          this.meeting = res;
          this.isMeetingUpcoming = this.meeting.startTime < new Date();
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load meeting with ID:', this.meetingId, error);
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  openPosition(): void {
    if (!this.meeting?.positionId) {
      return;
    }

    this.uiInteractionService.openDrawer({
      type: 'position',
      id: this.meeting.positionId,
    });
  }

  openParticipant(participant: any): void {
    if (!participant?.email) {
      return;
    }

    this.uiInteractionService.openDrawer({
      type: 'candidate',
      id: participant.email,
    });
  }

  private getMeetingJoinLink(): string | null {
    const m = this.meeting;

    if (m?.meetingLinkEvryka) {
      return m.meetingLinkEvryka;
    }
    if (m?.meetingLinkGoogleMeets?.hangoutLink) {
      return m.meetingLinkGoogleMeets.hangoutLink;
    }
    if (m?.meetingLinkZoom?.join_url) {
      return m.meetingLinkZoom.join_url;
    }
    if (m?.meetingLinkTeams?.joinUrl) {
      return m.meetingLinkTeams.joinUrl;
    }

    return null;
  }

  joinMeeting(): void {
    const link = this.getMeetingJoinLink();
    if (!link) {
      return;
    }
    window.open(link, '_blank');
  }

  reschedule(): void {
    console.log('Reschedule meeting', this.meeting);
  }

  copyLink(): void {
    const link = this.getMeetingJoinLink();
    if (!link) {
      return;
    }
    navigator.clipboard.writeText(link);
    this.copyToastService.show('Meeting link copied');
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0:
        return 'draft';
      case 1:
        return 'requested';
      case 2:
        return 'confirmed';
      case 3:
        return 'cancelled';
      case 4:
        return 'tentative';
      default:
        return 'draft';
    }
  }

  formatDuration(): string {
    const start = this.meeting?.timeSlot?.startTime;
    const end = this.meeting?.timeSlot?.endTime;

    if (!start || !end) {
      return '';
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (hours > 0) {
      return `${hours}h`;
    }

    return `${minutes} min`;
  }

  formatDate(): string {
    return new Date(this.meeting?.date).toLocaleDateString();
  }

  formatTime(): string {
    return new Date(this.meeting?.startTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  getPlatformLabel(platform?: MeetingPlatfrom): string {
    if (platform === undefined || platform === null) {
      return 'Unknown';
    }
    return meetingPlatformLabels[platform] || 'Unknown';
  }

  getStatusLabel(status?: MeetingStatus): string {
    if (status === undefined || status === null) {
      return 'Unknown';
    }
    return meetingStatusLabels[status] || 'Unknown';
  }

  getFormattedAgenda(agenda: string): string {
    return agenda ? agenda.replace(/\r?\n/g, '<br>') : '';
  }

  openChatWithApplicant(): void {
    if (!this.meeting?.createdBy || !this.isRecruiter) {
      return;
    }

    this.uiInteractionService.openDrawer({
      type: 'chat',
      payload: {
        contactId: this.meeting.createdBy,
        selectedPositionId: this.meeting.positionId
      },
      id: this.meeting.createdBy,
    });
  }

  openChatWithRecruiter(): void {
    if (this.meeting?.invitationId === null || !this.isTalent || !this.meeting?.userId) {
      return;
    }

    this.uiInteractionService.openDrawer({
      type: 'chat',
      payload: {
        contactId: this.meeting.userId,
        selectedPositionId: this.meeting.positionId
      },
      id: this.meeting.userId,
    });
  }
}