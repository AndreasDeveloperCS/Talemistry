import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { IApplicantsByStage, IApplicantsByStageGlobal, IApplicantsByStageItem } from 'src/app/modules/position-management/models/talent-pipeline-progress';
import { TalentPipelineProgressService } from 'src/app/modules/position-management/services/talent-pipeline-progress.service';
import { StageType } from 'src/app/modules/position-pipelines/models/pipeline-stage';

@Component({
  selector: 'app-applicants-by-stage-preview',
  templateUrl: './applicants-by-stage-preview.component.html',
  styleUrl: './applicants-by-stage-preview.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplicantsByStagePreviewComponent implements OnInit {
  @Input()
  positionId!: string;

  @Input()
  stageType!: string | StageType;

  applicants: IApplicantsByStageItem[] = [];
  stageName: string = '';
  positionTitle: string = '';
  loading: boolean = false;

  constructor(
    private talentPipelineProgressService: TalentPipelineProgressService,
    private uiInteractionService: UiInteractionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.positionId) {
      this.loadApplicantsByPositionIdStageType();
    } else {
      this.loadApplicantsByStageType();
    }
  }

  loadApplicantsByPositionIdStageType(): void {
    this.loading = true;

    this.talentPipelineProgressService
      .getPipelineProgressByPositionStageType(this.positionId, this.stageType as StageType, true)
      .pipe(take(1))
      .subscribe({
        next: (res: IApplicantsByStage) => {
          console.log('Applicants by stage:', res);
          if(res) {
            this.applicants = res.applicants || [];
            this.stageName = res.stageName || '';
            this.positionTitle = res.positionTitle || '';
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadApplicantsByStageType(): void {
    this.loading = true;

    this.talentPipelineProgressService
      .getPipelineProgressByStageType(this.stageType as StageType, true)
      .pipe(take(1))
      .subscribe({
        next: (res: IApplicantsByStageGlobal) => {
          console.log('Applicants by stage:', res);
          if(res) {
            this.applicants = res.applicants || [];
            this.stageName = res.stageName || '';
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  openCandidate(talentId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'candidate',
      id: talentId,
      payload: {
        photoUrl: this.applicants.find(a => a.talentId === talentId)?.photoUrl || '',
        name: this.applicants.find(a => a.talentId === talentId)?.talentName || ''
      }
    });
  }

  openPosition(positionId: string | any, event?: MouseEvent): void {
    if(!positionId) {
      return;
    }
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'position',
      id: positionId
    });
  }

  openPipeline(applicant: IApplicantsByStageItem, event?: MouseEvent): void {
    event?.stopPropagation();
    const positionId = applicant.positionId || this.positionId;

    if (!positionId) {
      return;
    }

    this.uiInteractionService.openDrawer({
      type: 'single-pipeline',
      id: positionId,
      payload: {
        talentId: applicant.talentId,
        positionId: positionId
      }
    });
  }
}
