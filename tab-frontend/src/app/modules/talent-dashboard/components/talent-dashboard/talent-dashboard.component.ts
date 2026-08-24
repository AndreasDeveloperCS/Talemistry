import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { take } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { BaseEntity, PositionEntity } from 'src/app/modules/general/models/base-entity';
import { Filtering, Sorting } from 'src/app/modules/general/services/search-logic.service';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { Meeting, MeetingPlatfrom, MeetingStatus, meetingStatusLabels, ParticipantInfo } from 'src/app/modules/meetings/models/meeting';
import { MeetingService } from 'src/app/modules/meetings/services/meeting.service';
import { EnrichedAppliedPositionsProgress } from 'src/app/modules/position-management/models/talent-pipeline-progress';
import { TalentPipelineProgressService } from 'src/app/modules/position-management/services/talent-pipeline-progress.service';
import { StageType } from 'src/app/modules/position-pipelines/models/pipeline-stage';
import { PositionsService } from 'src/app/modules/positions/services/positions.service';
import { CalendarUtilsService } from 'src/app/modules/schedule/services/calendar-utils.service';
import { environment } from 'src/environments/environment';
import { getPropertyName } from 'src/shared-functions/shared-functions';
import { MatchingPositions, PositionMatchResult } from '../../interfaces/position-match.interface';
import { ApplicationStats, FunnelBar } from '../../models/dashboard-stats';

@Component({
  selector: 'app-talent-dashboard',
  templateUrl: './talent-dashboard.component.html',
  styleUrl: './talent-dashboard.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TalentDashboardComponent implements OnInit {
  userId: string = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  isLoading: boolean = false;
  sorting: Sorting = {
    property: getPropertyName<PositionEntity>(e => e.appliedDate),
    direction: 'DESC'
  };
  sortingProcessed: Sorting = {
    property: getPropertyName<PositionEntity>(e => e.appliedDate),
    direction: "ASC"
  };
  filtering: Filtering = [];
  pageSize: number = 10;
  pageIndex: number = 0;
  matchingPositions: MatchingPositions = { total: 0, highMatch: 0, mediumMatch: 0, lowMatch: 0 };

  applicationStats: ApplicationStats = {
    total: 0,
    applied: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    rejected: 0
  };

  topMatchingJobs: PositionMatchResult[] = [];
  appliedPositions: EnrichedAppliedPositionsProgress[] = [];
  funnelBars: FunnelBar[] = [];
  upcomingMeetings: Meeting[] = [];
  MeetingPlatfrom = MeetingPlatfrom;
  animatedMatchingTotal = 0;
  animatedHighMatch = 0;
  animatedMediumMatch = 0;
  animatedLowMatch = 0;
  animatedApplicationsTotal = 0;
  animatedInterview = 0;
  animatedOffer = 0;
  readonly svgWidth = 560;
  readonly svgHeight = 260;
  private dashboardReady = false;
  private matchesReady = false;

  readonly stageColors: Record<string, string> = {
    applied: '#64748b',
    screening: '#2e9c9c',
    interview: '#1ab8b8',
    offer: '#f5a623',
    rejected: '#ef4444',
    hired: '#22c55e',
  };

  constructor(
    private talentPipelineProgressService: TalentPipelineProgressService,
    private cdr: ChangeDetectorRef,
    private meetingService: MeetingService,
    private calendarUtils: CalendarUtilsService,
    private positionsService: PositionsService,
    private uiInteractionService: UiInteractionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadTopPositionMatches();
  }

  loadDashboardData(): void {
    if (!this.userId) {
      return;
    }

    this.isLoading = true;

    this.talentPipelineProgressService
      .getAppliedPositionsByTalentId(this.userId, this.pageSize, this.pageIndex, this.sorting, this.filtering, true, false)
      .pipe(take(1))
      .subscribe({
        next: (res: any) => {
          console.log('Dashboard positions', res);
          if (res?.items?.length) {
            this.appliedPositions = res?.items || [];
            this.buildStats(res.funnel, res.totalItems);
            this.buildFunnelBars();
          }
          this.dashboardReady = true;
          this.tryStartAnimation();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Dashboard error', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  startStatsAnimation(): void {
    this.animateValue('animatedApplicationsTotal', this.applicationStats.total);
    this.animateValue('animatedInterview', this.applicationStats.interview);
    this.animateValue('animatedOffer', this.applicationStats.offer);
    this.animateValue('animatedMatchingTotal', this.matchingPositions.total || 0);
    this.animateValue('animatedHighMatch',this.matchingPositions.highMatch || 0);
    this.animateValue('animatedMediumMatch',this.matchingPositions.mediumMatch || 0);
    this.animateValue('animatedLowMatch', this.matchingPositions.lowMatch || 0);
  }

  loadTopPositionMatches(): void {
    if (!this.userId) {
      return;
    }

    this.positionsService.getTopPositionMatches()
      .pipe(take(1))
      .subscribe({
        next: (res: PositionMatchResult[]) => {
          console.log('Top position matches', res);
          if (res.length) {
            this.topMatchingJobs = res;
            this.matchingPositions = {
              total: res.length,
              highMatch: res.filter(x => x.matchPercentage >= 75).length,
              mediumMatch: res.filter(x => x.matchPercentage >= 45 && x.matchPercentage < 75).length,
              lowMatch: res.filter(x => x.matchPercentage < 45).length
            };
            this.matchesReady = true;
            this.tryStartAnimation();
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Top position matches error', err);
          this.cdr.markForCheck();
        }
      });
  }

  private tryStartAnimation(): void {
    if (!this.dashboardReady || !this.matchesReady) {
      return;
    }
    this.startStatsAnimation();
  }

  loadUpcomingMeetings() {
    if(this.userId) {
      const { startDate, endDate } = this.calendarUtils.getCalendarRange(new Date());
      const email = this.authService.getCurrentUser()?.email;

      if (email) {
        this.meetingService.getMeetingsByRangeAsync(new Date(), endDate)
          .pipe(take(1)).subscribe({
            next: (data: Meeting[]) => {
              console.log('Scheduled Meetings:', data);
              this.upcomingMeetings = data;
              this.cdr.markForCheck();
            },
            error: (err) => {
              console.error('Error loading Scheduled Meetings', err);
              this.cdr.markForCheck();
            },
          });
      }
    }
  }

  private buildStats(funnel: any, total: number): void {
    this.applicationStats = {
      total,
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      rejected: 0
    };

    if (!funnel) {
      return;
    }

    this.applicationStats.applied = (funnel[StageType.CV_REVIEW] || 0);
    this.applicationStats.screening = funnel[StageType.SCREENING] || 0;
    this.applicationStats.interview = funnel[StageType.INTERVIEW] || 0;
    this.applicationStats.offer = funnel[StageType.OFFER] || 0;
  }

  animateValue(property: keyof this, target: number = 0, duration: number = 1400): void {
    target = Number(target) || 0;
    const start = 0;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      (this[property] as number) = Math.floor(start + (target - start) * easedProgress);
      this.cdr.markForCheck();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        (this[property] as number) = target;
        this.cdr.markForCheck();
      }
    };
    requestAnimationFrame(animate);
  }

  private buildFunnelBars(): void {
    const max = this.applicationStats.total || 1;
    this.funnelBars = [
      {
        name: 'Applied',
        count: this.applicationStats.applied,
        color: '#64748b',
        pct: (this.applicationStats.applied / max) * 100
      },
      {
        name: 'Screening',
        count: this.applicationStats.screening,
        color: '#2e9c9c',
        pct: (this.applicationStats.screening / max) * 100
      },
      {
        name: 'Interview',
        count: this.applicationStats.interview,
        color: '#1ab8b8',
        pct: (this.applicationStats.interview / max) * 100
      },
      {
        name: 'Offer',
        count: this.applicationStats.offer,
        color: '#f5a623',
        pct: (this.applicationStats.offer / max) * 100
      },
      {
        name: 'Rejected',
        count: this.applicationStats.rejected,
        color: '#ef4444',
        pct: (this.applicationStats.rejected / max) * 100
      }
    ];
  }

  formatDate(date: string | Date): string {
    if (!date) {
      return '';
    }
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getFunnelSegments(): { path: string; cx: number; cy: number; value: number; stageType: StageType; name: string; color: string; }[] {
    const stages = [
      {
        name: 'Applied',
        stageType: StageType.CV_REVIEW,
        value: this.applicationStats.applied,
        color: '#64748b'
      },
      {
        name: 'Screening',
        stageType: StageType.SCREENING,
        value: this.applicationStats.screening,
        color: '#2e9c9c'
      },
      {
        name: 'Assessment',
        stageType: StageType.ASSESSMENT,
        value: this.applicationStats.screening,
        color: '#2e9c9c'
      },
      {
        name: 'Interview',
        stageType: StageType.INTERVIEW,
        value: this.applicationStats.interview,
        color: '#1ab8b8'
      },
      {
        name: 'Offer',
        stageType: StageType.OFFER,
        value: this.applicationStats.offer,
        color: '#f5a623'
      }
    ];

    const n = stages.length;
    const segH = this.svgHeight / n;
    const cx = this.svgWidth / 2;
    const maxW = 500;
    const minW = 60;
    const maxVal = stages[0].value || 1;
    return stages.map((stage, i) => {
      const topW = (stage.value / maxVal) * maxW;
      const nextVal = i < n - 1 ? stages[i + 1].value : 0;
      const botW = i < n - 1 ? (nextVal / maxVal) * maxW : minW;
      const y1 = i * segH;
      const y2 = (i + 1) * segH;
      const path =
        `M ${cx - topW / 2} ${y1}
         L ${cx + topW / 2} ${y1}
         L ${cx + botW / 2} ${y2}
         L ${cx - botW / 2} ${y2}
         Z`;

      return { path, cx, cy: y1 + segH / 2, value: stage.value, name: stage.name, stageType: stage.stageType, color: stage.color };
    });
  }

  getStageClass(stage: StageType): string {
    const map: Record<StageType, string> = {
      [StageType.DEFAULT]: 'stage--default',
      [StageType.CV_REVIEW]: 'stage--applied',
      [StageType.SCREENING]: 'stage--screening',
      [StageType.ASSESSMENT]: 'stage--assessment',
      [StageType.INTERVIEW]: 'stage--interview',
      [StageType.OFFER]: 'stage--offer',
      [StageType.FINAL]: 'stage--hired',
    };
    return map[stage] ?? 'stage--applied';
  }

  getStageIcon(stage: StageType): string {
    const map: Record<StageType, string> = {
      [StageType.DEFAULT]: 'schedule',
      [StageType.CV_REVIEW]: 'how_to_reg',
      [StageType.SCREENING]: 'person_search',
      [StageType.ASSESSMENT]: 'assignment',
      [StageType.INTERVIEW]: 'groups',
      [StageType.OFFER]: 'handshake',
      [StageType.FINAL]: 'verified',
    };
    return map[stage] ?? 'circle';
  }

  getMatchBadgeClass(score: number): string {
    if (score >= 75) {
      return 'match-badge--high';
    }
    if (score >= 50) {
      return 'match-badge--medium';
    }
    return 'match-badge--low';
  }

  getPlatformIcon(platform: MeetingPlatfrom | undefined): string {
    switch (platform) {
      case MeetingPlatfrom.ZOOM:
        return 'video_call';
      case MeetingPlatfrom.TEAMS:
        return 'groups';
      case MeetingPlatfrom.GOOGLE_MEET:
        return 'videocam';
      case MeetingPlatfrom.EVRYKA:
        return 'hub';
      default:
        return 'videocam';
    }
  }

  getParticipantNames(participants: ParticipantInfo[]): string {
    if (!participants?.length) {
      return 'No participants';
    }
    return participants.slice(0, 2).map(p => `${p.firstname} ${p.lastname}`).join(', ') +
      (participants.length > 2 ? ` +${participants.length - 2}` : '');
  }

  getPlatformClass(platform: MeetingPlatfrom | undefined): string {
    switch (platform) {
      case MeetingPlatfrom.ZOOM:
        return 'meeting-platform--zoom';
      case MeetingPlatfrom.TEAMS:
        return 'meeting-platform--teams';
      case MeetingPlatfrom.GOOGLE_MEET:
        return 'meeting-platform--google';
      case MeetingPlatfrom.EVRYKA:
        return 'meeting-platform--evryka';
      default:
        return '';
    }
  }

  getStatusLabel(status?: MeetingStatus): string {
    if (status === undefined || status === null) {
      return 'Unknown';
    }
    return meetingStatusLabels[status] || 'Unknown';
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

  formatDuration(meeting: Meeting): string {
    const start = meeting?.timeSlot?.startTime;
    const end = meeting?.timeSlot?.endTime;

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

  openPositionPreview(positionId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'position',
      id: positionId
    });
  }

  openPositionsListPreview(event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'positions-list',
      id: ''
    });
  }

  openAppliedPositionsPreview(event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'applied-positions',
      id: ''
    });
  }

  openAppliedPositionsReachedStagePreview(stageType: StageType, event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'applied-positions',
      id: '',
      payload: {
        initialStageType: stageType
      }
    });
  }

  openPositionsReachedInterviewStage(event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'applied-positions',
      id: '',
      payload: {
        initialStageType: StageType.INTERVIEW
      }
    });
  }

  openPositionsReachedOfferStage(event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'applied-positions',
      id: '',
      payload: {
        initialStageType: StageType.OFFER
      }
    });
  }

  openAppliedPositionDetails(app: any, event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'applied-position-details',
      id: '',
      payload: {
        application: app
      }
    });
  }

  openCompanyPreview(companyId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'company',
      id: companyId
    });
  }

  openMeetingsList(event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'meetings-list',
      id: ''
    });
  }

  openMeetingPreview(meeting: Meeting, event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'meeting',
      id: meeting._id
    });
  }
}