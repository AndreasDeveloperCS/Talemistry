import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { catchError, forkJoin, of, take, tap } from 'rxjs';
import { ApplicantStage } from 'src/app/modules/position-management/models/applicant-info';
import { AssessmentFeedbackPayload, BaseFeedbackPayload, CvReviewFeedbackPayload, FeedbackSource, FeedbackStatus, InterviewFeedbackPayload, PipelineStageFeedback, ScreeningFeedbackPayload, StageFeedbackPayload } from 'src/app/modules/position-management/models/pipeline-stage-feedback';
import { ScreeningResponse } from 'src/app/modules/position-management/models/screening-response';
import { RejectionReason, StageFinalDecisionForm, StageStatus, TalentPipelineProgress } from 'src/app/modules/position-management/models/talent-pipeline-progress';
import { PipelineStageFeedbacksService } from 'src/app/modules/position-management/services/pipeline-stage-feedback.service';
import { ScreeningResponsesService } from 'src/app/modules/position-management/services/screening-responses.service';
import { STAGES_NAMES } from 'src/app/modules/position-pipelines/models/default-pipeline-stages';
import { StageType } from 'src/app/modules/position-pipelines/models/pipeline-stage';
import { Feedback } from '../../models/pipeline-board-types';
import { TalentPipelineProgressService } from 'src/app/modules/position-management/services/talent-pipeline-progress.service';
import { environment } from 'src/environments/environment';
import { MeetingInvitationsService } from 'src/app/modules/meeting-invitations/services/meeting-invitations.service';
import { MeetingInvitation } from 'src/app/modules/meeting-invitations/models/meeting-invitation';
import { MeetingService } from 'src/app/modules/meetings/services/meeting.service';
import { Meeting } from 'src/app/modules/meetings/models/meeting';
import { ScheduledMeetingInfoComponent } from 'src/app/modules/schedule/components/scheduled-meeting-info/scheduled-meeting-info.component';
import { DialogHelperService } from 'src/app/modules/general/services/dialog-helper.service';

@Component({
  selector: 'app-content-panel',
  templateUrl: './content-panel.component.html',
  styleUrl: './content-panel.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentPanelComponent implements OnChanges {
  @Input() selectedInterview: ApplicantStage | null = null;

  @Output() stageStatusChange = new EventEmitter<{ stageId: string; status: string }>();

  isLoading: boolean = false;
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  screeningResponse!: ScreeningResponse;
  stageFeedbacks!: PipelineStageFeedback[];
  expandedQuestions: Set<number> = new Set();
  RejectionReasons = RejectionReason;
  StageStatus = StageStatus;
  FeedbackStatus = FeedbackStatus;
  editCv?: CvReviewFeedbackPayload;
  editScreening?: ScreeningFeedbackPayload;
  editInterview?: InterviewFeedbackPayload;
  editAssessment?: AssessmentFeedbackPayload;
  finalDecisionForm: StageFinalDecisionForm = {};
  isMeetingScheduled: boolean = false;
  invitation: MeetingInvitation | null = null;
  scheduledMeeting: Meeting | null = null;

  constructor(private cdr: ChangeDetectorRef,
    private feedbackService: PipelineStageFeedbacksService,
    private pipelineProgressService: TalentPipelineProgressService,
    private meetingInvitationsService: MeetingInvitationsService,
    private meetingsService: MeetingService,
    private dialogHelper: DialogHelperService,
    private screeningResponsesService: ScreeningResponsesService,
  ) { 
    //this.deleteFeedback('69888b7d8ee1ab041e6cef04');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedInterview']?.currentValue) {
      this.initFinalDecisionForm(this.selectedInterview);
      this.loadStageData();
      console.log('Selected interview changed', this.selectedInterview, this.selectedInterview?.stageType);
      if(this.selectedInterview?.stageType === StageType.INTERVIEW) {
        this.loadMeetingInvitations();
      }
    }
  }

  loadMeetingInvitations() {
    if (!this.selectedInterview?.positionId || !this.selectedInterview?.talentId) {
      return;
    }
    this.meetingInvitationsService
    .getByPositionIdTalentId(this.selectedInterview.positionId, this.selectedInterview.talentId, true)
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

  private loadStageData(): void {
    this.isLoading = true;

    forkJoin([
      this.getFeedback$(),
      this.getScreeningResponse$()
    ])
      .pipe(take(1))
      .subscribe({
        next: () => {
          
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading stage data', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private getFeedback$() {
    console.log('Getting feedback for pipeline progress id', this.selectedInterview?._id);
    if (!this.selectedInterview?._id) return of(void 0);

    return this.feedbackService
      .getFeedbackByPipelineProgressId(this.selectedInterview._id, true)
      .pipe(
        take(1),
        tap((res: PipelineStageFeedback[] | null) => {
          console.log('Stage Feedback response', res);

          if (res) {
            this.stageFeedbacks = res;
            if (this.selectedInterview?.stageType) {
              this.initEditModel(this.selectedInterview.stageType as StageType, res[0].payload);
            }
          } else {
            this.stageFeedbacks = [];
            if (this.selectedInterview?.stageType) {
              this.initEmptyFeedback(this.selectedInterview.stageType as StageType);
            }
          }
        }),
        catchError((err) => {
          console.error('Error receiving feedback', err);
          return of(void 0); // continue even on error
        })
      );
  }

  deleteFeedback(feedbackId: string) {
    this.feedbackService
      .deleteAsync(feedbackId, true, false)
      .pipe(take(1))
      .subscribe({
        next: (deleted) => {
          console.log('Feedback deleted', deleted);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error updating stage', err);
          this.cdr.markForCheck();
        },
    });
  }

  private getScreeningResponse$() {
    if (
      this.selectedInterview?.name !== STAGES_NAMES.SCREENING ||
      !this.selectedInterview?.positionId ||
      !this.selectedInterview?.talentId
    ) {
      // Not screening stage or missing data
      this.screeningResponse = new ScreeningResponse();
      return of(void 0);
    }

    return this.screeningResponsesService
      .getByPositionIdTalentIdAsync(
        this.selectedInterview.positionId,
        this.selectedInterview.talentId,
        true
      )
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
            this.screeningResponse = new ScreeningResponse();
          }
        }),
        catchError((err) => {
          console.error('Error receiving screening response', err);
          this.screeningResponse = new ScreeningResponse();
          return of(void 0);
        })
      );
  }

  private initEditModel(stageType: StageType, payload: BaseFeedbackPayload | null) {
    switch (stageType) {
      case StageType.CV_REVIEW:
        this.editCv = { ...(payload as CvReviewFeedbackPayload) };
        console.log('editCv', this.editCv);
        break;

      case StageType.SCREENING:
        this.editScreening = { ...(payload as ScreeningFeedbackPayload) };
        console.log('editScreening', this.editScreening);
        break;

      case StageType.INTERVIEW:
        this.editInterview = { ...(payload as InterviewFeedbackPayload) };
        console.log('editInterview', this.editInterview);
        break;

      case StageType.ASSESSMENT:
        this.editAssessment = { ...(payload as AssessmentFeedbackPayload) };
        console.log('editAssessment', this.editAssessment);
        break;

      default:
        console.warn('Unknown stage type', stageType);
    }
  }

  private initEmptyFeedback(stage: StageType) {
    this.stageFeedbacks[0] = {
      stageType: stage,
      status: 'pending',
      payload: {}
    } as any;

    switch (stage) {
      case StageType.CV_REVIEW:
        this.editCv = {};
        break;

      case StageType.SCREENING:
        this.editScreening = { screeningResponseId: null };
        break;

      case StageType.INTERVIEW:
        this.editInterview = {};
        break;

      case StageType.ASSESSMENT:
        this.editAssessment = { score: 1, maxScore: 10 };
        break;
    }
  }

  private initFinalDecisionForm(stageInfo: ApplicantStage | null): void {
    console.log('Initializing final decision form with stage info', stageInfo);
    this.finalDecisionForm = {
      finalDecision: undefined,
      finalRejectionReason: undefined,
      finalNotes: ''
    };

    if (stageInfo) {
      if (stageInfo.finalDecision) {
        this.finalDecisionForm.finalDecision = stageInfo.finalDecision;
      }
      if (stageInfo.finalRejectionReason) {
        this.finalDecisionForm.finalRejectionReason = stageInfo.finalRejectionReason as RejectionReason;
      }
      if (stageInfo.finalNotes) {
        this.finalDecisionForm.finalNotes = stageInfo.finalNotes;
      }
    }
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  formatArray(value: any[]): string {
    return value.map(item => item.text || item).join(', ');
  }

  getStageStatusClass(status: StageStatus | undefined): string {
    const classes: Record<StageStatus, string> = {
      passed: 'status-passed',
      failed: 'status-failed',
      pending: 'status-pending',
      future: 'status-future'
    };

    return status ? classes[status] : 'status-future';
  }

  getStageStatusLabel(status: StageStatus | undefined): string {
    const labels: Record<StageStatus, string> = {
      passed: 'Passed',
      failed: 'Failed',
      pending: 'Pending',
      future: 'Future'
    };

    return status ? labels[status] : '';
  }

  getRatingStars(rating: any, max: number = 5): StarValue[] {
    const scaled = (rating / 10) * max; // scale to 0–5
    const fullStars = Math.floor(scaled);
    const hasHalfStar = scaled - fullStars >= 0.5;
    
    const stars: StarValue[] = [];

    for (let i = 0; i < max; i++) {
      if (i < fullStars) {
        stars.push(1);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(0.5);
      } else {
        stars.push(0);
      }
    }

    return stars;
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

  getEnumValues<T extends Record<string, any>>(enumObj: T): string[] {
    return Object.values(enumObj);
  }

  getEnumLabel(value: string): string {
    const labels: Record<string, string> = {
      [RejectionReason.NotQualified]: 'Not enough theoretical knowledge',
      [RejectionReason.NotSkilled]: 'Not enough practical skills',
      [RejectionReason.NotMotivated]: 'Not motivated',
      [RejectionReason.NotCulturalFit]: 'Not cultural fit',
      [RejectionReason.SalaryExpectation]: 'Salary expectation',
      [RejectionReason.NotSelectedNextStage]: 'Other'
    };
    return labels[value] || value;
  }

  mapFeedbackToStageStatus(status?: FeedbackStatus): StageStatus {
    switch (status) {
      case FeedbackStatus.FINAL:
        return StageStatus.passed;

      case FeedbackStatus.SUBMITTED:
        return StageStatus.pending;

      case FeedbackStatus.DRAFT:
        return StageStatus.future;

      default:
        return StageStatus.future;
    }
  }

  saveFeedback(event: Event): void {
    event.stopPropagation();
    const payload = this.getCurrentPayload();

    if (!payload) {
      this.cancelEditFeedback(event);
      return;
    }

    // ================= UPDATE =================
    if (this.stageFeedbacks[0]?._id) {
      const updated: PipelineStageFeedback = {
        ...this.stageFeedbacks[0],
        source: FeedbackSource.HR,
        payload,
        modifiedDate: new Date(),
      };

      this.feedbackService
        .updateAsync(updated, true, false)
        .pipe(take(1))
        .subscribe({
          next: (res: PipelineStageFeedback) => {
            console.log('Stage feedback updated', res);

            this.cancelEditFeedback(event);
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error updating stage feedback', err);
            this.cdr.markForCheck();
          },
        });

      return;
    }

    // ================= CREATE =================
    const feedback: PipelineStageFeedback = {
      pipelineProgressId: this.selectedInterview?._id,
      talentId: this.selectedInterview?.talentId,
      positionId: this.selectedInterview?.positionId,
      stageId: this.selectedInterview?.stageId,
      stageType: this.selectedInterview?.stageType as StageType,
      source: FeedbackSource.HR,
      status: FeedbackStatus.DRAFT,

      payload,

      createdDate: new Date(),
    };

    this.feedbackService
      .createAsync(feedback, true, false)
      .pipe(take(1))
      .subscribe({
        next: (res: PipelineStageFeedback) => {
          console.log('Stage feedback created', res);

          this.stageFeedbacks.push(res);
          this.cancelEditFeedback(event);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error creating stage feedback', err);
          this.cdr.markForCheck();
        },
      });
  }

  private getCurrentPayload(): StageFeedbackPayload | null {
    switch (this.selectedInterview?.stageType) {
      case StageType.CV_REVIEW:
        return this.editCv ?? null;

      case StageType.SCREENING:
        return this.editScreening ?? null;

      case StageType.INTERVIEW:
        return this.editInterview ?? null;

      case StageType.ASSESSMENT:
        return this.editAssessment ?? null;

      default:
        return null;
    }
  }

  cancelEditFeedback(event?: Event): void {
    event?.stopPropagation();

    if (this.stageFeedbacks[0]?.payload && this.selectedInterview?.stageType) {
      this.initEditModel(this.selectedInterview.stageType as StageType, this.stageFeedbacks[0].payload);
    } else if (this.selectedInterview?.stageType) {
      this.initEmptyFeedback(this.selectedInterview?.stageType as StageType);
    }

    this.cdr.markForCheck();
  }

  saveFinalDecision(): void {
    if (!this.selectedInterview?._id) {
      return;
    }

    const update: TalentPipelineProgress = {
      _id: this.selectedInterview._id,
      finalDecision: this.finalDecisionForm.finalDecision,
      finalRejectionReason: this.finalDecisionForm.finalDecision === StageStatus.failed
        ? this.finalDecisionForm.finalRejectionReason
        : undefined,
      finalNotes: this.finalDecisionForm.finalNotes,
      finalDecisionBy: this.userId,
      finalDecisionDate: new Date(),
      userId: this.selectedInterview.userId,
      positionId: this.selectedInterview.positionId,
      positionPipelineId: this.selectedInterview.positionPipelineId,
      talentId: this.selectedInterview.talentId,
      talentName: this.selectedInterview.talentName || '',
      stageId: this.selectedInterview.stageId,
      stageName: this.selectedInterview.stageName || '',
      stageType: this.selectedInterview?.stageType as StageType,
      status: this.finalDecisionForm.finalDecision as StageStatus,
      notes: this.selectedInterview.notes || '',
    };

    this.pipelineProgressService
      .updateAsync(update, true, false)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          console.log('Final stage decision saved', res);
          this.stageStatusChange.emit({ stageId: update._id!, status: update.finalDecision! });
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error saving final decision', err);
          this.cdr.markForCheck();
        },
      });
  }

  // Old
  @Input() feedback: Feedback | null = null;

  getRecommendationClass(recommendation: string | undefined): string {
    const classes: Record<string, string> = {
      strong_yes: 'rec-strong-yes',
      yes: 'rec-yes',
      maybe: 'rec-maybe',
      no: 'rec-no',
      strong_no: 'rec-strong-no'
    };
    return classes[recommendation || ''] || '';
  }

  getRecommendationLabel(recommendation: string | undefined): string {
    const labels: Record<string, string> = {
      strong_yes: 'Strong Yes',
      yes: 'Yes',
      maybe: 'Maybe',
      no: 'No',
      strong_no: 'Strong No'
    };
    return labels[recommendation || ''] || 'N/A';
  }

  getRatingStars1(rating: any, max: number = 5): boolean[] {
    const scaledRating = Math.round((rating / 10) * max);
    return Array(max).fill(false).map((_, i) => i < scaledRating);
  }

  openLink(url: string | undefined): void {
    if (url) {
      window.open(url, '_blank');
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

  viewMeetingDetails() {
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

export type StarValue = 0 | 0.5 | 1;