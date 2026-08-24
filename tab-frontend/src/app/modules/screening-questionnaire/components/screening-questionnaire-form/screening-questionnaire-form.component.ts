import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { ContentService } from 'src/app/modules/general/services/content.service';
import { PositionTag, QuestionCategory, ScreeningQuestionTemplate, SeniorityLevel } from '../../models/screening-question-templates';
import { QuestionType } from 'src/app/modules/position-management/models/screening-question';
import { duration } from 'moment';

@Component({
  selector: 'app-screening-questionnaire-form',
  templateUrl: './screening-questionnaire-form.component.html',
  styleUrl: './screening-questionnaire-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScreeningQuestionnaireFormComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();

  templateQuestionForm: FormGroup;
  controlButtonContent: string = "";
  isEdit: boolean = false;
  questionTypes = Object.values(QuestionType);
  questionCategories = Object.values(QuestionCategory);
  allPositionTags = Object.values(PositionTag);
  allSeniorityLevels = Object.values(SeniorityLevel);

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: ScreeningQuestionTemplate,
    public dialog: MatDialog, 
    public cdr: ChangeDetectorRef,
    public content: ContentService,
    public dialogRef: MatDialogRef<ScreeningQuestionnaireFormComponent>) {
      this.templateQuestionForm = this.fb.group({
        text: [data?.text || '', Validators.required],
        type: [data?.type || QuestionType.VideoResponse, Validators.required],
        positionTags: [data?.positionTags || []],
        durationInSeconds: [data?.durationInSeconds || 60, [Validators.min(10)]],
        seniorityLevels: [data?.seniorityLevels || []],
        category: [data?.category || QuestionCategory.Motivation, Validators.required],
        isVerified: [data?.isVerified]
      });
      if(!data) {
        this.templateQuestionForm.get('isVerified')?.setValue(true);
      }
      this.isEdit = this.data != undefined;
      this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
  }

  ngOnInit(): void {
    console.log('Question Template data:', this.data);
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  toggleQuestionTemplateVerified(): void {
    const current = this.templateQuestionForm.get('isVerified')?.value;
    this.templateQuestionForm.get('isVerified')?.setValue(!current);
    console.log('Toggling isVerified for templateQuestionForm:', this.templateQuestionForm.value);
  }  

  isQuestionTemplateVerified() {
    return this.templateQuestionForm.get('isVerified')?.value;
  }

  removePositionTag(tag: string) {
    console.log('Removing position tag:', tag);
    const current = this.templateQuestionForm.value.positionTags as string[];
    this.templateQuestionForm.patchValue({
      positionTags: current.filter(t => t !== tag)
    });
    this.cdr.markForCheck();
  }

  removeSeniorityLevel(level: string) {
    console.log('Removing seniority level:', level);
    const current = this.templateQuestionForm.value.seniorityLevels as string[];
    this.templateQuestionForm.patchValue({
      seniorityLevels: current.filter(l => l !== level)
    });
    this.cdr.markForCheck();
  }

  isVideoResponse(): boolean {
    return this.templateQuestionForm.get('type')?.value === QuestionType.VideoResponse;
  }

  save(): void {
    if (this.templateQuestionForm.valid) {
      const questionTemplate: ScreeningQuestionTemplate = {
        text: this.templateQuestionForm.value.text,
        type: this.templateQuestionForm.value.type,
        required: true,
        positionTags: this.templateQuestionForm.value.positionTags || [],
        seniorityLevels: this.templateQuestionForm.value.seniorityLevels || [],
        category: this.templateQuestionForm.value.category,
        isVerified: true,
        createdDate: new Date(),
      }
      this.dialogRef.close(questionTemplate);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
