import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { ITalentPipelineProgressGroup } from 'src/app/modules/position-management/models/talent-pipeline-progress';
import { TalentPipelineProgressService } from 'src/app/modules/position-management/services/talent-pipeline-progress.service';

@Component({
  selector: 'app-candidate-multiple-pipeline-preview',
  templateUrl: './candidate-multiple-pipeline-preview.component.html',
  styleUrl: './candidate-multiple-pipeline-preview.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateMultiplePipelinePreviewComponent implements OnInit {
  @Input() 
  talentId!: string;

  isLoading = true;
  pipelineGroup: ITalentPipelineProgressGroup[] = [];

  constructor(
    private talentPipelineProgressService: TalentPipelineProgressService,
    private cdr: ChangeDetectorRef,
    public uiInteractionService: UiInteractionService
  ) {}

  ngOnInit(): void {
    this.loadPipelines();
  }

  loadPipelines(): void {
    this.isLoading = true;
    if(!this.talentId) {
      console.error('Talent ID is required to load pipelines');
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }
    this.talentPipelineProgressService
      .getPipelineProgressByTalentId(this.talentId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.pipelineGroup = res;
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

  openSinglePipeline(progress: ITalentPipelineProgressGroup): void {
    this.uiInteractionService.openDrawer({
      type: 'single-pipeline',
      id: progress.records[0]?.positionId,
      payload: {
        talentId: this.talentId,
        positionId: progress.records[0]?.positionId
      }
    });
  }

  openCandidate(): void {
    this.uiInteractionService.openDrawer({
      type: 'candidate',
      id: this.talentId
    });
  }

  openPosition(positionId: string): void {
    this.uiInteractionService.openDrawer({
      type: 'position',
      id: positionId
    });
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'approved':
      case 'passed':
      case 'hired':
        return 'success';
      case 'rejected':
      case 'failed':
        return 'danger';
      default:
        return 'pending';
    }
  }

  getUniquePositions(): any[] {
    if (!this.pipelineGroup?.length) {
      return [];
    }
    const uniqueMap = new Map();
    this.pipelineGroup.forEach(group => {
      if (!uniqueMap.has(group.records[0]?.positionId)) {
        uniqueMap.set(group.records[0]?.positionId, group);
      }
    });
    console.log('Unique positions from pipelines', Array.from(uniqueMap.values()));
    return Array.from(uniqueMap.values());
  }
}
