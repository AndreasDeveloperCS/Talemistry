import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { STAGES_NAMES } from 'src/app/modules/position-pipelines/models/default-pipeline-stages';
import { StageCount } from '../../models/pipeline-board-types';
import { PIPELINES } from 'src/app/modules/position-pipelines/models/recruiting-pipeline';
import { normalizeStageName } from 'src/app/modules/position-pipelines/services/position-pipeline.service';

@Component({
  selector: 'app-pipeline-header',
  templateUrl: './pipeline-header.component.html',
  styleUrl: './pipeline-header.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineHeaderComponent implements OnInit, OnChanges {
  @Input() stageCounts: StageCount[] = [];
  @Input() selectedStage: STAGES_NAMES | null = null;
  @Input() totalApplicants: number = 0;
  @Output() stageSelected = new EventEmitter<STAGES_NAMES | null>();

  public stageIcons: Record<string, string> = {};

  private initStageIcons(): void {
    PIPELINES.forEach(p => {
      this.stageIcons[normalizeStageName(p.name)] = p.icon;
    });
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initStageIcons();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalApplicants']?.currentValue) {
      console.log('totalApplicants', changes['totalApplicants'].currentValue);
      this.totalApplicants = changes['totalApplicants'].currentValue;
      this.cdr.markForCheck();
    }
    if (changes['stageCounts']?.currentValue) {
      this.stageCounts = changes['stageCounts'].currentValue;
      this.cdr.markForCheck();
    }
  }

  public getStageIcon(stage: string): string {
    return this.stageIcons[stage] ?? 'help_outline';
  }

  onStageClick(stage: STAGES_NAMES): void {
    const clickedStage = normalizeStageName(stage);
    const currentStage = this.selectedStage ? normalizeStageName(this.selectedStage) : null;
    console.log('clickedStage', clickedStage, 'currentStage', currentStage);

    if (currentStage === clickedStage) {
      console.log('Deselecting stage');
      this.selectedStage = null;
      this.stageSelected.emit(null);
    } else {
      console.log('Selecting stage', clickedStage);
      this.selectedStage = stage;
      this.stageSelected.emit(stage); // you can emit normalized stage if needed
    }
  }

  clearFilter(): void {
    this.stageSelected.emit(null);
  }
}
