import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { take } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { BaseEntity, OwnerEntity, PositionEntity } from 'src/app/modules/general/models/base-entity';
import { Filtering, FilterRule, Sorting } from 'src/app/modules/general/services/search-logic.service';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { Meeting, MeetingPlatfrom, MeetingStatus, meetingStatusLabels, ParticipantInfo } from 'src/app/modules/meetings/models/meeting';
import { MeetingService } from 'src/app/modules/meetings/services/meeting.service';
import { PipelineStage, StageType } from 'src/app/modules/position-pipelines/models/pipeline-stage';
import { PositionStatus } from 'src/app/modules/positions/models/position-details';
import { PositionsService } from 'src/app/modules/positions/services/positions.service';
import { CalendarUtilsService } from 'src/app/modules/schedule/services/calendar-utils.service';
import { environment } from 'src/environments/environment';
import { getPropertyName } from 'src/shared-functions/shared-functions';
import { HrDashboardStats } from '../../../ui-drawer-previews/models/dashboard-stats';
import { FunnelStage, RecruitmentFunnel, RecruitmentPipelineStageInfo } from '../../../ui-drawer-previews/models/recruitment-funnel';

@Component({
  selector: 'app-recruiter-dashboard',
  templateUrl: './recruiter-dashboard.component.html',
  styleUrl: './recruiter-dashboard.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruiterDashboardComponent implements OnInit {
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  selectedPageSize: number = 10;
  sorting: Sorting = {
    property: getPropertyName<BaseEntity>(e => e.createdDate),
    direction: 'DESC'
  };
  filtering: Filtering = [];
  pageIndex: number = 0;
  funnels: RecruitmentFunnel[] = [];
  currentFunnelData: FunnelStage[] = [];
  selectedPositionId: string | null = null;
  currentFunnelTitle = 'Recruitment Funnel — All Positions';
  selectedPositionDetail: RecruitmentFunnel | null = null;
  selectedPositionStatus: PositionStatus | 'all' | string = PositionStatus.ACTIVE;
  PositionStatus = PositionStatus;
  upcomingMeetings: Meeting[] = [];
  MeetingPlatfrom = MeetingPlatfrom;
  
  readonly svgWidth = 600;
  readonly svgHeight = 280;
  readonly funnelMaxWidth = 520;
  readonly funnelMinWidth = 60;

  readonly positionStatuses = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: PositionStatus.ACTIVE },
    { label: 'Paused', value: PositionStatus.PAUSED },
    { label: 'Closed', value: PositionStatus.CLOSED }
  ];

  readonly funnelStageOrder: StageType[] = [
    StageType.DEFAULT,
    StageType.CV_REVIEW,
    StageType.SCREENING,
    StageType.ASSESSMENT,
    StageType.INTERVIEW,
    StageType.OFFER,
    StageType.FINAL
  ];

  readonly funnelColors = [ '#3d7a7a', '#2e9c9c', '#1ab8b8', '#d98b00', '#f5a623', '#7b61ff',
    '#ff5c8a', '#5b8def', '#6dbf67', '#9c6ade'];

  dashboardStats: HrDashboardStats = {
    positions: { active: 0, closed: 0, draft: 0, newThisWeek: 0, newThisMonth: 0 },
    candidates: { total: 0, addedThisWeek: 0, addedThisMonth: 0 },
    meetings: { today: 0, week: 0, month: 0, total: 0 },
    pipeline: { interviews: 0, offers: 0, hires: 0 },
    trends: { positionsDeltaWeek: 0, candidatesDeltaWeek: 0, interviewsDeltaWeek: 0 }
  };

  positionStats = { active: 0, closed: 0, draft: 0, totalCandidates: 0 };
  meetingStats = { today: 0, week: 0, month: 0, total: 0 };
  animatedStats = { activePositions: 0, totalCandidates: 0, meetingsToday: 0, pipelineInterviews: 0 };

  constructor(private positionsService: PositionsService,
    private cdr: ChangeDetectorRef,
    private meetingService: MeetingService,
    private calendarUtils: CalendarUtilsService,
    private uiInteractionService: UiInteractionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getHrDashboardStats();
    this.getAllPositionsInfo();
    this.getUpcomingMeetings();
    this.updateFunnel(null);
  }

  getHrDashboardStats() {
    if(this.userId) {
      this.positionsService.getHrDashboardStats(true)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          console.log('HR Dashboard Stats', res);
          if(res) {
            this.dashboardStats = res;

            this.positionStats = {
              active: res.positions.active,
              closed: res.positions.closed,
              draft: res.positions.draft,
              totalCandidates: res.candidates.total
            };

            this.meetingStats = {
              today: res.meetings.today,
              week: res.meetings.week,
              month: res.meetings.month,
              total: res.meetings.total
            };

            this.animateValue('activePositions', res.positions.active);
            this.animateValue('totalCandidates', res.candidates.total);
            this.animateValue('meetingsToday', res.meetings.today);
            this.animateValue('pipelineInterviews', res.pipeline.interviews);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading data', err);
          this.cdr.markForCheck();
        },
      });
    }
  }

  getAllPositionsInfo(): void {
    if(this.userId) {
      this.buildFilters();
      this.positionsService
      .getAllAsyncForHrFunnel(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering, true, false)
      .pipe(take(1)).subscribe({
        next: (res) => {
          console.log('Recruitment funnels', res);
          if(res) {
            this.funnels = res.items || [];
            this.updateFunnel(null);
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error loading data', err);
          this.cdr.markForCheck();
        },
      });
    }
  }

  private buildFilters() {
    this.filtering = [];

    this.filtering.push({
      property: getPropertyName<OwnerEntity>((e: OwnerEntity) => e.userId),
      rule: FilterRule.EQUALS,
      value: this.userId
    });

    if (this.selectedPositionStatus !== 'all') {
      this.filtering.push({
        property: getPropertyName<PositionEntity>((e: PositionEntity) => e.status),
        rule: FilterRule.EQUALS,
        value: this.selectedPositionStatus
      });
    }
  }

  getUpcomingMeetings() {
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

  getPlatformIcon(platform: MeetingPlatfrom | undefined): string {
    switch (platform) {
      case MeetingPlatfrom.ZOOM:
        return 'video';
      case MeetingPlatfrom.TEAMS:
        return 'users';
      case MeetingPlatfrom.GOOGLE_MEET:
        return 'video';
      case MeetingPlatfrom.EVRYKA:
        return 'share-2';
      default:
        return 'video';
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

  selectPosition(id: string | null): void {
    this.selectedPositionId = id;
    this.updateFunnel(id);
  }

  getSegmentHeight(): number {
    return this.svgHeight / this.currentFunnelData.length;
  }

  private updateFunnel(id: string | null): void {
    this.selectedPositionId = id;

    if (id === null) {
      this.currentFunnelTitle = 'Recruitment Funnel — All Positions';
      this.selectedPositionDetail = null;
      const aggregatedMap = new Map<string, FunnelStage>();

      for (const funnel of this.funnels) {
        for (const stage of funnel.pipelineStagesInfo) {
          const key = stage.stageName;
          if (!aggregatedMap.has(key)) {
            aggregatedMap.set(key, {
              name: stage.stageName,
              value: 0,
              type: stage.stageType,
              color: this.funnelColors[aggregatedMap.size % this.funnelColors.length]
            });
          }
          aggregatedMap.get(key)!.value += stage.candidatesCount;
        }
      }
      this.currentFunnelData = Array.from(aggregatedMap.values());
      return;
    }

    const funnel = this.funnels.find(f => f.positionId === id);

    if (!funnel) {
      return;
    }

    this.selectedPositionDetail = funnel;
    this.currentFunnelTitle = `Recruitment Funnel — ${funnel.positionTitle}`;
    this.currentFunnelData =
      funnel.pipelineStagesInfo.map(
        (stage, index) => ({
          name: stage.stageName,
          type: stage.stageType,
          value: stage.candidatesCount,
          color: this.funnelColors[index % this.funnelColors.length]
        })
      );
    console.log('Current funnel data', this.currentFunnelData);
  }

  getStageTotal(funnel: RecruitmentFunnel): number {
    return funnel.pipelineStagesInfo.reduce((sum, stage) => sum + stage.candidatesCount, 0);
  }

  getStageWidth(funnel: RecruitmentFunnel, stage: RecruitmentPipelineStageInfo): number {
    const total = this.getStageTotal(funnel);
    return total > 0 ? (stage.candidatesCount / total) * 100 : 0;
  }

  getStageColor(index: number): string {
    return this.funnelColors[index % this.funnelColors.length];
  }

  getRatingStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getFunnelTotal(): number {
    if (this.selectedPositionId) {
      const funnel = this.funnels.find(f => f.positionId === this.selectedPositionId);
      return funnel?.applicantsCount || 0;
    }
    return this.funnels.reduce((sum, funnel) => sum + funnel.applicantsCount, 0);
  }

  animateValue(key: keyof typeof this.animatedStats, target: number, duration = 1200): void {
    const start = 0;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.animatedStats[key] = Math.floor(start + (target - start) * eased);
      this.cdr.markForCheck();
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  changeStatusFilter(status: 'all' | PositionStatus): void {
    this.selectedPositionStatus = status;
    this.getAllPositionsInfo();
  }

  getOverallConversionRate(): number {
    if (!this.currentFunnelData.length) {
      return 0;
    }

    const first = this.currentFunnelData[0]?.value || 0;
    const last = this.currentFunnelData[this.currentFunnelData.length - 1]?.value || 0;

    if (!first) {
      return 0;
    }

    return Math.round((last / first) * 100);
  }

  getBiggestDropoff(): any {
    if (this.currentFunnelData.length < 2) {
      return null;
    }

    let maxDrop = 0;
    let result = null;

    for (let i = 0; i < this.currentFunnelData.length - 1; i++) {
      const current = this.currentFunnelData[i].value;
      const next = this.currentFunnelData[i + 1].value;

      if (!current) {
        continue;
      }

      const drop = Math.round(((current - next) / current) * 100);

      if (drop > maxDrop) {
        maxDrop = drop;
        result = {
          from: this.currentFunnelData[i].name,
          to: this.currentFunnelData[i + 1].name,
          drop
        };
      }
    }
    return result;
  }

  isPositionUnhealthy(pos: any): boolean {
    const stages = pos.pipelineStagesInfo || [];

    for (let i = 0; i < stages.length - 1; i++) {
      const current = stages[i].candidatesCount;
      const next = stages[i + 1].candidatesCount;

      if (!current) {
        continue;
      }
      const drop = ((current - next) / current) * 100;
      if (drop >= 60) {
        return true;
      }
    }
    return false;
  }

  getHealthyPositionsCount(): number {
    return this.funnels.filter(x => !this.isPositionUnhealthy(x)).length;
  }

  private sortFunnelStages(stages: FunnelStage[]): any[] {
    return [...stages].sort((a, b) => {
      const aType = (a.type ?? '').toLowerCase();
      const bType = (b.type ?? '').toLowerCase();
      let aIndex = this.funnelStageOrder.indexOf(aType as StageType);
      let bIndex = this.funnelStageOrder.indexOf(bType as StageType);

      if (aIndex === -1) {
        aIndex = Number.MAX_SAFE_INTEGER;
      }

      if (bIndex === -1) {
        bIndex = Number.MAX_SAFE_INTEGER;
      }

      return aIndex - bIndex;
    });
  }

  getFunnelSegments(): any[] {
    const sortedStages = this.sortFunnelStages(this.currentFunnelData);
    const n = sortedStages.length;
    const cx = this.svgWidth / 2;
    const maxVal = Math.max(...sortedStages.map(s => s.value), 1);

    return sortedStages.map((stage, i) => {
      const topW = (stage.value / maxVal) * this.funnelMaxWidth;
      const nextVal = i < n - 1 ? sortedStages[i + 1].value : 0;
      const botW = i === n - 1 ? 0 : nextVal <= 0 ? 8 : (nextVal / maxVal) * this.funnelMaxWidth;
      const segH = this.getSegmentHeight();
      const y1 = i * segH;
      const y2 = (i + 1) * segH;

      const path = `
        M ${cx - topW / 2} ${y1}
        L ${cx + topW / 2} ${y1}
        L ${cx + botW / 2} ${y2}
        L ${cx - botW / 2} ${y2}
        Z
      `;

      const previous = i === 0 ? stage.value : sortedStages[i - 1].value;
      const conversionRate = previous ? Math.round((stage.value / previous) * 100) : 100;
      const dropoff = 100 - conversionRate;
      const isEmpty = stage.value === 0;

      return {
        path,
        labelX: cx,
        labelY: y1 + segH / 2 + 6,
        value: stage.value,
        type: stage.type,
        name: stage.name,
        color: stage.color,
        conversionRate,
        avgDays: Math.floor(Math.random() * 8) + 1,
        isDropoff: dropoff >= 60,
        isEmpty
      };
    });
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

  openPosition(positionId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'position',
      id: positionId
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

  openCompany(companyId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'company',
      id: companyId
    });
  }

  openPositionsListPreview(event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'positions-list',
      id: ''
    });
  }

  openApplicants(position: RecruitmentFunnel, event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'applicants',
      id: position.positionId,
      payload: {
        position: position
      }
    });
  }

  openMultiplePipeline(positionId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'multiple-pipeline',
      id: positionId,
      payload: {
        positionId: positionId
      }
    });
  }

  openApplicantsByStage(event?: MouseEvent): void {
    event?.stopPropagation();
    const stageType = StageType.CV_REVIEW;
    this.uiInteractionService.openDrawer({
      type: 'applicants-by-stage',
      id: stageType,
      payload: {
        stageType: stageType,
      }
    });
  }

  openApplicantsByPositionStageType(stage: PipelineStage, event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'applicants-by-stage',
      id:
        this.selectedPositionId ||
        stage.type,
      payload: {
        stageType: stage.type,
        ...(this.selectedPositionId && {
          positionId:
            this.selectedPositionId
        })
      }
    });
  }

  openPipelineHealthPreview(): void {
    this.uiInteractionService.openDrawer({
      type: 'pipeline-health-preview',
      id: ''
    });
  }
}
