import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { StageType } from 'src/app/modules/position-pipelines/models/pipeline-stage';
import { PositionsService } from 'src/app/modules/positions/services/positions.service';
import { PipelineHealthBottleneck, PipelineHealthKpi, PipelineHealthPosition, PipelineHealthStage, PipelineHealthStats } from '../../models/pipeline-health-stats';

@Component({
  selector: 'app-pipeline-health-preview',
  templateUrl: './pipeline-health-preview.component.html',
  styleUrl: './pipeline-health-preview.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineHealthPreviewComponent implements OnInit {
  loading = false;
  funnel: PipelineHealthStage[] = [];
  kpis: PipelineHealthKpi[] = [];
  bottlenecks: PipelineHealthBottleneck[] = [];
  topPositions: PipelineHealthPosition[] = [];
  insights: string[] = [];

  constructor(
    private positionsService: PositionsService,
    private cdr: ChangeDetectorRef,
    private uiInteractionService: UiInteractionService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.positionsService.getPipelineHealthStats().pipe(take(1))
      .subscribe({
        next: (res: PipelineHealthStats) => {
          if(res) {
            this.funnel = res.funnel || [];
            this.kpis = res.kpis || [];
            this.bottlenecks = res.bottlenecks || [];
            this.topPositions = res.topPositions || [];
            this.insights = res.insights || [];
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

  getMaxCount(): number {
    return Math.max(...this.funnel.map(x => x.count), 1);
  }

  getWidth(count: number): number {
    return (count / this.getMaxCount()) * 100;
  }

  openPosition(positionId: string): void {
    this.uiInteractionService.openDrawer({
      type: 'position',
      id: positionId,
    });
  }

  openApplicantsByStage(stage: StageType | string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'applicants-by-stage',
      id: stage,
      payload: {
        stageType: stage as StageType,
      }
    });
  }
}