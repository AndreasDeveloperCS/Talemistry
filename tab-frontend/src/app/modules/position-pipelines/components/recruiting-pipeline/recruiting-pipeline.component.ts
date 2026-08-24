import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContentService } from '../../../general/services/content.service';
import { PIPELINES } from '../../models/recruiting-pipeline';
import { PositionPipelineService } from '../../services/position-pipeline.service';

@Component({
  selector: 'app-recruiting-pipeline',
  templateUrl: './recruiting-pipeline.component.html',
  styleUrl: './recruiting-pipeline.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitingPipelineComponent {
  pipeline = [...PIPELINES];
  isEditMode = false; 
  isDragging = false;
  isEditFormVisible: boolean = false; 
  selectedStage: any;
  editStageForm: FormGroup;
  pipelineStages: string[] = PIPELINES.map(pipeline => pipeline.name);

  constructor(public content: ContentService, 
    private fb: FormBuilder,
    private pipelineService: PositionPipelineService) {
    this.editStageForm = fb.group({
      stageName: ['', [Validators.required]],
      stageType: [this.selectedStage?.name, [Validators.required]]
    });
  }

  openEditStageForm(stage: any): void {
    this.isEditFormVisible = true;
    this.selectedStage = stage;
  }

  closeEditStageForm() {
    this.isEditFormVisible = false;
    this.selectedStage = null;
  }

  openEditMode() {
    this.isEditMode = true;
  }

  closeEditMode() {
    this.isEditMode = false;
    this.isEditFormVisible = false;
  }

  isFixed(stage: any): boolean {
    return stage.name === 'Sourced' || stage.name === 'Applied';
  }

  deleteStage(stageId: string): void {
    
  }

  drop(event: CdkDragDrop<any[]>) {
    if (!event || event.previousIndex === event.currentIndex) return;
  
    const previous = event.previousIndex;
    const current = event.currentIndex;

    if (this.isFixed(this.pipeline[previous]) || this.isFixed(this.pipeline[current])) {
      return;
    }
  
    moveItemInArray(this.pipeline, previous, current);
    this.isDragging = false;
  }

  onDragStart() {
    this.isDragging = true;
  }

  onDragEnd() {
    this.isDragging = false; 
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (event.cancelable) {
      event.preventDefault(); 
    }
  }
}
