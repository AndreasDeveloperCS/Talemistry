import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { Filtering, Sorting } from 'src/app/modules/general/services/search-logic.service';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { EnrichedAppliedPositionsProgress } from 'src/app/modules/position-management/models/talent-pipeline-progress';
import { TalentPipelineProgressService } from 'src/app/modules/position-management/services/talent-pipeline-progress.service';
import { StageType } from 'src/app/modules/position-pipelines/models/pipeline-stage';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-applied-positions-preview',
  templateUrl: './applied-positions-preview.component.html',
  styleUrl: './applied-positions-preview.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppliedPositionsPreviewComponent implements OnInit {
  @Input()
  initialStageType: StageType | null = null;

  selectedStageType: StageType | null = null;
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  appliedPositions: EnrichedAppliedPositionsProgress[] = [];
  isLoading: boolean = true;
  pageSize = 20;
  pageIndex = 0;
  sorting: Sorting = { property: 'createdDate', direction: 'DESC' };
  filtering: Filtering = [];

  readonly stageFilters = [
    {
      label: 'All',
      value: null
    },
    {
      label: 'Applied',
      value: StageType.CV_REVIEW
    },
    {
      label: 'Screening',
      value: StageType.SCREENING
    },
    {
      label: 'Assessment',
      value: StageType.ASSESSMENT
    },
    {
      label: 'Interview',
      value: StageType.INTERVIEW
    },
    {
      label: 'Offer',
      value: StageType.OFFER
    }
  ];

  get currentTitle(): string {
    if (!this.selectedStageType) {
      return 'Applied Positions';
    }

    switch (this.selectedStageType) {
      case StageType.CV_REVIEW:
        return 'Applied Stage';
      case StageType.SCREENING:
        return 'Screening Stage';
      case StageType.ASSESSMENT:
        return 'Assessment Stage';
      case StageType.INTERVIEW:
        return 'Interview Stage';
      case StageType.OFFER:
        return 'Offer Stage';
      default:
        return 'Applied Positions';
    }
  }

  constructor(
    private talentPipelineProgressService: TalentPipelineProgressService,
    private uiInteractionService: UiInteractionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.selectedStageType = this.initialStageType;
    this.loadData();
  }

  loadData(): void {
    if (!this.userId) {
      return;
    }

    this.isLoading = true;
    const request$ = this.selectedStageType
      ? this.talentPipelineProgressService.getAppliedPositionsReachedStage(
          this.selectedStageType, this.pageSize, this.pageIndex, this.sorting, this.filtering, true)
      : this.talentPipelineProgressService.getAppliedPositionsByTalentId(
          this.userId, this.pageSize, this.pageIndex, this.sorting, this.filtering, true, false);

    request$
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.appliedPositions = res?.items || [];
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

  selectStage(stage: StageType | null): void {
    this.selectedStageType = stage;
    this.pageIndex = 0;
    this.loadData();
  }

  openPosition(positionId: string, event: Event): void {
    event.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'position',
      id: positionId
    });
  }

  openDetails(application: any, event: Event): void {
    event.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'applied-position-details',
      id: '',
      payload: {
        application: application
      }
    });
  }

  getStageClass(status: string): string {
    switch (status) {
      case 'passed':
        return 'passed';
      case 'failed':
        return 'failed';
      case 'pending':
        return 'pending';
      default:
        return 'default';
    }
  }
}
