import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Input, Pipe } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';
import { PositionPipelineService } from '../../services/position-pipeline.service';
import { PipelineStageService } from '../../services/pipeline-stage.service';
import { STAGES_NAMES } from '../../models/default-pipeline-stages';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { StageType } from '../../models/pipeline-stage';

@Component({
  selector: 'app-position-pipeline',
  templateUrl: './position-pipeline.component.html',
  styleUrl: './position-pipeline.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionPipelineComponent {
  @Input()
  positionId: any;

  positionPipelineId: any;
  pipelineStages: any[] = [];
  isEditMode = false;
  isDragging = false;
  isEditFormVisible: boolean = false;
  isCreateFormVisible = false;
  selectedStage: any;
  editStageForm: FormGroup;
  addStageForm: FormGroup;
  StageType = StageType;
  stageTypeOptions = Object.values(StageType);
  stageTypeLabels: Record<StageType, string> = {
    [StageType.CV_REVIEW]: 'CV Review',
    [StageType.SCREENING]: 'Screening',
    [StageType.ASSESSMENT]: 'Assessment',
    [StageType.INTERVIEW]: 'Interview',
    [StageType.OFFER]: 'Offer',
    [StageType.FINAL]: 'Final decision',
    [StageType.DEFAULT]: 'Other',
  };

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (event.cancelable) {
      event.preventDefault();
    }
  }

  constructor(public content: ContentService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private pipelineService: PositionPipelineService,
    private pipelineStageService: PipelineStageService) {
    this.editStageForm = fb.group({
      stageName: ['', [Validators.required]],
      stageType: ['', [Validators.required]],
      stageDescription: ['', [Validators.required]],
    });

    this.addStageForm = fb.group({
      stageName: ['', [Validators.required]],
      stageType: ['', [Validators.required]],
      stageDescription: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    console.log('Pipeline positionId:', this.positionId);
    if (this.positionId) {
      this.pipelineService.getPipelineByPositionId(this.positionId, true)
        .pipe(take(1)).subscribe({
          next: (data) => {
            console.log('Pipeline loaded:', data);
            this.pipelineStages = data.stages.sort((a: { order: number; }, b: { order: number; }) => a.order - b.order);
            this.positionPipelineId = data._id;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error loading pipeline', err);
            this.cdr.markForCheck();
          },
        });
    }
  }

  openEditStageForm(stage: any): void {
    this.isEditFormVisible = true;
    this.isCreateFormVisible = false;
    this.selectedStage = stage;

    this.editStageForm.patchValue({
      stageName: stage.name,
      stageType: stage.type,
      stageDescription: stage.description
    });
  }

  openCreateStageForm(): void {
    this.isCreateFormVisible = true;
    this.isEditFormVisible = false;
    this.selectedStage = null;

    this.addStageForm.reset();
  }

  closeEditStageForm() {
    this.isEditFormVisible = false;
    this.selectedStage = null;
    this.editStageForm.reset();
  }

  closeCreateStageForm() {
    this.isCreateFormVisible = false;
    this.addStageForm.reset();
  }

  openEditMode() {
    this.isEditMode = true;
  }

  closeEditMode() {
    this.isEditMode = false;
    this.isEditFormVisible = false;
  }

  isFixed(stage: any): boolean {
    return false;
    //stage.name === STAGES_NAMES.SOURCED || stage.name === STAGES_NAMES.APPLIED;
  }

  saveEditStage(): void {
    if (!this.editStageForm.valid || !this.selectedStage) return;

    const updatedStage = {
        ...this.selectedStage,
        name: this.editStageForm.value.stageName,
        type: this.editStageForm.value.stageType,
        description: this.editStageForm.value.stageDescription
    };
    console.log('Updated stage:', updatedStage, updatedStage._id);

    this.pipelineStageService.updateAsync(updatedStage, true)
      .pipe(take(1)).subscribe({
        next: (res) => {
          console.log('Stage updated:', res);

          const index = this.pipelineStages.findIndex(s => s._id === updatedStage._id);
          console.log('Updating stage at index:', index);

          if (index !== -1) {
            this.pipelineStages[index] = updatedStage;
          }
          console.log('Updated pipeline:', this.pipelineStages);
          this.dialog.open(NotificationWindowComponent, {
            data: { message: "Pipeline has been created!" }
          });
          this.closeEditStageForm();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to update stage', err);
          this.dialog.open(WarningsErrorsDialogComponent, {
            data: { message: "Error while updating the stage!" }
          });
          this.cdr.markForCheck();
        }
    });
  }

  addStage() {
    if (this.addStageForm.invalid) return;

    const currentMaxOrder = this.pipelineStages.length
      ? Math.max(...this.pipelineStages.map(s => s.order))
      : 0;

    console.log('Current max order:', currentMaxOrder);

    const newStage = {
      name: this.addStageForm.value.stageName,
      description: this.addStageForm.value.stageDescription,
      icon: 'miscellaneous_services',
      order: currentMaxOrder + 1,
      type: this.addStageForm.value.stageType,
      positionPipelineId: this.positionPipelineId,
      positionId: this.positionId
    };

    console.log('Creating new stage:', newStage);

    this.pipelineStageService.createAsync(newStage, true, false)
      .pipe(take(1))
      .subscribe({
        next: (createdStage) => {
          this.pipelineStages.push(createdStage);
          this.addStageForm.reset();
          this.dialog.open(NotificationWindowComponent, {
            data: { message: "Stage has been created!" }
          });
          this.closeCreateStageForm();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to create stage:', err);
          this.dialog.open(WarningsErrorsDialogComponent, {
            data: { message: "Error while creating the stage!" }
          });
          this.cdr.markForCheck();
        }
      });
  }

  deleteStage(stageId: any): void {
    console.log('Delete stage with ID:', stageId);

    this.pipelineStageService.deleteAsync(stageId, true)
      .pipe(take(1))
      .subscribe({
        next: (createdStage) => {
          console.log('Stage deleted:', createdStage);
          this.pipelineStages = this.pipelineStages.filter(s => s._id !== stageId);

          this.pipelineStages = this.pipelineStages
            .sort((a, b) => a.order - b.order)
            .map((stage, index) => ({
              ...stage,
              order: index
            }));

          console.log('Updated pipelineStages after deletion:', this.pipelineStages);
          this.addStageForm.reset();
          this.editStageForm.reset();
          this.dialog.open(NotificationWindowComponent, {
            data: { message: "Stage has been deleted!" }
          });
          this.closeCreateStageForm();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to delete stage:', err);
          this.dialog.open(WarningsErrorsDialogComponent, {
            data: { message: "Error while deleting the stage!" }
          });
          this.cdr.markForCheck();
        }
      });
  }

  drop(event: CdkDragDrop<any[]>) {
    if (!event || event.previousIndex === event.currentIndex) return;

    const previous = event.previousIndex;
    const current = event.currentIndex;

    if (this.isFixed(this.pipelineStages[previous]) || this.isFixed(this.pipelineStages[current])) {
      return;
    }

    moveItemInArray(this.pipelineStages, previous, current);

    this.pipelineStages.forEach((stage, index) => {
      stage.order = index + 1;
    });

    const orderedStageIds = this.pipelineStages.map(stage => stage._id);
    this.savePipelineStagesOrder(orderedStageIds);

    this.isDragging = false;
  }

  savePipelineStagesOrder(orderedStageIds: string[]) {
    if(!this.positionPipelineId) return;

    this.pipelineService.updateStagesOrder(this.positionPipelineId, orderedStageIds)
      .subscribe({
        next: () => {
          console.log('Pipeline stages order updated successfully');
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to update pipeline stages order', err);
          this.dialog.open(WarningsErrorsDialogComponent, {
            data: { message: "Failed to update pipeline stages order!" }
          });
          this.cdr.markForCheck();
        }
      });
  }

  onDragStart() {
    this.isDragging = true;
  }

  onDragEnd() {
    this.isDragging = false;
  }
}
