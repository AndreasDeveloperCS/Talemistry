import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of, take, tap } from 'rxjs';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { CopyToastService } from 'src/app/modules/general/services/copy-toast.service';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { MeetingInvitationsService } from 'src/app/modules/meeting-invitations/services/meeting-invitations.service';
import { Meeting } from 'src/app/modules/meetings/models/meeting';
import { MeetingService } from 'src/app/modules/meetings/services/meeting.service';
import { EnrichedAppliedPositionsProgress, StageStatus } from 'src/app/modules/position-management/models/talent-pipeline-progress';
import { PipelineStageFeedbacksService } from 'src/app/modules/position-management/services/pipeline-stage-feedback.service';
import { ScreeningResponsesService } from 'src/app/modules/position-management/services/screening-responses.service';
import { TalentPipelineProgressService } from 'src/app/modules/position-management/services/talent-pipeline-progress.service';
import { STAGES_NAMES } from 'src/app/modules/position-pipelines/models/default-pipeline-stages';
import { PositionPipelineService } from 'src/app/modules/position-pipelines/services/position-pipeline.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-applied-position-details',
  templateUrl: './applied-position-details.component.html',
  styleUrl: './applied-position-details.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppliedPositionDetailsComponent implements OnInit {
  @Input() 
  application!: EnrichedAppliedPositionsProgress;
  
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  STAGES_NAMES = STAGES_NAMES;
  StageStatus = StageStatus;
  isLoading: boolean = true;
  isStageDetailsLoading: boolean = false;
  pipelineProgress: any[] = [];
  positionStages: any[] = [];
  stageOrder: STAGES_NAMES[] = [];
  selectedPipelineStage: STAGES_NAMES | null = null;
  stageIcons: Record<string, string> = {};
  stageFeedbacks: any[] = [];
  screeningResponse: any = null;
  invitation: any = null;
  scheduledMeeting!: Meeting;
  isMeetingScheduled = false;
  expandedQuestions = new Set<number>();

  constructor(
    private talentPipelineProgressService: TalentPipelineProgressService,
    private pipelineService: PositionPipelineService,
    private meetingsService: MeetingService,
    private meetingInvitationsService: MeetingInvitationsService,
    private screeningResponsesService: ScreeningResponsesService,
    private feedbackService: PipelineStageFeedbacksService,
    private uiInteractionService: UiInteractionService,
    private copyToastService: CopyToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPipelineProgress();
  }

  loadPipelineProgress(): void {
    if (!this.application?.positionId) {
      return;
    }

    this.isLoading = true;

    this.talentPipelineProgressService
      .getTalentPipelineStagesByPositionId(this.userId, this.application.positionId, true)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.pipelineProgress = res || [];
          this.getPositionStages(this.application.positionId);
          this.selectPipelineStage(this.application.currentStage as STAGES_NAMES, true);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  getPositionStages(positionId: string): void {
    this.pipelineService
      .getPipelineByPositionId(positionId, true)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res?.stages?.length) {
            const sortedStages = [...res.stages].sort((a, b) => a.order - b.order);
            this.positionStages = sortedStages;
            this.stageOrder = sortedStages.map(s => s.name);
            this.filterStageOrder();
            this.stageIcons = sortedStages.reduce((acc, stage) => {
              acc[stage.name] = stage.icon || 'help_outline';
              return acc;
            }, {} as Record<string, string>);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  selectPipelineStage(stage: STAGES_NAMES, isClickable: boolean): void {
    if (!isClickable) {
      return;
    }

    this.selectedPipelineStage = this.selectedPipelineStage === stage ? null : stage;
    if (this.selectedPipelineStage === STAGES_NAMES.SCREENING) {
      this.getScreeningResponses();
    }
    if (this.selectedPipelineStage === STAGES_NAMES.INTERVIEW) {
      this.loadMeetingInvitations();
    }
    this.getFeedbackInfo();
    this.cdr.markForCheck();
  }

  get selectedStageData(): any {
    if (!this.pipelineProgress || !this.selectedPipelineStage) {
      return null;
    }

    return this.pipelineProgress.find((p: any) => p.stageName === this.selectedPipelineStage);
  }

  getCurrentStageIndex(stageName: string): number {
    return this.stageOrder.indexOf(stageName as STAGES_NAMES);
  }

  isStageClickable(stage: STAGES_NAMES): boolean {
    const currentIndex = this.getCurrentStageIndex(this.application.currentStage);
    const stageIndex = this.stageOrder.indexOf(stage);
    return stageIndex <= currentIndex;
  }

  isCurrentStage(stage: STAGES_NAMES): boolean {
    return stage === this.application.currentStage;
  }

  isPassedStage(stage: STAGES_NAMES): boolean {
    const currentIndex = this.getCurrentStageIndex(this.application.currentStage);
    const stageIndex = this.stageOrder.indexOf(stage);
    return stageIndex < currentIndex;
  }

  isFutureStage(stage: STAGES_NAMES): boolean {
    const currentIndex = this.getCurrentStageIndex(this.application.currentStage);
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
      default:
        return 'radio_button_unchecked';
    }
  }

  getStatusClass(status: StageStatus | undefined): string {
    switch (status) {
      case StageStatus.pending:
        return 'pending';
      case StageStatus.passed:
        return 'passed';
      case StageStatus.failed:
        return 'failed';
      default:
        return 'future';
    }
  }

  getFeedbackInfo(): void {
    this.stageFeedbacks = [];
    this.feedbackService.getFeedbackByPipelineProgressId(this.selectedStageData?._id, true)
      .pipe(
        take(1), 
        tap((res: any[] | null) => {
          if (res) {
            this.stageFeedbacks = res;
          }
          this.cdr.markForCheck();
        }),
        catchError((err) => {
          console.error(err);
          return of(void 0);
        })
      )
      .subscribe();
  }

  getScreeningResponses(): void {
    this.screeningResponsesService
      .getByPositionIdTalentIdAsync(this.application.positionId, this.userId, true)
      .pipe(
        take(1),
        tap((res: any | null) => {
          this.screeningResponse = res;
          if (res?.answers?.length) {
            this.expandedQuestions.add(0);
          }
          this.cdr.markForCheck();
        }),
        catchError((err) => {
          console.error(err);
          return of(void 0);
        })
      )
      .subscribe();
  }

  loadMeetingInvitations(): void {
    this.meetingInvitationsService
      .getByPositionIdTalentId(this.application.positionId, this.userId, true)
      .pipe(take(1))
      .subscribe({
        next: (invitation: any) => {
          this.invitation = invitation;
          if (invitation?.meetingId) {
            this.isMeetingScheduled = true;
            this.getScheduledMeetingInfo(invitation.meetingId);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  getScheduledMeetingInfo(meetingId: string): void {
    this.meetingsService
      .getByIdAsync(meetingId, true)
      .pipe(take(1))
      .subscribe({
        next: (meeting: Meeting) => {
          console.log('Scheduled meeting info', meeting);
          this.scheduledMeeting = meeting;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  joinMeeting(): void {
    const link = this.getMeetingJoinLink();
    if (!link) {
      return;
    }
    window.open(link, '_blank');
  }

  copyLink(): void {
    const link = this.getMeetingJoinLink();
    if (!link) {
      return;
    }
    navigator.clipboard.writeText(link);
    this.copyToastService.show('Meeting link copied');
  }

  private getMeetingJoinLink(): string | null {
    const m = this.scheduledMeeting;

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

  filterStageOrder(): void {
    this.stageOrder = this.stageOrder.filter(s => s !== STAGES_NAMES.SOURCED);
  }

  openPosition(): void {
    this.uiInteractionService.openDrawer({
      type: 'position',
      id: this.application.positionId
    });
  }

  openCompany(): void {
    this.uiInteractionService.openDrawer({
      type: 'company',
      id: this.application.companyId
    });
  }
}
