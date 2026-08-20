import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { catchError, of, take, tap } from 'rxjs';
import { AuthService, convertRoleToRoute } from 'src/app/modules/authentication/services/auth.service';
import { CompanyVersionService } from 'src/app/modules/companies/services/company-version.service';
import { BaseEntity } from 'src/app/modules/general/models/base-entity';
import { DialogHelperService } from 'src/app/modules/general/services/dialog-helper.service';
import { Filtering, FilterRule, Sorting } from 'src/app/modules/general/services/search-logic.service';
import { MeetingInvitation } from 'src/app/modules/meeting-invitations/models/meeting-invitation';
import { MeetingInvitationsService } from 'src/app/modules/meeting-invitations/services/meeting-invitations.service';
import { Meeting } from 'src/app/modules/meetings/models/meeting';
import { MeetingService } from 'src/app/modules/meetings/services/meeting.service';
import { CvReviewFeedbackPayload, PipelineStageFeedback, ScreeningFeedbackPayload, StageFeedbackPayload } from 'src/app/modules/position-management/models/pipeline-stage-feedback';
import { ScreeningResponse } from 'src/app/modules/position-management/models/screening-response';
import { EnrichedAppliedPositionsProgress, EnrichedTalentPipelineProgress, StageStatus, TalentPipelineProgress } from 'src/app/modules/position-management/models/talent-pipeline-progress';
import { PipelineStageFeedbacksService } from 'src/app/modules/position-management/services/pipeline-stage-feedback.service';
import { ScreeningResponsesService } from 'src/app/modules/position-management/services/screening-responses.service';
import { TalentPipelineProgressService } from 'src/app/modules/position-management/services/talent-pipeline-progress.service';
import { STAGES_NAMES } from 'src/app/modules/position-pipelines/models/default-pipeline-stages';
import { PositionPipelineService } from 'src/app/modules/position-pipelines/services/position-pipeline.service';
import { PositionStatus } from 'src/app/modules/positions/models/position-details';
import { PositionsService } from 'src/app/modules/positions/services/positions.service';
import { ScheduledMeetingInfoComponent } from 'src/app/modules/schedule/components/scheduled-meeting-info/scheduled-meeting-info.component';
import { environment } from 'src/environments/environment';
import { getPropertyName } from 'src/shared-functions/shared-functions';

@Component({
  selector: 'app-applicant-dashboard',
  templateUrl: './applicant-dashboard.component.html',
  styleUrl: './applicant-dashboard.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplicantDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('scrollArea') scrollArea!: ElementRef;

  STAGES_NAMES = STAGES_NAMES;
  StageStatus = StageStatus;
  PositionStatus = PositionStatus;

  stageOrder = [
    STAGES_NAMES.SOURCED,
    STAGES_NAMES.APPLIED,
    STAGES_NAMES.SCREENING,
    STAGES_NAMES.ASSESSMENT,
    STAGES_NAMES.INTERVIEW,
    STAGES_NAMES.OFFER,
    STAGES_NAMES.HIRED,
  ];

  stageIcons: Record<string, string> = {
    [STAGES_NAMES.SOURCED]: 'search',
    [STAGES_NAMES.APPLIED]: 'how_to_reg',
    [STAGES_NAMES.SCREENING]: 'filter_list',
    [STAGES_NAMES.ASSESSMENT]: 'assignment',
    [STAGES_NAMES.INTERVIEW]: 'groups',
    [STAGES_NAMES.OFFER]: 'handshake',
    [STAGES_NAMES.HIRED]: 'check_circle',
  };

  mockApplications: EnrichedTalentPipelineProgress[] = [];
  selectedPosition: EnrichedAppliedPositionsProgress | null = null;
  selectedStage: STAGES_NAMES | null = null;
  statusFilter: 'all' | 'active' | 'paused' | 'closed' = 'all';
  selectedPipelineStage: STAGES_NAMES | null = null;
  expandedQuestions: Set<number> = new Set();
  filteredPositions: EnrichedAppliedPositionsProgress[] = [];
  selectedApp: EnrichedAppliedPositionsProgress | null = null;

  //
  isPositionsLoading: boolean = false;
  stageFeedbacks: PipelineStageFeedback[] = [];
  isPipelineProgressLoading: boolean = false;
  isStageDetailsLoading: boolean = false;
  appliedPositions: EnrichedAppliedPositionsProgress[] = [];
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  positionStages: any[] = [];
  screeningResponse!: ScreeningResponse | null;
  sorting: Sorting = {
    property: getPropertyName<BaseEntity>(e => e.createdDate),
    direction: 'DESC'
  };
  sortingProcessed: Sorting = {
    property: getPropertyName<BaseEntity>(e => e.createdDate),
    direction: "ASC"
  };
  filtering: Filtering = [];
  pageSize: number = 10;
  pageIndex: number = 0;
  totalApplications: number = 0;
  isMeetingScheduled: boolean = false;
  invitation: MeetingInvitation | null = null;
  scheduledMeeting: Meeting | null = null;

  constructor(
    private talentPipelineProgressService: TalentPipelineProgressService,
    private cdr: ChangeDetectorRef,
    private pipelineService: PositionPipelineService,
    private screeningResponsesService: ScreeningResponsesService,
    private feedbackService: PipelineStageFeedbacksService,
    private meetingInvitationsService: MeetingInvitationsService,
    private meetingsService: MeetingService,
    private authService: AuthService,
    private dialogHelper: DialogHelperService,
    public positionsService: PositionsService,
    private companyService: CompanyVersionService,
  ) {}

  ngOnInit(): void {
    this.filterStageOrder();
    this.getAppliedPositions();
  }

  ngAfterViewInit() {
    this.scrollArea.nativeElement.addEventListener('scroll', this.onScroll.bind(this));
  }

  ngOnDestroy() {
    this.scrollArea?.nativeElement.removeEventListener('scroll', this.onScroll.bind(this));
  }

  onScroll(event: any) {
    console.log('Scroll event', event);
    const el = event.target;
    const threshold = 150; 
    const position = el.scrollTop + el.clientHeight;
    const height = el.scrollHeight;

    if (position > height - threshold && !this.isPositionsLoading) {
      if (this.appliedPositions.length >= this.totalApplications) {
        return; 
      }
      this.getAppliedPositions(); 
    }
  }

  getPositionStages(positionId: string) {
    if(positionId) {
      this.pipelineService.getPipelineByPositionId(positionId, true)
      .pipe(take(1)).subscribe({
        next: (res) => {
          console.log('Pipeline stages', res);
          if (res?.stages?.length) {
            const sortedStages = [...res.stages].sort(
              (a, b) => a.order - b.order
            );

            this.positionStages = sortedStages;
            this.stageOrder = sortedStages.map(s => s.name);
            this.filterStageOrder();

            this.stageIcons = sortedStages.reduce((acc, stage) => {
              acc[stage.name] = stage.icon || 'help_outline'; // fallback
              return acc;
            }, {} as Record<string, string>);
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

  getAppliedPositions() {
    if(this.userId) {
      this.isPositionsLoading = true;
      this.talentPipelineProgressService.getAppliedPositionsByTalentId(this.userId, this.pageSize, this.pageIndex, this.sorting, this.filtering, true, false)
      .pipe(take(1)).subscribe({
        next: (res) => {
          console.log('Applied Positions', res);
          if(res && res.items && res.items.length > 0) {
            this.appliedPositions = [...this.appliedPositions, ...res.items];
            console.log('Updated applied positions', this.appliedPositions);
            this.totalApplications = res.totalItems;
            this.pageIndex++;
            this.updateFilteredPositions();
          }
          this.isPositionsLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading data', err);
          this.isPositionsLoading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  loadMeetingInvitations() {
    console.log('Loading meeting invitations for position', this.selectedPosition);
    if (!this.selectedPosition?.positionId || !this.userId) {
      return;
    }
    this.meetingInvitationsService
    .getByPositionIdTalentId(this.selectedPosition.positionId, this.userId, true)
    .pipe(take(1))
    .subscribe({
      next: (invitation: MeetingInvitation) => {
        if(!invitation) {
          console.log('No meeting invitation found for this interview stage');
          return;
        }
        console.log('Meeting invitation for interview', invitation);
        this.invitation = invitation;
        if(invitation?.meetingId) {
          this.isMeetingScheduled = true;
          this.getScheduledMeetingInfo(invitation?.meetingId);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading meeting invitation', err);
        this.cdr.markForCheck();
      } 
    });
  }

  getScheduledMeetingInfo(meetingId: string) {
    if(!meetingId) {
      return;
    }
    this.meetingsService.getByIdAsync(meetingId, true)
    .pipe(take(1))
    .subscribe({
      next: (meeting: Meeting) => {
        if(!meeting) {
          console.log('No meeting found for this id');
          return;
        }
        this.scheduledMeeting = meeting;
        console.log('Scheduled meeting info', meeting);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading meeting', err);
        this.cdr.markForCheck();
      } 
    });
  }

  updateFilteredPositions(): void {
    let filtered = this.appliedPositions;

    if (this.selectedStage) {
      filtered = filtered.filter(app => app.currentStage === this.selectedStage);
    }

    if (this.statusFilter === 'active') {
      filtered = filtered.filter(app => app.positionStatus === PositionStatus.ACTIVE);
    } else if (this.statusFilter === 'paused') {
      filtered = filtered.filter(app => app.positionStatus === PositionStatus.PAUSED);
    } else if (this.statusFilter === 'closed') {
      filtered = filtered.filter(app => app.positionStatus === PositionStatus.CLOSED);
    }

    this.filteredPositions = filtered;
  }

  updateSelectedApp(): void {
    this.selectedApp = this.appliedPositions.find(app => app.positionId === this.selectedPosition?.positionId) || null;
  }

  selectPosition(app: any): void {
    this.selectedPosition = app;
    if(app) {
      this.isPipelineProgressLoading = true;
      this.talentPipelineProgressService.getTalentPipelineStagesByPositionId(this.userId, app.positionId, true)
      .pipe(take(1)).subscribe({
        next: (res) => {
          console.log('Position Pipeline Stages', res);
          if(res && res.length > 0) {
            const selected = this.appliedPositions.find(
              p => p.positionId === app.positionId
            );
            if (selected) {
              selected.pipelineProgress = res; 
              this.getPositionStages(selected.positionId);
            }
            this.selectedPipelineStage = null;
            this.updateSelectedApp();
          }
          this.isPipelineProgressLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => { 
          console.error('Error loading data', err);
          this.isPipelineProgressLoading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  selectStage(stage: STAGES_NAMES | null): void {
    this.selectedStage = this.selectedStage === stage ? null : stage;
    this.updateFilteredPositions();
  }

  clearStageFilter(): void {
    this.selectedStage = null;
    this.updateFilteredPositions();
  }

  setStatusFilter(filter: 'all' | 'active' | 'paused' | 'closed'): void {
    this.statusFilter = filter;
    console.log('Initial filtering', this.filtering);
    this.filtering = [];
    if(filter === 'all') {
      return;
    }
    const mainFilter = {
      property: 'positionStatus',
      rule: FilterRule.EQUALS,
      value: filter
    };
    this.filtering.push(mainFilter);
    console.log('Updated filtering', this.filtering);
    this.appliedPositions = [];
    this.pageIndex = 0;
    this.totalApplications = 0;
    this.cdr.markForCheck();
    this.getAppliedPositions();
  }

  selectPipelineStage(stage: STAGES_NAMES | null, isClickable: boolean): void {
    if (!isClickable) {
      return;
    }
    this.isStageDetailsLoading = true;
    this.selectedPipelineStage = this.selectedPipelineStage === stage ? null : stage;
    console.log('this.selectedPipelineStage', this.selectedPipelineStage, 'STAGES_NAMES.SCREENING', STAGES_NAMES.SCREENING,
      'this.selectedPipelineStage === STAGES_NAMES.SCREENING', this.selectedPipelineStage === STAGES_NAMES.SCREENING
    );
    if(this.selectedPipelineStage === STAGES_NAMES.SCREENING) {
      this.getScreeningResponses();
    }
    if(this.selectedPipelineStage === STAGES_NAMES.INTERVIEW) {
      this.loadMeetingInvitations();
    }
    this.getFeedbackInfo();
    this.isStageDetailsLoading = false;
    this.cdr.markForCheck();
  }

  get selectedStageData(): TalentPipelineProgress | any {
    if (!this.selectedApp?.pipelineProgress || !this.selectedPipelineStage) {
      return null;
    }

    return this.selectedApp.pipelineProgress.find(
      (p: any) => p.stageName === this.selectedPipelineStage
    ) || null;
  }

  toggleQuestion(index: number): void {
    if (this.expandedQuestions.has(index)) {
      this.expandedQuestions.delete(index);
    } else {
      this.expandedQuestions.add(index);
    }
  }

  isQuestionExpanded(index: number): boolean {
    return this.expandedQuestions.has(index);
  }

  getStageCount(stage: STAGES_NAMES): number {
    return this.appliedPositions.filter(app => app.currentStage === stage).length;
  }

  getStageProgress(currentStage: string): number {
    const index = this.stageOrder.indexOf(currentStage as STAGES_NAMES);
    return ((index + 1) / this.stageOrder.length) * 100;
  }

  getCurrentStageIndex(stageName: string): number {
    return this.stageOrder.indexOf(stageName as STAGES_NAMES);
  }

  getStageStatus(stage: STAGES_NAMES | string, app: EnrichedAppliedPositionsProgress): StageStatus | string {
    const currentIndex = this.getCurrentStageIndex(app.currentStage);
    const stageIndex = this.stageOrder.indexOf(stage as STAGES_NAMES);
    const isCurrentStage = stage === app.currentStage;
    const isPassed = stageIndex < currentIndex;

    if (isCurrentStage) {
      return app.currentStage;
    } else if (isPassed) {
      return StageStatus.passed;
    } else {
      return StageStatus.future;
    }
  }

  isStageClickable(stage: STAGES_NAMES, app: EnrichedAppliedPositionsProgress): boolean {
    const currentIndex = this.getCurrentStageIndex(app.currentStage);
    const stageIndex = this.stageOrder.indexOf(stage);
    return stageIndex <= currentIndex;
  }

  isCurrentStage(stage: STAGES_NAMES, app: EnrichedAppliedPositionsProgress): boolean {
    return stage === app.currentStage;
  }

  isPassedStage(stage: STAGES_NAMES, app: EnrichedAppliedPositionsProgress): boolean {
    const currentIndex = this.getCurrentStageIndex(app.currentStage);
    const stageIndex = this.stageOrder.indexOf(stage);
    return stageIndex < currentIndex;
  }

  isFutureStage(stage: STAGES_NAMES, app: EnrichedAppliedPositionsProgress): boolean {
    const currentIndex = this.getCurrentStageIndex(app.currentStage);
    const stageIndex = this.stageOrder.indexOf(stage);
    return stageIndex > currentIndex;
  }

  getStatusIcon(status: StageStatus | string): string {
    switch (status) {
      case StageStatus.passed:
        return 'check_circle';
      case StageStatus.failed:
        return 'cancel';
      case StageStatus.pending:
        return 'schedule';
      case StageStatus.future:
        return 'radio_button_unchecked';
      default:
        return 'help_outline';
    }
  }

  getStatusLabel(status: StageStatus | undefined): string {
    if(!status) {
      return '';
    }
    switch (status) {
      case StageStatus.pending:
        return 'In Progress';
      case StageStatus.passed:
        return 'Passed';
      case StageStatus.failed:
        return 'Failed';
      case StageStatus.future:
        return 'Future';
      default:
        return '';
    }
  }

  getStatusClass(status: StageStatus | undefined): string {
    if(!status) {
      return '';
    }
    switch (status) {
      case StageStatus.pending:
        return 'in-progress';
      case StageStatus.passed:
        return 'passed';
      case StageStatus.failed:
        return 'failed';
      case StageStatus.future:
        return 'future';
      default:
        return '';
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  preventDefault(event: Event): void {
    event.stopPropagation();
  }

  startChat(event: Event): void {
    event.stopPropagation();
    if (!this.userId || !this.selectedPosition?.positionOwner) {
      return;
    }
    const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${this.userId}`);
    if (!idToken) {
      return;
    }
    const decodedToken = this.authService.decodeJWTToken(idToken);
    if (!decodedToken?.user?.role) {
      return;
    }
    const role = convertRoleToRoute(decodedToken.user.role);

    const url =
      `${environment.sourceUrl}/${role}/` +
      `${environment.routes.communication.communication}/` +
      `${environment.routes.communication.textChat}` +
      `?contactId=${this.selectedPosition?.positionOwner}` 
      //+`&name=${encodeURIComponent(applicant.talentName ?? 'Unknown')}`;

    window.open(url, '_blank');
  }

  navigateToScreening(): void {
    if(this.selectedPosition?.positionId) {
      window.open(`${environment.sourceUrl}/${environment.routes.career}/${environment.routes.screening}/${this.selectedPosition.positionId}`, '_blank');
    }
  }

  scheduleInterview(): void {
    console.log('Scheduling interview with invitation', this.invitation);
    if(this.invitation?.bookingToken) {
      const url = `${environment.sourceUrl}/${environment.routes.schedule.schedule}/event/${this.invitation.bookingToken}`;
      window.open(url, '_blank');
    }
  }

  getFeedbackInfo() {
    this.stageFeedbacks = [];
    console.log('Getting feedback for pipeline progress id', this.selectedStageData?._id);
    this.feedbackService
    .getFeedbackByPipelineProgressId(this.selectedStageData?._id, true)
    .pipe(
      take(1),
      tap((res: PipelineStageFeedback[] | null) => {
        console.log('Stage Feedback response', res);
        if (res) {
          this.stageFeedbacks = res;
          this.cdr.markForCheck();
        } 
      }),
      catchError((err) => {
        console.error('Error receiving feedback', err);
        return of(void 0); 
      })
    ).subscribe();
  }

  getScreeningResponses() {
    if (this.selectedPipelineStage !== STAGES_NAMES.SCREENING || !this.selectedPosition?.positionId || !this.userId) {
      this.screeningResponse = null;
      return;
    }

    this.isStageDetailsLoading = true;

    this.screeningResponsesService
    .getByPositionIdTalentIdAsync(this.selectedPosition?.positionId, this.userId, true)
    .pipe(
      take(1),
      tap((res: ScreeningResponse | null) => {
        console.log('Screening response', res);

        if (res) {
          this.screeningResponse = res;
          if (res.answers.length > 0) {
            this.expandedQuestions.add(0);
          }
        } else {
          this.screeningResponse = null;
        }
        this.cdr.markForCheck();
        this.isStageDetailsLoading = false;
      }),
      catchError((err) => {
        console.error('Error receiving screening response', err);
        this.screeningResponse = null;
        this.cdr.markForCheck();
        this.isStageDetailsLoading = false;
        return of(void 0);
      })
    ).subscribe();
  }

  filterStageOrder(): void{
    this.stageOrder = this.stageOrder.filter(s => s !== STAGES_NAMES.SOURCED);
  }

  onNavigateToPositionPage(positionId: string, event: Event): void {
    event.stopPropagation();
    this.positionsService.openPositionPage(positionId);
  }

  onNavigateToCompanyPage(companyId: string, event: Event) {
    event.stopPropagation();
    if (companyId) {
      this.companyService.openCompanyPage(companyId);
    }
  }

  isCvReviewPayload(payload: StageFeedbackPayload | undefined): payload is CvReviewFeedbackPayload {
    return !!payload && 'comments' in payload;
  }

  isScreeningReviewPayload(payload: StageFeedbackPayload | undefined): payload is ScreeningFeedbackPayload {
    return !!payload && 'notes' in payload;
  }

  getCvComments(stageFeedback: PipelineStageFeedback): string | undefined {
    const payload = stageFeedback?.payload;
    if (payload && 'comments' in payload) {
      return (payload as CvReviewFeedbackPayload).comments;
    }
    return undefined;
  }

  getScreeningNotes(stageFeedback: PipelineStageFeedback): string | undefined {
    const payload = stageFeedback?.payload;
    if (payload && 'notes' in payload) {
      return (payload as ScreeningFeedbackPayload).notes;
    }
    return undefined;
  }

  viewMeetingDetails() {
    console.log('Viewing meeting details for scheduled meeting', this.scheduledMeeting);
    if(!this.scheduledMeeting) {
      return;
    }
    this.dialogHelper.openDialog(ScheduledMeetingInfoComponent, () => {
        this.cdr.markForCheck();
      }, 
      { data: this.scheduledMeeting, panelClass: 'panel-class-dialog' }
    );
  }
}