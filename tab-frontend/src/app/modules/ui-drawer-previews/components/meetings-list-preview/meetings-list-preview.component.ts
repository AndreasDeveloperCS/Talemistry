import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, take, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { Meeting, meetingPlatformLabels, MeetingPlatfrom, MeetingStatus, meetingStatusLabels } from 'src/app/modules/meetings/models/meeting';
import { MeetingService } from 'src/app/modules/meetings/services/meeting.service';

@Component({
  selector: 'app-meetings-list-preview',
  templateUrl: './meetings-list-preview.component.html',
  styleUrl: './meetings-list-preview.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingsListPreviewComponent implements OnInit, OnDestroy {
  @Input()
  positionId?: string;

  @Input()
  candidateId?: string;

  @Input()
  companyId?: string;

  protected _onDestroy = new Subject<void>();
  meetings: any[] = [];
  filteredMeetings: any[] = [];
  showPastMeetings = false;
  groupedMeetings: { label: string; meetings: any[]; }[] = [];
  loading: boolean = true;
  activeFilter = 'today';
  search: string = '';
  searchChanged: Subject<string> = new Subject<string>();

  constructor(
    private meetingService: MeetingService,
    private uiInteractionService: UiInteractionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadMeetings();
    this.searchChanged.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).pipe(takeUntil(this._onDestroy))
    .subscribe(() => {
        this.loadMeetings();
    });
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  loadMeetings(): void {
    this.loading = true;
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (this.showPastMeetings) {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      endDate = now;
    } else {
      startDate = now;
      endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 3);
    }

    this.meetingService.getMeetingsByRangeAsync(startDate, endDate)
      .pipe(take(1))
      .subscribe({
        next: (data: Meeting[]) => {
          console.log('Scheduled Meetings:', data);
          this.meetings = data || [];
          this.applyFilters();
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading meetings', err);
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.searchChanged.next(value);
  }

  toggleMeetingView(value: boolean): void {
    this.showPastMeetings = value;
    this.activeFilter = 'today';
    this.loadMeetings();
  }

  applyFilters(): void {
    let meetings = [...this.meetings];
    if(this.positionId) {
      meetings = meetings.filter(x => x.positionId === this.positionId);
    }
    if(this.companyId) {
      meetings = meetings.filter(x => x.companyId === this.companyId);
    }
    if(this.candidateId) {
      meetings = meetings.filter(x =>
        x.participants?.some((p: any) => p.userId === this.candidateId)
      );
    }
    if(this.search.trim()) {
      const value = this.search.toLowerCase();
      meetings = meetings.filter(x =>
        x.topic?.toLowerCase().includes(value)
        || x.positionName?.toLowerCase().includes(value)
        || x.companyName?.toLowerCase().includes(value)
      );
    }
    if (!this.showPastMeetings) {
      meetings = this.filterByDate(meetings);
    }

    meetings.sort((a, b) => {
      return this.showPastMeetings
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime();
  });

    this.filteredMeetings = meetings;
    this.groupMeetings();
  }

  filterByDate(meetings: any[]): any[] {
    const now = new Date();
    let filtered = meetings;
    filtered = filtered.filter(x => {
      const date = new Date(x.date);
      return this.showPastMeetings ? date < now : date >= now;
    });

    if (this.activeFilter === 'today') {
      return filtered.filter(x => {
        const date = new Date(x.date);
        return (date.toDateString() === now.toDateString());
      });
    }

    if (this.activeFilter === 'week') {
      const week = new Date();
      week.setDate(now.getDate() + 7);
      return filtered.filter(x => {
        const date = new Date(x.date);
        if (this.showPastMeetings) {
          return (date <= now && date >= new Date(+now.getTime() - 7 * 24 * 60 * 60 * 1000));
        }
        return (date >= now && date <= week);
      });
    }

    if (this.activeFilter === 'month') {
      return filtered.filter(x => {
        const date = new Date(x.date);
        return (date.getMonth() === now.getMonth());
      });
    }

    return filtered;
  }

  groupMeetings(): void {
    const groups: any = {};
    this.filteredMeetings.forEach(meeting => {
      const date = new Date(meeting.date);
      const label = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
      if(!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(meeting);
    });

    this.groupedMeetings = Object.keys(groups).map(key => ({ label: key, meetings: groups[key] }));
  }

  openMeeting(meetingId: string): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'meeting',
      id: meetingId
    });
  }

  openPosition(positionId: string): void {
    this.uiInteractionService.openDrawer({
      type: 'position',
      id: positionId
    });
  }

  getPlatformIcon(platform: string): string {
    switch(platform) {
      case 'GOOGLE_MEET':
        return 'videocam';
      case 'ZOOM':
        return 'groups';
      case 'TEAMS':
        return 'business_center';
      default:
        return 'video_call';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      case 'live':
        return 'live';
      default:
        return 'scheduled';
    }
  }

  formatDuration(meeting: Meeting): string {
    const start = meeting.timeSlot?.startTime;
    const end = meeting.timeSlot?.endTime;

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

  trackByMeeting(index: number, item: any): string {
    return item._id;
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
}