import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { STAGES_NAMES } from 'src/app/modules/position-pipelines/models/default-pipeline-stages';
import { Feedback, StageCount } from '../../models/pipeline-board-types';
import { DataService } from '../../services/pipeline-board.service';
import { OpenPosition } from 'src/app/modules/positions/models/position';
import { Applicant, ApplicantStage } from 'src/app/modules/position-management/models/applicant-info';
import { StageStatus } from 'src/app/modules/position-management/models/talent-pipeline-progress';

@Component({
  selector: 'app-pipeline-board',
  templateUrl: './pipeline-board.component.html',
  styleUrl: './pipeline-board.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineBoardComponent implements OnInit {
  positions: OpenPosition[] = [];
  applicants: Applicant[] = [];
  stageCounts: StageCount[] = [];

  selectedPosition: OpenPosition | null = null;
  selectedApplicant: Applicant | null = null;
  selectedInterview: ApplicantStage | null = null;
  selectedStage: STAGES_NAMES | null = null;
  currentFeedback: Feedback | null = null;
  totalApplicants: number = 0;

  constructor(private dataService: DataService) {}

  ngOnInit(): void { }

  selectPosition(position: OpenPosition): void {
    console.log('selectPosition', position);
    this.selectedPosition = position;
    this.selectedApplicant = null;
    this.selectedInterview = null;
    this.selectedStage = null;
  }

  selectApplicant(applicant: Applicant): void {
    this.selectedApplicant = applicant;
    this.selectedInterview = null;
  }

  selectInterview(interview: ApplicantStage): void {
    console.log('Select Interview', interview);
    this.selectedInterview = interview;
  }

  selectStage(stage: STAGES_NAMES | null): void {
    console.log('selectStage', stage);
    this.selectedStage = stage;
    this.selectedApplicant = null;
    this.selectedInterview = null;
  }

  onStageChange(event: { applicantId: string; stage: STAGES_NAMES }): void {
    this.dataService.updateApplicantStage(event.applicantId, event.stage);
  }

  onStageStatusChange(event: { stageId: string; status: string }): void {
    if (!this.selectedApplicant) {
      return;
    }

    this.selectedApplicant = {
      ...this.selectedApplicant,
      stages: this.selectedApplicant.stages.map(stage =>
        stage._id === event.stageId
          ? { ...stage, finalDecision: event.status as StageStatus }
          : stage
      )
    };

    console.log('UPDATED APPLICANT', this.selectedApplicant);
  }

  onApplicantsCountChange(event: number) {
    console.log('onApplicantsCountChange', event);
    this.totalApplicants = event;
  }

  onStageCountsChanged(event: any) {
    console.log('onStageCountsChanged', event);
    this.stageCounts = event;
  }
}