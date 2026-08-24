import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { catchError, filter, forkJoin, map, of, switchMap, take } from 'rxjs';
import { AuthService, convertRoleToRoute } from 'src/app/modules/authentication/services/auth.service';
import { Applicant, ApplicantStage } from 'src/app/modules/position-management/models/applicant-info';
import { TalentPipelineProgressService } from 'src/app/modules/position-management/services/talent-pipeline-progress.service';
import { STAGES_NAMES } from 'src/app/modules/position-pipelines/models/default-pipeline-stages';
import { PipelineStage } from 'src/app/modules/position-pipelines/models/pipeline-stage';
import { environment } from '../../../../../environments/environment';
import { ChatMessageService } from '../../../interviews/services/chat-message.service';
import { ChatRoomService } from '../../../interviews/services/chat-room.service';
import { MessageType } from 'src/app/modules/interviews/models/chat-message';
import { ChatRoomType } from 'src/app/modules/interviews/models/chat-room';
import { EnrichedTalentPipelineProgress, ITalentPipelineProgressGroup, StageStatus, TalentPipelineProgress } from '../../../position-management/models/talent-pipeline-progress';
import { normalizeStageName, PositionPipelineService } from '../../../position-pipelines/services/position-pipeline.service';
import { StageCount } from '../../models/pipeline-board-types';
import { TalentNote, TalentNoteVisibility } from '../../models/talent-note';
import { TalentNotesService } from '../../services/talent-note.service';
import { NotificationHelperService } from 'src/app/modules/position-management/services/notification-helper.service';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { DialogHelperService } from 'src/app/modules/general/services/dialog-helper.service';
import { NextStageDialogComponent } from '../next-stage-dialog/next-stage-dialog.component';
import { AssessmentType, NextStageDialogResult } from '../../interfaces/next-stage-dialog-info';

@Component({
  selector: 'app-applicants-panel',
  templateUrl: './applicants-panel.component.html',
  styleUrl: './applicants-panel.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplicantsPanelComponent implements OnChanges {
  @Input()
  positionId: string | null = null;

  @Input()
  positionTitle: string | null = null;

  @Input()
  selectedStage: STAGES_NAMES | null = null;

  @Input()
  selectedApplicant: any | null = null;

  @Output()
  applicantSelected = new EventEmitter<Applicant>();

  @Output()
  applicantUpdated = new EventEmitter<Applicant>();

  @Output()
  stageChanged = new EventEmitter<{ applicantId: string; stage: STAGES_NAMES }>();

  @Output()
  applicantsCountChanged = new EventEmitter<number>();

  @Output()
  stageCounts = new EventEmitter<StageCount[]>();

  groupedTalentProgress: ITalentPipelineProgressGroup[] = [];
  stages = Object.values(STAGES_NAMES);
  pipelineStages: any[] = [];
  applicantsView: any[] = [];
  fullApplicantsView: any[] = [];
  previousStage!: StageStatus;
  isLoading: boolean = false;
  sortMode = 'score';
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  hrComment: string = '';
  editingTalentId: string | null = null;
  bookingToken: string | null = null;
  assessmentType: AssessmentType = AssessmentType.LIVE_CODING;
  assessmentLinkId: string | null = null;

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private chatRoomService: ChatRoomService,
    private chatMessageService: ChatMessageService,
    private pipelineService: PositionPipelineService,
    private talentNotesService: TalentNotesService,
    private talentPipelineProgressService: TalentPipelineProgressService,
    private notificationHelperService: NotificationHelperService,
    private dialogHelper: DialogHelperService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.deleteStage('69fa0cc70c6ad462612e08fb');
    if (changes['positionId']?.currentValue) {
      this.positionId = changes['positionId']?.currentValue;
      console.log('Selected position id', this.positionId);
      this.loadData(changes['positionId'].currentValue);
    }
    if (changes['positionTitle']?.currentValue) {
      this.positionTitle = changes['positionTitle'].currentValue;
    }
    if (changes['selectedApplicant']?.currentValue) {
      const newSelected = changes['selectedApplicant'].currentValue;
      const prevSelected = changes['selectedApplicant']?.previousValue;
      console.log('Selected applicant changed', newSelected);

      // If we already have the applicants view loaded, update the matching applicant
      if (this.applicantsView?.length) {
        const idx = this.applicantsView.findIndex(a => a.talentId === newSelected.talentId);
        if (idx > -1) {
          const updatedApplicant = {
            ...this.applicantsView[idx],
            stages: newSelected.stages ?? this.applicantsView[idx].stages,
            overallScore: this.calculateOverallScore(newSelected.stages ?? this.applicantsView[idx].stages),
            createdDate: this.findAppliedDate(newSelected.stages ?? this.applicantsView[idx].stages)
          };

          this.applicantsView[idx] = updatedApplicant;

          // Keep fullApplicantsView in sync too
          const fullIdx = this.fullApplicantsView.findIndex(a => a.talentId === newSelected.talentId);
          if (fullIdx > -1) {
            this.fullApplicantsView[fullIdx] = { ...this.fullApplicantsView[fullIdx], ...updatedApplicant };
          }

          // Recompute counts and notify consumers
          this.handleApplicantView();
        }
      }

      // Detect transitions: when any stage moves from not-passed to passed
      if (prevSelected?.stages && newSelected?.stages) {
        const prevStages: TalentPipelineProgress[] = prevSelected.stages;
        const newStages: TalentPipelineProgress[] = newSelected.stages;

        newStages.forEach((ns) => {
          const ps = prevStages.find(p => p.stageId === ns.stageId || p.stageType === ns.stageType || p.stageName === ns.stageName);
          const wasPassed = ps ? (ps.status === StageStatus.passed || ps.finalDecision === StageStatus.passed) : false;
          const isPassed = ns ? (ns.status === StageStatus.passed || ns.finalDecision === StageStatus.passed) : false;

          if (!wasPassed && isPassed) {
            const currentIndex = this.pipelineStages.findIndex((s: any) => s.name === (ns.stageName));
            const nextInfo = currentIndex > -1 ? this.pipelineStages[currentIndex + 1] : undefined;

            if (!nextInfo) {
              return;
            }
            const nextStage = nextInfo.name as STAGES_NAMES;
            const enrichedPrev: EnrichedTalentPipelineProgress = {
              positionName: (ns as any).positionName ?? undefined,
              companyName: (ns as any).companyName ?? undefined,
              companyId: (ns as any).companyId ?? undefined,
              ...ns
            } as EnrichedTalentPipelineProgress;
            if (nextStage === STAGES_NAMES.INTERVIEW 
              || nextStage === STAGES_NAMES.SCREENING 
              || nextStage === STAGES_NAMES.ASSESSMENT
            ) {
              console.log('Before NextStageDialog initialized with data', this.positionId);
              this.dialog.open(NextStageDialogComponent, {
                width: '500px',
                data: {
                  stage: nextStage,
                  candidate: enrichedPrev,
                  positionId: this.positionId,
                  positionTitle: this.positionTitle
                },
              })
              .afterClosed()
              .subscribe((result: NextStageDialogResult) => {
                console.log('NextStageDialog result', result);
                if (!result || !result.confirmed) {
                  return;
                }
                if(nextStage === STAGES_NAMES.ASSESSMENT && result.assessment) {
                  this.assessmentType = result.assessment.type;
                  this.assessmentLinkId = result.assessment.linkId;
                }
                if(nextStage === STAGES_NAMES.INTERVIEW && result.bookingToken) {
                  this.bookingToken = result.bookingToken;
                }

                this.createNextPipelineStage(enrichedPrev, nextStage);
              });
            } else {
              const executeCreateNextStage = (confirmed: boolean) => {
                if(!confirmed) {
                  return;
                }
                this.createNextPipelineStage(enrichedPrev, nextStage as STAGES_NAMES);
              }
              this.dialogHelper.confirmRequestDialog(
                executeCreateNextStage, 
                `Do you want to move the applicant to the next stage '${nextStage}'?`
              );
            }
          }
        });
      }

      // Ensure any other UI that depends on selectedApplicant updates
      this.getCurrentStageName(newSelected.stages);
      this.cdr.markForCheck();
    }
    if ('selectedStage' in changes) {
      this.filterApplicantsByStage(changes['selectedStage'].currentValue);
    }
  }

  private loadData(positionId: string): void {
    this.isLoading = true;

    if (positionId) {
      forkJoin({
        pipeline: this.pipelineService.getPipelineByPositionId(positionId, true),
        progress: this.talentPipelineProgressService.getPipelineProgressByPositionId(positionId, true)
      })
        .pipe(take(1))
        .subscribe({
          next: ({ pipeline, progress }) => {
            this.pipelineStages = pipeline.stages.sort((a: { order: number; }, b: { order: number; }) => a.order - b.order);
            console.log('Pipeline stages', this.pipelineStages);

            // CRITICAL DEBUG: Log raw backend response to diagnose skills issue
            console.log('🔍 DEBUG - Backend response (progress):', progress);
            console.log('🔍 DEBUG - Progress item example:', progress?.[0]);
            console.log('🔍 DEBUG - Skills in first group:', progress?.[0]?.skills);

            this.groupedTalentProgress = progress;
            this.buildApplicantsView();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error loading data', err);
            this.cdr.markForCheck();
          },
        });
    }
  }

  private buildApplicantsView(): void {
    if (!this.pipelineStages?.length || !this.groupedTalentProgress) {
      return;
    }

    this.applicantsView = this.groupedTalentProgress.map(group => {
      const { talentId, photoUrl, records, talentNote, skills }: ITalentPipelineProgressGroup = group;
      let talentName = 'Unknown';

      // CRITICAL DEBUG: Log skills data structure to diagnose production issue
      console.log('🔍 DEBUG - Processing applicant:', {
        talentId,
        hasSkills: !!skills,
        skillsIsArray: Array.isArray(skills),
        skillsLength: skills?.length,
        skillsRaw: skills,
        firstSkill: skills?.[0]
      });

      const stages = this.pipelineStages.map(stageDef => {
        const progress: EnrichedTalentPipelineProgress | undefined = records.find(pr => pr.stageId === stageDef._id);

        if (progress?.talentName) {
          talentName = progress.talentName;
        }

        return {
          ...(progress ?? {}),
          name: stageDef.name,
          icon: stageDef.icon,
          order: stageDef.order,
          description: stageDef.description,
          stageType: stageDef?.type,
          status: progress?.status ?? StageStatus.future,
        } as ApplicantStage;
      });

      return {
        talentId,
        talentName,
        photoUrl,
        stages,
        talentNote,
        skills: skills || [], // Ensure skills is always an array, never undefined
        overallScore: this.calculateOverallScore(stages),
        createdDate: this.findAppliedDate(stages)
      };
    });
    this.sortApplicants();
    this.fullApplicantsView = [...this.applicantsView];

    this.isLoading = false;
    this.handleApplicantView();
    this.cdr.markForCheck();
    console.log('Candidates view', this.applicantsView);
  }

  filterApplicantsByStage(stage: STAGES_NAMES | null) {
    if (!this.fullApplicantsView?.length) {
      return;
    }

    if (!stage) {
      this.applicantsView = [...this.fullApplicantsView];
    } else {
      const normalizedStage = normalizeStageName(stage);

      this.applicantsView = this.fullApplicantsView.filter(applicant => {
        if (!Array.isArray(applicant.stages)) {
          return false;
        }

        const validStages = applicant.stages.filter((s: any) => s?.stageName);
        const highestStage = validStages[validStages.length - 1];

        return highestStage && normalizeStageName(highestStage.stageName) === normalizedStage;
      });
    }

    this.cdr.markForCheck();
  }

  handleApplicantView() {
    if (this.applicantsView) {
      this.applicantsCountChanged.emit(this.applicantsView.length);
      const counts = this.buildStageCounts(
        this.pipelineStages,
        this.applicantsView
      );
      if (counts.length > 0) {
        this.stageCounts.emit(counts);
      }
    }
  }

  private buildStageCounts(pipelineStages: PipelineStage[], applicantsView: Applicant[]): StageCount[] {

    if (!pipelineStages?.length) {
      return [];
    }

    const countsMap = new Map<STAGES_NAMES, number>();

    pipelineStages.forEach(stage => {
      const stageKey = normalizeStageName(stage.name);
      countsMap.set(stageKey, 0);
    });

    applicantsView?.forEach(applicant => {
      if (!applicant.stages?.length) return;

      const currentStageKey = this.getCurrentStageName(applicant.stages);
      if (!currentStageKey) return;

      if (countsMap.has(currentStageKey)) {
        countsMap.set(
          currentStageKey,
          countsMap.get(currentStageKey)! + 1
        );
      }
    });

    return pipelineStages.map(stage => {
      const stageKey = normalizeStageName(stage.name);

      return {
        stage: stageKey,
        count: countsMap.get(stageKey) ?? 0
      };
    });
  }

  getCurrentStageName(stages: ApplicantStage[]): STAGES_NAMES | null {
    if (!stages?.length) {
      return null;
    }

    // Prefer finalDecision (explicit pass/fail) when available
    const finalDecisionStages = stages.filter(
      stage => stage.finalDecision !== undefined && stage.finalDecision !== StageStatus.future
    );

    if (finalDecisionStages.length) {
      return normalizeStageName(finalDecisionStages[finalDecisionStages.length - 1].name);
    }

    // Fallback: use stage status (e.g., pending) — include any stage that is not "future"
    const progressedStages = stages.filter(s => s.status !== StageStatus.future);
    if (progressedStages.length) {
      return normalizeStageName(progressedStages[progressedStages.length - 1].stageName || progressedStages[progressedStages.length - 1].name);
    }

    return null;
  }

  private calculateOverallScore(stages: any[], maxScorePerStage = 10): number {
    if (!stages?.length) return 0;

    const totalScore = stages.reduce((sum, s) => sum + (s?.assessmentScore ?? 0), 0);

    const maxTotal = stages.length * maxScorePerStage;

    return maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;
  }

  private findAppliedDate(stages: any[]): Date | null {
    const firstStage = stages[0];
    return firstStage?.createdDate ? new Date(firstStage.createdDate) : null;
  }

  private sortApplicants(): void {
    if (!this.applicantsView) {
      return;
    }

    if (this.sortMode === 'score') {
      this.applicantsView.sort((a, b) => b.overallScore - a.overallScore);
    } else if (this.sortMode === 'date') {
      this.applicantsView.sort(
        (a, b) =>
          new Date(b.createdDate).getTime() -
          new Date(a.createdDate).getTime()
      );
    }
  }

  startEditHrComment(applicant: any, event: Event) {
    event.stopPropagation();
    this.editingTalentId = applicant.talentId;
    this.hrComment = applicant.talentNote?.text ?? '';
  }

  cancelEditHrComment(event: Event) {
    event.stopPropagation();
    this.editingTalentId = null;
    this.hrComment = '';
  }

  saveHrComment(applicant: any, event: Event) {
    event.stopPropagation();
    const text = this.hrComment.trim();

    if (applicant.talentNote?._id) {
      this.talentNotesService
        .updateAsync(applicant.talentNote, true, false)
        .pipe(take(1))
        .subscribe({
          next: (res) => {
            console.log('Talent Note has been updated', res);
            const talent = this.applicantsView.find(
              a => a.talentId === applicant.talentId.toString()
            );

            if (talent) {
              applicant.talentNote.text = text;
            }

            this.cancelEditHrComment(event);
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error updating talent note', err);
            this.cdr.markForCheck();
          },
        });

      return;
    }

    if (!text) {
      this.cancelEditHrComment(event);
      return;
    }

    const talentNote: TalentNote = {
      talentId: applicant.talentId,
      positionId: this.positionId,
      text,
      visibility: TalentNoteVisibility.PRIVATE,
      createdDate: new Date()
    };

    this.talentNotesService
      .createAsync(talentNote, true, false)
      .pipe(take(1))
      .subscribe({
        next: (res: TalentNote) => {
          console.log('Talent Note has been created', res);
          const talent = this.applicantsView.find(
            a => a.talentId === res.talentId.toString()
          );

          if (talent) {
            applicant.talentNote = res;
          }

          this.cancelEditHrComment(event);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error creating talent note', err);
          this.cdr.markForCheck();
        },
      });
  }

  onSelectApplicant(applicant: Applicant, event: Event): void {
    if (applicant) {
      this.selectedApplicant = applicant;
      this.cdr.markForCheck();
      this.applicantSelected.emit(applicant);
    }
  }

  onStageChange(applicantId: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStage = select.value as STAGES_NAMES;
    this.stageChanged.emit({ applicantId, stage: newStage });
    event.stopPropagation();
  }

  getInitials(applicant: any): string {
    if (!applicant?.talentName || applicant.talentName.length === 0) {
      return '?';
    }
    return `${applicant.talentName[0]}`;
  }

  getApplicantStageClass(stages: TalentPipelineProgress[]): string {
    const stage = this.getCurrentStage(stages);
    return stage ? this.getStageClass(stage as STAGES_NAMES) : '';
  }

  getCurrentStage(stages: TalentPipelineProgress[]): string | null {
    if (!stages?.length) {
      return null;
    }

    const completedStages = stages.filter(
      s => s?.status !== 'future'
    );

    if (!completedStages.length) {
      return null;
    }

    const stageName = completedStages[completedStages.length - 1].stageName;
    return this.capitalizeFirst(stageName);
  }

  private capitalizeFirst(value: string): string {
    if (!value) {
      return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  getStageClass(stage: STAGES_NAMES): string {
    console.log('Get stage class for', stage);
    const classes: Record<STAGES_NAMES, string> = {
      [STAGES_NAMES.SOURCED]: 'stage-sourced',
      [STAGES_NAMES.APPLIED]: 'stage-applied',
      [STAGES_NAMES.SCREENING]: 'stage-screening',
      [STAGES_NAMES.ASSESSMENT]: 'stage-assessment',
      [STAGES_NAMES.INTERVIEW]: 'stage-interview',
      [STAGES_NAMES.OFFER]: 'stage-offer',
      [STAGES_NAMES.HIRED]: 'stage-hired'
    };
    return classes[stage] ?? '';
  }

  getMatchScoreClass(score: number): string {
    if (score >= 75) {
      return 'score-excellent';
    }
    if (score >= 50) {
      return 'score-good';
    }
    if (score >= 25) {
      return 'score-average';
    }
    return 'score-low';
  }

  openProfile(talentId: string | undefined, event: Event): void {
    event.stopPropagation();
    if (talentId) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree([
          environment.routes.talentTab.publicProfile,
          talentId,
        ])
      );
      window.open(url, '_blank');
    }
  }

  formatDate(dateString: any): string {
    if (!dateString) {
      return '';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  startChat(applicant: Applicant, event: Event): void {
    event.stopPropagation();
    if (!this.userId || !applicant?.talentId) {
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
      `?contactId=${applicant.talentId}` +
      `&name=${encodeURIComponent(applicant.talentName ?? 'Unknown')}`;

    window.open(url, '_blank');
  }

  startCall(applicant: Applicant, event: Event): void {
    event.stopPropagation();
    //console.log(`Start ${type} call with`, applicant.phone);
  }

  private createNextPipelineStage(
    prevStage: EnrichedTalentPipelineProgress,
    nextStageName: STAGES_NAMES
  ): void {
    console.log('createNextPipelineStage', prevStage, nextStageName);

    const candidateIndex = this.applicantsView.findIndex(
      c => c.talentId === prevStage.talentId
    );

    if (candidateIndex === -1) {
      console.warn('Candidate not found in applicantsView for talentId:', prevStage.talentId);
      return;
    }

    const candidate = this.applicantsView[candidateIndex];

    const existingStage = candidate.stages.find(
      (stage: any) => stage.name === nextStageName || stage.stageName === nextStageName
    );

    if (existingStage?._id) {
      console.log(`Stage "${nextStageName}" already exists in candidate ${candidate.talentName}, skipping creation.`);
      return;
    }

    const stageInfo = this.pipelineStages.find(
      (stage: any) => stage.name === nextStageName
    );

    if (!stageInfo) {
      console.warn(`Stage "${nextStageName}" not found in pipelineStages`);
      return;
    }

    const nextStage = new TalentPipelineProgress();
    nextStage.userId = prevStage.userId;
    nextStage.positionId = prevStage.positionId;
    nextStage.positionPipelineId = prevStage.positionPipelineId;
    nextStage.talentId = prevStage.talentId;
    nextStage.talentName = prevStage.talentName;
    nextStage.stageName = nextStageName;
    nextStage.stageType = stageInfo.type;
    nextStage.stageId = stageInfo._id;
    nextStage.status = StageStatus.pending;
    nextStage.finalDecision = StageStatus.pending;
    nextStage.assessmentScore = 1;
    nextStage.createdBy = this.userId;

    console.log(`Creating next stage: ${nextStageName}`, nextStage);

    this.talentPipelineProgressService.createAsync(nextStage, true, false)
      .pipe(take(1))
      .subscribe({
        next: (created: TalentPipelineProgress) => {
          if (created) {
            console.log('✅ Next stage created:', created);

            this.dialog.open(NotificationWindowComponent, {
              data: { message: `${nextStageName} stage has been created automatically.` },
            });

            const enrichedNextStage: EnrichedTalentPipelineProgress = {
              positionName: prevStage.positionName,
              companyName: prevStage.companyName,
              companyId: prevStage.companyId,
              assessmentLinkId: this.assessmentLinkId ?? undefined,
              assessmentType: this.assessmentType ?? undefined,
              bookingToken: this.bookingToken ?? undefined,
              ...nextStage,
            };

            this.sendNotificationAboutPassedStage(enrichedNextStage);
            const updatedStages = candidate.stages.map((stage: ApplicantStage) => {
              const isTarget =
                stage.stageId === created.stageId ||
                stage.stageName === created.stageName ||
                stage.name === created.stageName;

              if (!isTarget) {
                return stage;
              }

              return {
                ...stage,          // keeps icon, order, description
                ...created,        // adds status, finalDecision, createdDate, etc.
                name: stage.name ?? created.stageName,
                stageName: created.stageName,   // ensure both exist
              };
            });

            const updatedApplicant = { ...candidate, stages: updatedStages };

            /** replace in both arrays immutably **/
            this.applicantsView = this.applicantsView.map(a =>
              a.talentId === updatedApplicant.talentId ? updatedApplicant : a
            );

            this.fullApplicantsView = this.fullApplicantsView.map(a =>
              a.talentId === updatedApplicant.talentId ? updatedApplicant : a
            );

            this.sortApplicants();
            this.handleApplicantView();

            console.log('🟢 applicantsView:', this.applicantsView);
            console.log('🟢 fullApplicantsView:', this.fullApplicantsView);

            /** emit updates **/
            this.applicantUpdated.emit(updatedApplicant);

            if (this.selectedApplicant?.talentId === updatedApplicant.talentId) {
              this.selectedApplicant = updatedApplicant;
              this.applicantSelected.emit(updatedApplicant);
            }

            console.log('🟢 Updated applicantsView:', updatedApplicant);
          }

          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('❌ Error creating next stage', err);
          this.cdr.markForCheck();
        },
      });
  }

  sendNotificationAboutPassedStage(stage: EnrichedTalentPipelineProgress) {
    this.createOrGetChatRoomId(stage).pipe(
      take(1),
      filter((roomId): roomId is string => !!roomId),

      switchMap(roomId => {
        const text = '';

        return this.chatMessageService
          .getPreferredCommunicationMeans(
            stage.talentId,
            this.chatMessageService.defaultCommunicationMeans
          )
          .pipe(
            take(1),
            map(preferredMeans => ({ roomId, text, preferredMeans }))
          );
      }),

      switchMap((payload) => {
        if (!payload) {
          return of(null);
        }
        const { roomId, text, preferredMeans } = payload;
        const variables = this.notificationHelperService.getTemplateVariables(stage) || {};
        const templatName = this.notificationHelperService.getTemplateName(stage);
        const messageText = this.notificationHelperService.getMessageContent(stage);
        const message: any = {
          roomId,
          senderId: this.userId,
          receiverId: stage.talentId,
          content: text || messageText || 'Your application has progressed to the next stage.',
          type: MessageType.TEXT,
          variables: variables,
          templateName: templatName,
          status: {
            deliveredTo: [],
            readBy: []
          },
          selectedCommunicationMeans: preferredMeans.length
            ? preferredMeans
            : undefined,
          userId: this.userId,
          createdDate: new Date()
        };

        console.log('Message before sending', message);
        this.cdr.markForCheck();

        return this.chatMessageService.createNewStageMessageAsync(message, true, false);
      })
    ).subscribe({
      next: (res) => {
        if (res?._id) {
          console.log('Chat message was successfully sent', res);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error during notification', err);
        this.cdr.markForCheck();
      }
    });
  }

  createOrGetChatRoomId(stage: EnrichedTalentPipelineProgress) {
    const chatRoom: any = {
      positionId: stage.positionId,
      participants: [
        { userId: this.userId, joinedAt: new Date() },
        { userId: stage.talentId, joinedAt: new Date() }
      ],
      type: ChatRoomType.DIRECT,
      userId: this.userId,
      createdBy: this.userId,
      createdDate: new Date()
    };

    console.log('Creating or getting chat room', chatRoom);

    return this.chatRoomService.createAsync(chatRoom, true, false).pipe(
      switchMap((res) => {
        if (res && res._id) {
          console.log('Chat room created or exists', res);
          const roomId = res._id;
          this.cdr.markForCheck();
          return of(roomId);
        } else {
          return of(null);
        }
      }),
      catchError((err) => {
        console.error('Error creating chat room', err);
        this.cdr.markForCheck();
        return of(null);
      })
    );
  }

  deleteStage(stageId: string) {
    this.talentPipelineProgressService
      .deleteAsync(stageId, true, false)
      .pipe(take(1))
      .subscribe({
        next: (deleted) => {
          console.log('Stage deleted', deleted);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error updating stage', err);
          this.cdr.markForCheck();
        },
    });
  }
}
