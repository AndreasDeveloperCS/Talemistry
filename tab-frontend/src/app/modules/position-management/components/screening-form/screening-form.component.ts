import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { environment } from 'src/environments/environment';
import { QuestionOption, QuestionType, ScreeningQuestion } from '../../models/screening-question';
import { ScreeningResponse, ScreeningSingleAnswer } from '../../models/screening-response';
import { ScreeningQuestionsService } from '../../services/screening-questions.service';
import { ScreeningResponsesService } from '../../services/screening-responses.service';
import { ScreeningForm } from '../../models/screening-form';
import { ScreeningFormsService } from '../../services/screening-forms.service';

@Component({
  selector: 'app-screening-form',
  templateUrl: './screening-form.component.html',
  styleUrl: './screening-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScreeningFormComponent {
  submitted = false;
  answers: ScreeningSingleAnswer[] = [];
  screeningResponse!: ScreeningResponse;
  errorMessage = "";
  isFormAlreadySend: boolean = false;
  isLoading: boolean = false;
  formId: any;
  positionId: any;
  questions: ScreeningQuestion[] = [];
  userId: string = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  videoResponseTxt: string = 'Please record a video answer to the question.';
  isOwnerViewing: boolean = false;

  get isFormValid(): boolean {
    return this.questions.every(q => {
      if (!q.required) {
        return true;
      }

      const answer = this.answers.find(a => a.questionId === q._id);
      if (!answer) {
        return false;
      }

      if (q.type === 'videoresponse') {
        return !!answer.value?.videoKey;
      }

      if (Array.isArray(answer.value)) {
        return answer.value.length > 0;
      }

      return !!answer.value && String(answer.value).trim() !== '';
    });
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private screeningFormService: ScreeningFormsService,
    private screeningResponsesService: ScreeningResponsesService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    @Optional() public dialogRef: MatDialogRef<ScreeningFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    //this.deleteScreeningResponse('68fc95cf74312ac7c51c51f3');
    if (this.positionId || (this.data && this.data.positionId)) {
      this.isLoading = false;
      this.positionId = this.data.positionId || this.positionId;
      this.checkIsFormFilled();
      return;
    }
    this.activatedRoute.paramMap
      .pipe(take(1))
      .subscribe(params => {
        this.positionId = params.get('positionId') || '';
        console.log('Current position ID:', this.positionId);
        if (!this.positionId) {
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }
        this.checkIsFormFilled();
      });
  }

  getScreeningFormInfo() {
    this.screeningFormService
      .getFormByPositionId(this.positionId, true)
      .pipe(take(1))
      .subscribe({
        next: (res: ScreeningForm) => {
          console.log('Screening form', res);
          if(res) {
            this.formId = res._id;
            if(res.userId === this.userId) {
              this.isOwnerViewing = true;
            }
            this.questions = (res.questions || []).sort((a, b) => a.order - b.order);
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error receiving questions data', err);
          this.cdr.markForCheck();
        },
      });
    window.scrollTo(0, 0);
  }

  checkIsFormFilled() {
    // this.screeningResponsesService
    // .getByTalentIdAsync(this.userId, true)
    // .pipe(take(1))
    // .subscribe({
    //   next: (res: any) => {
    //     console.log('Screening response BY TALENT ID', res);
    //   },
    //   error: (err) => {
    //     console.error('Error receiving screening response data', err);
    //     this.cdr.markForCheck();
    //   },
    // });

    this.screeningResponsesService
      .getByPositionIdTalentIdAsync(this.positionId, this.userId, true)
      .pipe(take(1))
      .subscribe({
        next: (res: ScreeningResponse) => {
          console.log('Screening response', res);
          if(res) {
            this.isLoading = false;
            this.isFormAlreadySend = true;
            this.cdr.markForCheck();
          } else {
            this.getScreeningFormInfo();
          }
        },
        error: (err) => {
          console.error('Error receiving screening response data', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
    window.scrollTo(0, 0);
  }

  onSubmit(): void {
    console.log('onSubmit', this.answers);

    if (!this.isFormValid) {
      this.dialog.open(WarningsErrorsDialogComponent, {
        data: { message: 'Please answer all required questions.' }
      });
      return;
    }

    this.sendScreeningResponse();
  }

  sendScreeningResponse() {
    console.log('sendScreeningResponse');
    this.screeningResponse = {
      formId: this.formId,
      positionId: this.positionId,
      talentId: this.userId,
      userId: this.userId,
      answers: this.answers,
      createdBy: this.userId,
      createdDate: new Date(),
    };
    console.log('Prepared screeningResponse', this.screeningResponse);
    
    this.screeningResponsesService.createAsync(this.screeningResponse, true, false)
      .pipe(take(1)).subscribe({
        next: (res: ScreeningResponse) => {
          if(res) {
            console.log('Screening response', res);
            this.screeningResponse = res;
            this.submitted = true;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error creating data', err);
          this.dialog.open(WarningsErrorsDialogComponent, {
            data: { message: "Error creating screening form!" }
          });
          this.cdr.markForCheck();
        },
      });
  }

  private findAnswer(questionId: any): ScreeningSingleAnswer | undefined {
    return this.answers.find(a => a.questionId === questionId);
  }

  updateAnswer(questionId: any, value: any): void {
    console.log('updateAnswer', value);
    const question = this.questions.find(q => q._id === questionId);
    if (!question) return;

    let existing = this.findAnswer(questionId);
    const rawValue = typeof value === 'string' ? value : value.text;
    if (existing) {
      existing.value = rawValue;
    } else {
      this.answers.push({
        questionId,
        questionText: question.text,
        questionType: question.type,
        value: rawValue
      });
    }
  }

  toggleMultiselect(questionId: any, option: QuestionOption): void {
    const question = this.questions.find(q => q._id === questionId);
    if (!question) return;

    let answer = this.findAnswer(questionId);
    if (!answer) {
      answer = {
        questionId,
        questionText: question.text,
        questionType: question.type,
        value: []
      };
      this.answers.push(answer);
    }

    const current = answer.value || [];
    const exists = current.some((o: QuestionOption) => o.text === option.text);
    answer.value = exists
      ? current.filter((o: QuestionOption) => o.text !== option.text)
      : [...current, option];
  }

  isMultiselectChecked(questionId: any, option: QuestionOption): boolean {
    const answer = this.findAnswer(questionId);
    if (!answer || !Array.isArray(answer.value)) return false;
    return (answer.value as QuestionOption[]).some(o => o.text === option.text);
  }

  getAnswer(id: string): any {
    const answer = this.answers.find(a => a.questionId === id);
    return answer ? answer.value : null;
  }

  onVideoRecorded(
    questionId: string,
    questionText: string,
    event: { videoKey: string; duration: number }
  ) {
    console.log('onVideoRecorded', questionId, event);
    const existingAnswer = this.answers.find(a => a.questionId === questionId);

    if (existingAnswer) {
      existingAnswer.value = {
        videoKey: event.videoKey,
        duration: event.duration
      };
    } else {
      this.answers.push({
        questionId,
        questionText,
        questionType: QuestionType.VideoResponse,
        value: {
          videoKey: event.videoKey,
          duration: event.duration
        }
      });
    }
    console.log('Updated answers:', this.answers);

    this.cdr.markForCheck();
  }

  deleteScreeningResponse(id: string) {
    this.screeningResponsesService
      .deleteAsync(id, true, false)
      .pipe(take(1))
      .subscribe({
        next: (deleted) => {
          console.log('Screening response deleted', deleted);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting screening response', err);
          this.cdr.markForCheck();
        },
    });
  }
}
