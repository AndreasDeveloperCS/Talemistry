import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, filter, forkJoin, map, Observable, of, switchMap, take } from 'rxjs';
import { ChatMessageSendPayload } from 'src/app/modules/interviews/models/chat-message-payload';
import { CommunicationMean } from 'src/app/modules/interviews/models/communication-mean';
import { environment } from '../../../../../environments/environment';
import { NotificationWindowComponent } from '../../../general/dialogs/notification-window/notification-window.component';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { MessageType } from '../../../interviews/models/chat-message';
import { ChatRoom, ChatRoomType } from '../../../interviews/models/chat-room';
import { ChatMessageService } from '../../../interviews/services/chat-message.service';
import { ChatRoomService } from '../../../interviews/services/chat-room.service';
import { STAGES_NAMES } from '../../../position-pipelines/models/default-pipeline-stages';
import { PositionPipelineService } from '../../../position-pipelines/services/position-pipeline.service';
import { EnrichedTalentPipelineProgress, ITalentPipelineProgressGroup, STAGE_TRANSITIONS, StageStatus, TalentPipelineProgress } from '../../models/talent-pipeline-progress';
import { NotificationHelperService } from '../../services/notification-helper.service';
import { TalentPipelineProgressService } from '../../services/talent-pipeline-progress.service';
import { PipelineStageInfoComponent } from '../pipeline-stage-info/pipeline-stage-info.component';

@Component({
  selector: 'app-talents',
  templateUrl: './talents.component.html',
  styleUrl: './talents.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TalentsComponent {
  @Input() 
  positionId: any;

  groupedTalentProgress: ITalentPipelineProgressGroup[] = [];
  pipelineStages: any[] = []; 
  candidatesView: any[] = [];
  pipelineInterview: string = STAGES_NAMES.INTERVIEW;
  previousStage!: StageStatus;
  isLoading: boolean = true;
  sortMode = 'score'; 
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  selectedCommunicationMeans: CommunicationMean[] = [];
  preferredMeans: CommunicationMean[] = [];

  constructor(
    private dialogHelper: DialogHelperService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private chatRoomService: ChatRoomService,
    private chatMessageService: ChatMessageService,
    private notificationHelperService: NotificationHelperService,
    private pipelineService: PositionPipelineService,
    private talentPipelineProgressService: TalentPipelineProgressService
  ) {}
 
  ngOnInit(): void {
    this.deleteStage('698a805bea66db34bb911052');

    this.isLoading = true; 
    
    if(this.positionId) {
      forkJoin({
        pipeline: this.pipelineService.getPipelineByPositionId(this.positionId, true),
        progress: this.talentPipelineProgressService.getPipelineProgressByPositionId(this.positionId, true)
      })
      .pipe(take(1))
      .subscribe({
        next: ({ pipeline, progress }) => {
          this.pipelineStages = pipeline.stages.sort((a: { order: number; }, b: { order: number; }) => a.order - b.order);
          console.log('Pipeline stages', this.pipelineStages);
          console.log('Talent progress', progress);
          this.groupedTalentProgress = progress;
          this.buildCandidatesView();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading data', err);
          this.cdr.markForCheck();
        },
      });
    }
  }

  private buildCandidatesView(): void {
    if (!this.pipelineStages?.length || !this.groupedTalentProgress) {
      return;
    }

    this.candidatesView = this.groupedTalentProgress.map(group => {
      const { talentId, photoUrl, records } = group;
      let talentName = 'Unknown';
      console.log('Records', records);

      const stages = this.pipelineStages.map(stageDef => {
        const progress: EnrichedTalentPipelineProgress | undefined = records.find(pr => pr.stageId === stageDef._id);

        if (progress?.talentName) {
          talentName = progress.talentName;
        }

        return {
          _id: progress?._id,
          name: stageDef.name,
          icon: stageDef.icon,
          order: stageDef.order,
          description: stageDef.description,
          talentName: progress?.talentName,
          positionId: progress?.positionId,
          positionName: progress?.positionName,
          companyName: progress?.companyName,
          companyId: progress?.companyId,
          talentId: progress?.talentId,
          stageId: progress?.stageId,
          stageName: progress?.stageName,
          userId: progress?.userId,
          positionPipelineId: progress?.positionPipelineId,
          status: progress ? progress.status : StageStatus.future,
          interviewFeedback: progress?.interviewFeedback,
          assessmentScore: progress?.assessmentScore,
          createdDate: progress?.createdDate
        };
      });

      const shortTalentId = talentId.toString().slice(-7);
      return {
        talentId,
        shortTalentId,
        talentName,
        photoUrl, 
        stages,
        overallScore: this.calculateOverallScore(stages),
        createdDate: this.findAppliedDate(stages)
      };
    });
    this.sortCandidates();

    this.isLoading = false;
    this.cdr.markForCheck();
    console.log('Candidates view', this.candidatesView);
  }

  private calculateOverallScore(stages: any[], maxScorePerStage = 10): number {
    if (!stages?.length) return 0;

    const totalScore = stages.reduce((sum, s) => sum + (s.assessmentScore ?? 0), 0);

    const maxTotal = stages.length * maxScorePerStage;

    return Math.round((totalScore / maxTotal) * 100);
  }

  private findAppliedDate(stages: any[]): Date | null {
    const firstStage = stages[0];
    return firstStage?.createdDate ? new Date(firstStage.createdDate) : null;
  }

  setSortMode(mode: string): void {
    this.sortMode = mode;
    this.sortCandidates();
  }

  private sortCandidates(): void {
    if (!this.candidatesView) {
      return;
    }

    if (this.sortMode === 'score') {
      this.candidatesView.sort((a, b) => b.overallScore - a.overallScore);
    } else if (this.sortMode === 'date') {
      this.candidatesView.sort(
        (a, b) =>
          new Date(b.createdDate).getTime() -
          new Date(a.createdDate).getTime()
      );
    }
  }

  viewStageInfo(stage: any): void {
    console.log('viewStageInfo', stage);
    this.previousStage = stage.status;

    switch(stage.name) {
      case STAGES_NAMES.SOURCED: 
        console.log('Stage:', STAGES_NAMES.SOURCED);
        this.editStageInfo(stage, this.previousStage);
        break;
      case STAGES_NAMES.APPLIED: 
        console.log('Stage:', STAGES_NAMES.APPLIED, stage);
        this.editStageInfo(stage, this.previousStage);
        break;
      case STAGES_NAMES.SCREENING: 
        console.log('Stage:', STAGES_NAMES.SCREENING);
        this.editStageInfo(stage, this.previousStage);
        break;
      case STAGES_NAMES.ASSESSMENT: 
        console.log('Stage:', STAGES_NAMES.ASSESSMENT);
        this.editStageInfo(stage, this.previousStage);
        break;
      case STAGES_NAMES.INTERVIEW: 
        console.log('Stage:', STAGES_NAMES.INTERVIEW);
        this.editStageInfo(stage, this.previousStage);
        break;
      case STAGES_NAMES.OFFER: 
        console.log('Stage:', STAGES_NAMES.OFFER);
        this.editStageInfo(stage, this.previousStage);
        break;
      case STAGES_NAMES.HIRED: 
        console.log('Stage:', STAGES_NAMES.HIRED);
        this.editStageInfo(stage, this.previousStage);
        break;
    }
  }

  editStageInfo(stage: EnrichedTalentPipelineProgress, previousStage: StageStatus) {
    this.dialogHelper.openDialog(PipelineStageInfoComponent, 
      (updatedStage: EnrichedTalentPipelineProgress) => {
        console.log('Stage dialog result', updatedStage)
        if(updatedStage !== undefined) {
          this.updateStage(previousStage, updatedStage);
        }
        }, 
      { panelClass: "panel-class-dialog", data: stage }
    );
  }

  updateStage(previousStage: StageStatus, updatingStage: EnrichedTalentPipelineProgress) {
    console.log('updateStage', previousStage, updatingStage);
    this.talentPipelineProgressService
      .updateAsync(updatingStage, true, false)
      .pipe(take(1))
      .subscribe({
        next: (updatedStage) => {
          if(updatedStage) {
            console.log('Stage successfully updates', updatedStage);

            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Stage progress has been updated!" }
            });

            console.log(previousStage, updatingStage.status);

            if(updatingStage.status === StageStatus.failed) {
              // const enrichedStage: EnrichedTalentPipelineProgress = {
              //   positionName: previousStage.posi
              // }
              //this.sendNotificationAboutFailedStage(updatingStage);
            }
            const wasPassedBefore = previousStage === StageStatus.passed;
            const isPassedNow = updatingStage.status === StageStatus.passed;

            if (!wasPassedBefore && isPassedNow) {
              const nextStageName = STAGE_TRANSITIONS[updatingStage.stageName as STAGES_NAMES];
              console.log(nextStageName);

              if (nextStageName) {
                const alreadyExists = this.pipelineStages.some(
                  (s) => s.stageName === nextStageName
                );

                if (!alreadyExists) {
                  this.createNextPipelineStage(updatingStage, nextStageName);
                } else {
                  console.log(`Stage "${nextStageName}" already exists — skipping creation.`);
                }
              } else {
                console.log('Final stage reached, no next stage to create.');
              }
            } else {
              console.log('Stage was already created before — skipping new stage creation.');
            }
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error updating stage', err);
          this.cdr.markForCheck();
        },
      });
  }

  private createNextPipelineStage(prevStage: EnrichedTalentPipelineProgress, nextStageName: STAGES_NAMES): void {
    // console.log('Attempting to create next pipeline stage:', nextStageName);
    console.log('prevStage EnrichedTalentPipelineProgress:', prevStage);

    const candidateIndex = this.candidatesView.findIndex(
      (c) => c.talentId === prevStage.talentId
    );

    if (candidateIndex === -1) {
      console.warn('Candidate not found in candidatesView for talentId:', prevStage.talentId);
      return;
    }

    const candidate = this.candidatesView[candidateIndex];
    const existingStage = candidate.stages.find(
      (stage: any) => stage.name === nextStageName
    );

    if (existingStage?. _id) {
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
    nextStage.stageId = stageInfo._id;
    nextStage.status = StageStatus.pending;
    nextStage.assessmentScore = 1;
    nextStage.createdBy = this.userId;

    console.log(`Creating next stage: ${nextStageName}`, nextStage);

    this.talentPipelineProgressService.createAsync(nextStage, true, false)
      .pipe(take(1))
      .subscribe({
        next: (created: TalentPipelineProgress) => {
          if(created) {
            console.log('✅ Next stage created:', created);

            this.dialog.open(NotificationWindowComponent, {
              data: { 
                message: `${nextStageName} stage has been created automatically.` 
              },
            });

            const enrichedNextStage: EnrichedTalentPipelineProgress = {
              positionName: prevStage.positionName,
              companyName: prevStage.companyName,
              companyId: prevStage.companyId,
              ...nextStage,
            };

            this.sendNotificationAboutPassedStage(enrichedNextStage);

            const stageToUpdate = candidate.stages.find(
              (s: any) => s.name === created.stageName
            );

            if (stageToUpdate) {
              stageToUpdate._id = created._id;
              stageToUpdate.status = created.status;
              stageToUpdate.createdDate = created.createdDate;
            } 

            this.candidatesView[candidateIndex] = { ...candidate };
            this.candidatesView = [...this.candidatesView];

            console.log('🟢 Updated candidatesView:', this.candidatesView[candidateIndex]);
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
        const message: ChatMessageSendPayload = {
          roomId,
          senderId: this.userId,
          receiverId: stage.talentId,
          content: text,
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

        return this.chatMessageService.createAsync(message, true, false);
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

  createOrGetChatRoomId(stage: EnrichedTalentPipelineProgress): Observable<string | null> {
    const chatRoom: ChatRoom = {
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

  // sendNotificationAboutFailedStage(stage: EnrichedTalentPipelineProgress) {
  //   console.log('Failed Stage Notification');
  //   this.createOrGetChatRoomId(stage).pipe(
  //     take(1),
  //     filter((roomId): roomId is string => !!roomId), 
  //     switchMap((roomId) => {
  //       console.log('RoomId notifyTalentViaChatMessage', roomId);
  //       const text = this.notificationTemplatesService.generateRejectionNotification(
  //         stage.talentName, 
  //         stage.positionName,
  //         `${environment.routes.positions}/${stage.positionId}`,
  //         stage.stageName,
  //         stage.finalRejectionReason,
  //         stage.interviewFeedback
  //       );

  //       console.log('Notification Text', text);

  //       if (!text) return of(null);

  //       const message: ChatMessage = {
  //         roomId,
  //         senderId: this.userId,
  //         content: text,
  //         type: MessageType.TEXT,
  //         status: {
  //           deliveredTo: [],
  //           readBy: []
  //         },
  //         userId: this.userId,
  //         createdDate: new Date()
  //       };

  //       console.log('Message before sending', message);
  //       this.cdr.markForCheck();
  //       return this.chatMessageService.createAsync(message, true, false);
  //     })
  //   ).pipe(take(1)).subscribe({
  //     next: (res) => {
  //       if (res && res._id) {
  //         console.log('Chat message was successfully sent', res);
  //       }
  //       this.cdr.markForCheck();
  //     },
  //     error: (err) => {
  //       console.error('Error during notification', err);
  //       this.cdr.markForCheck();
  //     }
  //   });
  // }

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
          console.error('Error deleting stage', err);
          this.cdr.markForCheck();
        },
    });
  }
}
