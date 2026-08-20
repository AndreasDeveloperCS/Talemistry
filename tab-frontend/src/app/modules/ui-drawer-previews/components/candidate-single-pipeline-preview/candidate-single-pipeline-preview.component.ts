import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { ITalentPipelineProgressGroup } from 'src/app/modules/position-management/models/talent-pipeline-progress';
import { TalentPipelineProgressService } from 'src/app/modules/position-management/services/talent-pipeline-progress.service';

@Component({
  selector: 'app-candidate-single-pipeline-preview',
  templateUrl: './candidate-single-pipeline-preview.component.html',
  styleUrl: './candidate-single-pipeline-preview.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateSinglePipelinePreviewComponent implements OnInit {

  @Input() 
  talentId!: string;

  @Input() 
  positionId!: string;

  isLoading = true;
  pipelineGroup!: ITalentPipelineProgressGroup;

  constructor(
    private talentPipelineProgressService: TalentPipelineProgressService,
    private cdr: ChangeDetectorRef,
    public uiInteractionService: UiInteractionService
  ) {}

  ngOnInit(): void {
    this.loadPipeline();
  }

  loadPipeline(): void {
    if(!this.talentId || !this.positionId) {
      console.warn('Talent ID and Position ID are required to load pipeline progress.');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    this.talentPipelineProgressService
      .getPipelineProgressByTalentIdPositionId(this.talentId, this.positionId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if(res) {
            this.pipelineGroup = res;
          }
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

  openCandidate(): void {
    this.uiInteractionService.openDrawer({
      type: 'candidate',
      id: this.talentId,
      payload: {
        photoUrl: this.pipelineGroup?.photoUrl,
        name: this.pipelineGroup?.records?.[0]?.talentName
      }
    });
  }

  openPosition(positionId: string): void {
    this.uiInteractionService.openDrawer({
      type: 'position',
      id: positionId
    });
  }

  openFullPipelineHistory(): void {
    this.uiInteractionService.openDrawer({
      type: 'multiple-pipeline',
      id: this.talentId,
      payload: {
        talentId: this.talentId
      }
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

  getTopSkills(limit: number = 8): any[] {
    return this.pipelineGroup?.skills ?.slice(0, limit) || [];
  }
}
