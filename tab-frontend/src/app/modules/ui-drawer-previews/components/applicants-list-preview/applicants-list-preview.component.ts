import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, take } from 'rxjs';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { ITalentPipelineProgressGroup } from 'src/app/modules/position-management/models/talent-pipeline-progress';
import { TalentPipelineProgressService } from 'src/app/modules/position-management/services/talent-pipeline-progress.service';
import { PositionPipelineService } from 'src/app/modules/position-pipelines/services/position-pipeline.service';

@Component({
  selector: 'app-applicants-list-preview',
  templateUrl: './applicants-list-preview.component.html',
  styleUrl: './applicants-list-preview.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplicantsListPreviewComponent implements OnInit {
  @Input()
  positionId!: string;

  @Input()
  position: any;

  groupedTalentProgress: ITalentPipelineProgressGroup[] = [];
  pipelineStages: any[] = [];
  isLoading: boolean = true;

  constructor(
    private pipelineService: PositionPipelineService,
    private talentPipelineProgressService: TalentPipelineProgressService,
    private uiInteractionService: UiInteractionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData(this.positionId);
  }

  private loadData(positionId: string): void {
    this.isLoading = true;

    forkJoin({
      pipeline: this.pipelineService.getPipelineByPositionId(positionId, true),
      progress: this.talentPipelineProgressService.getPipelineProgressByPositionId(positionId, true)
    })
      .pipe(take(1))
      .subscribe({
        next: ({ pipeline, progress }) => {
          this.pipelineStages = pipeline.stages.sort((a: { order: number; }, b: { order: number; }) => a.order - b.order);
          this.groupedTalentProgress = progress;
          console.log('groupedTalentProgress', this.groupedTalentProgress);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  getLastRecord(candidate: any): any {
    return candidate.records?.[candidate.records.length - 1];
  }

  getTopSkills(candidate: any): any[] {
    return candidate.skills ?.filter((x: any) => x.skillType === 'Hard') ?.slice(0, 8) || [];
  }

  openCandidate(candidate: any, event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'candidate',
      id: candidate.talentId,
      payload: {
        photoUrl: candidate.photoUrl,
        name: candidate.records?.[0]?.talentName
      }
    });
  }

  openSinglePipeline(candidate: any): void {
    this.uiInteractionService.openDrawer({
      type: 'single-pipeline',
      id: this.positionId,
      payload: {
        talentId: candidate.talentId,
        positionId: this.positionId
      }
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'passed':
        return 'status-success';
      case 'rejected':
        return 'status-danger';
      default:
        return 'status-pending';
    }
  }
}
