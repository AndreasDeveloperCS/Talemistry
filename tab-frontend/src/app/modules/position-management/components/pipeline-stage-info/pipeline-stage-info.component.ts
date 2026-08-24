import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { take } from 'rxjs';
import { DialogHelperService } from 'src/app/modules/general/services/dialog-helper.service';
import { ScreeningResponse } from '../../models/screening-response';
import { RejectionReason, StageStatus, TalentPipelineProgress } from '../../models/talent-pipeline-progress';
import { ScreeningResponsesService } from '../../services/screening-responses.service';
import { InterviewAssessmentComponent } from '../interview-assessment/interview-assessment.component';
import { ScreeningResponseViewComponent } from '../screening-response-view/screening-response-view.component';
import { STAGES_NAMES } from 'src/app/modules/position-pipelines/models/default-pipeline-stages';

@Component({
  selector: 'app-pipeline-stage-info',
  templateUrl: './pipeline-stage-info.component.html',
  styleUrl: './pipeline-stage-info.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineStageInfoComponent implements OnInit {
  stageStatuses = Object.values(StageStatus);
  rejectionReasons = Object.values(RejectionReason);
  isScreeningFormFilled: boolean = false;
  isLoading: boolean = true;
  screeningResponse!: ScreeningResponse;

  constructor(
    public dialogRef: MatDialogRef<PipelineStageInfoComponent>,
    @Inject(MAT_DIALOG_DATA)
    public stageProgress: TalentPipelineProgress,
    private cdr: ChangeDetectorRef,
    private screeningResponsesService: ScreeningResponsesService,
    private dialogHelper: DialogHelperService,
  ) { 
    console.log('PipelineStageInfoComponent', this.stageProgress);
  }

  ngOnInit(): void {
    if(this.stageProgress.stageName === STAGES_NAMES.SCREENING) {
      this.getTalentScreeningForm();
    } else {
      this.isLoading = false;
    }
  }

  getTalentScreeningForm() {
    this.screeningResponsesService
      .getByPositionIdTalentIdAsync(this.stageProgress.positionId, this.stageProgress.talentId, true)
      .pipe(take(1))
      .subscribe({
        next: (res: ScreeningResponse) => {
          console.log('Screening response', res);
          if(res) {
            this.screeningResponse = res;
            this.isScreeningFormFilled = true;
            this.isLoading = false;
            this.cdr.markForCheck();
          } else {
            this.isScreeningFormFilled = false;
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error receiving screening response data', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onStatusChange(): void {
    if (this.stageProgress.status !== StageStatus.failed) {
      this.stageProgress.finalRejectionReason = undefined;
    }
  }

  onSave(): void {
    console.log('this.stageProgress', this.stageProgress);
    this.dialogRef.close(this.stageProgress);
  }

  viewScreeningResponse() {
    this.dialogHelper.openDialog(ScreeningResponseViewComponent, () => {
      this.cdr.markForCheck();
    }, 
      { panelClass: "panel-class-dialog", data: this.screeningResponse }
    );
  }

  viewInterviewResponse() {
    this.dialogHelper.openDialog(InterviewAssessmentComponent, () => {},);
  }
  
  onCancel() {
    this.dialogRef.close();
  }
}
