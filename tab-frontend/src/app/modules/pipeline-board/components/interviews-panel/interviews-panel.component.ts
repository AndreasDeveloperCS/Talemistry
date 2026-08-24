import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PipelineStage } from 'src/app/modules/position-pipelines/models/pipeline-stage';
import { STAGE_STATUS_CONFIG, StageStatus } from 'src/app/modules/position-management/models/talent-pipeline-progress';
import { STAGES_NAMES } from 'src/app/modules/position-pipelines/models/default-pipeline-stages';
import { PipelineIcon, PIPELINES } from 'src/app/modules/position-pipelines/models/recruiting-pipeline';
import { Applicant, ApplicantStage } from 'src/app/modules/position-management/models/applicant-info';
import { TalentPipelineProgressService } from 'src/app/modules/position-management/services/talent-pipeline-progress.service';
import { take } from 'rxjs';
import { getPropertyName } from 'src/shared-functions/shared-functions';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-interviews-panel',
  templateUrl: './interviews-panel.component.html',
  styleUrl: './interviews-panel.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewsPanelComponent implements OnChanges {
  @Input() selectedApplicant: Applicant | null = null;
  @Input() selectedInterview: ApplicantStage | null = null;
  @Output() interviewSelected = new EventEmitter<ApplicantStage>();

  readonly EXCLUDED_STAGES = [
    STAGES_NAMES.SOURCED,
  ];

  private readonly PIPELINE_ICON_MAP = new Map<string, PipelineIcon>(
    PIPELINES.map(p => [p.name, p.icon])
  );

  hrComment: string = '';
  editingStageId: string | null = null;

  getStageIcon(stage: PipelineStage): string {
    return (this.PIPELINE_ICON_MAP.get(stage.name) || stage.icon || 'flag');
  }

  get visibleStages(): ApplicantStage[] {
    if (!this.selectedApplicant?.stages) {
      return [];
    }
    return this.selectedApplicant.stages.filter((stage: ApplicantStage) =>
      stage && !this.EXCLUDED_STAGES.includes(stage.name as STAGES_NAMES));
  }

  stageStatuses: StageStatus[] = [
    StageStatus.passed,
    StageStatus.failed,
    StageStatus.pending,
    StageStatus.future,
  ];

  // Optional: friendly labels for select
  stageStatusLabels: Record<StageStatus, string> = {
    [StageStatus.passed]: 'Passed',
    [StageStatus.failed]: 'Failed',
    [StageStatus.pending]: 'In Progress',
    [StageStatus.future]: 'Upcoming',
  };

  getStageStatusConfig(status: StageStatus) {
    return STAGE_STATUS_CONFIG[status] || STAGE_STATUS_CONFIG.future;
  }

  constructor(private cdr: ChangeDetectorRef,
    private router: Router,
    private talentPipelineProgressService: TalentPipelineProgressService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedApplicant']?.currentValue) {
      console.log('selectedApplicant', changes['selectedApplicant'].currentValue);
    }
  }

  getFinalDecisionStatus(stage: any): StageStatus {
    if (stage.finalDecision) {
      return stage.finalDecision;
    }

    return stage._id ? StageStatus.pending : StageStatus.future;
  }

  onSelectStage(stage: ApplicantStage, event: Event): void {
    this.cancelEditHrComment(event);
    if (stage) {
      this.selectedInterview = stage;
      this.cdr.markForCheck();
      this.interviewSelected.emit(stage);
    }
  }

  formatDate(dateString: string | Date): string {
    if (!dateString) {
      return '';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  joinMeeting(link: string | undefined, event: Event): void {
    event.stopPropagation();
    if (link) {
      window.open(link, '_blank');
    }
  }

  startEditHrComment(stage: any, event: Event) {
    event.stopPropagation();
    this.editingStageId = stage._id;
    this.hrComment = stage.notes ?? '';
  }

  cancelEditHrComment(event: Event) {
    event.stopPropagation();
    this.editingStageId = null;
    this.hrComment = '';
  }

  saveHrComment(stage: any, event: Event) {
    event.stopPropagation();
    console.log('Saving HR Comment:', stage, this.hrComment);
    const text = this.hrComment.trim();

    this.talentPipelineProgressService
      .patchAsync(stage._id, stage, getPropertyName<{ notes: boolean }>((e) => e.notes), text, true, false)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          console.log('Stage Note has been updated', res);
          const updatedStage = this.visibleStages.find(
            s => s._id === stage._id
          );

          if (updatedStage) {
            updatedStage.notes = text;
          }

          this.cancelEditHrComment(event);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error updating talent note', err);
          this.cdr.markForCheck();
        },
      });
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

  navigateToScreening(positionId: string): void {
    if(positionId) {
      window.open(`${environment.sourceUrl}/${environment.routes.screeningQuestionnaire}/${positionId}`, '_blank');
    }
  }

  onStageClick(stage: ApplicantStage, event: Event): void {
    event.stopPropagation();
    if (stage.stageType === 'screening' && stage.positionId) {
      this.navigateToScreening(stage.positionId);
    }
  }
}