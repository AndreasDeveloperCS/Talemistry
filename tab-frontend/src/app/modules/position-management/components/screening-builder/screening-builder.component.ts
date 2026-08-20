import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, forkJoin, Observable, of, take, tap } from 'rxjs';
import { ScreeningQuestionTemplate } from 'src/app/modules/screening-questionnaire/models/screening-question-templates';
import { ScreeningQuestionTemplatesService } from 'src/app/modules/screening-questionnaire/services/screening-question-templates.service';
import { environment } from '../../../../../environments/environment';
import { WarningsErrorsDialogComponent } from '../../../general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { NotificationWindowComponent } from '../../../general/dialogs/notification-window/notification-window.component';
import { TEMPLATE_QUESTIONS } from '../../constants/screening-template-questions';
import { IScreeningForm, ScreeningForm } from '../../models/screening-form';
import { QuestionType, ScreeningQuestion } from '../../models/screening-question';
import { ScreeningFormsService } from '../../services/screening-forms.service';
import { PositionsService } from 'src/app/modules/positions/services/positions.service';
import { OpenPosition } from 'src/app/modules/positions/models/position';

@Component({
  selector: 'app-screening-builder',
  templateUrl: './screening-builder.component.html',
  styleUrl: './screening-builder.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScreeningBuilderComponent implements OnInit {
  @Input() 
  positionId?: string;

  @Input()
  positionTitle?: string;
  
  readonly MIN_VIDEO_DURATION = 10;
  readonly questionsLimitDefault: number = 10;
  private initialized = false;
  isOwner: boolean = false;
  screeningForm!: ScreeningForm;
  questions: ScreeningQuestion[] = [];
  templateQuestions!: ScreeningQuestion[];
  draggedIndex: number | null = null;
  userId: string = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  isLoading: boolean = false;
  screeningFormId: string = '';
  QuestionType = QuestionType;

  questionTypeOptions = [
    { value: QuestionType.Text, label: 'Short Text' },
    { value: QuestionType.Textarea, label: 'Long Text' },
    { value: QuestionType.Select, label: 'Single Choice' },
    { value: QuestionType.Multiselect, label: 'Multiple Choice' },
    { value: QuestionType.VideoResponse, label: 'Video Response' }
  ];

  constructor(private router: Router,
    private activatedRoute: ActivatedRoute,
    private screeningFormsService: ScreeningFormsService,
    private positionService: PositionsService,
    private screeningQuestionTemplatesService: ScreeningQuestionTemplatesService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,

    @Optional() public dialogRef: MatDialogRef<ScreeningBuilderComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    console.log('ScreeningBuilderComponent initialized with data:', this.data);
    this.deleteScreeningForm('69f78250f5407c684149d801');
    if (this?.positionId || (this?.data && this.data?.positionId)) {
      this.positionId = this.data?.positionId || this?.positionId;
      if(this?.positionTitle || (this.data && this.data?.positionTitle)) {
        this.positionTitle = this.data?.positionTitle || this?.positionTitle;
      }
      console.log('Position ID for screening builder:', this.positionId, 'Position Title:', this.positionTitle);
      this.initializeData();
      return;
    }

    this.activatedRoute.paramMap.pipe(take(1)).subscribe(params => {
      this.positionId = params.get('positionId') || '';
      console.log('activatedRoute.paramMap', this.positionId);

      if (!this.positionId) {
        return;
      }

      this.fetchPositionTitleAndInit();
    });
  }

  ngOnChanges(): void {
    if (this.initialized) {
      return;
    }

    if (this.positionId) {
      this.initializeData();
    }
  }

  private fetchPositionTitleAndInit(): void {
    this.positionService.getByIdAsync(this.positionId!, true)
      .pipe(take(1))
      .subscribe({
        next: (position: OpenPosition) => {
          console.log('Position title:', position.title);
          this.positionTitle = position.title;
          if(position.createdBy === this.userId) {
            this.isOwner = true;
            this.initializeData();
            this.isLoading = false;
            this.cdr.markForCheck();
          } else {
            this.isOwner = false;
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error loading position', err)
        }
      });
  }

  private initializeData(): void {
    console.log('Initializing screening builder with position ID:', this.positionId);
    if (!this.positionId) {
      return;
    }

    this.initialized = true;
    this.loadData();
  }

  loadData():void {
    console.log('Loading screening form and recommended questions for position ID:', this.positionId);
    this.isLoading = true;

    forkJoin([
      this.getFormByPositionId$(),
      this.getRecommendedQuestions$(),
    ]).pipe(take(1)).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading screening data', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getRecommendedQuestions$(): Observable<any> {
  if (!this.positionTitle) {
    return of(TEMPLATE_QUESTIONS);
  }

  return this.screeningQuestionTemplatesService
    .getRecommendedQuestions(this.positionTitle, true)
    .pipe(
      take(1),
      tap((res) => {
        console.log('Recommended questions', res);

        if (res.length > 0) {
          this.templateQuestions = res.map((t: ScreeningQuestionTemplate) => ({
            text: t.text,
            type: t.type as QuestionType,
            required: t.required ?? true,
            durationInSeconds:
              t.durationInSeconds ??
              (t.type === QuestionType.VideoResponse ? 60 : undefined),
            options:
              t.type === QuestionType.Select ||
              t.type === QuestionType.Multiselect
                ? []
                : undefined,
            order: 0,
            userId: '',
            createdBy: '',
            createdDate: new Date(),
          }));
        } else {
          this.templateQuestions = TEMPLATE_QUESTIONS;
        }
      })
    );
  }

  getFormByPositionId$(): Observable<any> {
    if (!this.positionId) {
      return of(void 0);
    }

    return this.screeningFormsService
      .getFormByPositionId(this.positionId, true)
      .pipe(
        take(1),
        tap((res: IScreeningForm) => {
          console.log('Screening form', res);

          if (res) {
            this.screeningForm = res;
            this.screeningFormId = res._id;

            if (res.questions) {
              this.questions = [...res.questions].sort(
                (a, b) => a.order - b.order
              );
            }
          }
          this.isOwner = true;
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
        catchError((err) => {
          if (err.status === 403) {
            this.isOwner = false;
            this.isLoading = false;
            this.cdr.markForCheck();
          }
          return EMPTY;
        })
      );
  }

  addTemplateQuestion(template: ScreeningQuestion): void {
    const newQuestion: ScreeningQuestion = {
      ...template,
      order: this.questions.length,
    };
    this.questions.push(newQuestion);
  }

  addCustomQuestion(): void {
    const newQuestion: ScreeningQuestion = {
      text: "",
      type: QuestionType.VideoResponse,
      required: false,
      order: this.questions.length,
      durationInSeconds: 60,
      userId: '',
      createdBy: '',
      createdDate: new Date(),
    };
    this.questions.push(newQuestion)
  }

  removeQuestion(id: string): void {
    this.questions = this.questions.filter((q) => q._id !== id);
  }

  onDragStart(index: number): void {
    this.draggedIndex = index;
  }

  onDragEnd(): void {
    setTimeout(() => {
      this.draggedIndex = null;
      this.updateQuestionOrder(); 
      this.cdr.markForCheck();
    }, 0);
    console.log('onDragEnd', this.questions);
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === index) {
      return;
    }

    const draggedItem = this.questions[this.draggedIndex];
    this.questions.splice(this.draggedIndex, 1);
    this.questions.splice(index, 0, draggedItem);
    this.draggedIndex = index;
  }

  updateQuestionOrder(): void {
    this.questions = this.questions.map((q, idx) => ({
      ...q,
      order: idx
    }));
    console.log('updateQuestionOrder', this.questions);
  }

  saveScreening(): void {
    console.log('saveScreening', this.questions, this.positionId);

    if(this.screeningForm?._id) {
      this.updateScreeningForm(this.screeningForm);
    } else {
      const screeningForm: IScreeningForm = {
        positionId: this.positionId,
        userId: this.userId,
        createdBy: this.userId,
        createdDate: new Date(),
        questions: this.questions
      };
      this.createScreeningForm(screeningForm);
    }
  }

  deleteScreeningForm(id: any) {
    this.screeningFormsService.deleteAsync(id, true, false)
      .pipe(take(1)).subscribe({
        next: (res) => {
          if(res) {
            console.log('Deleted form', res);
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error deleting form', err);
          this.cdr.markForCheck();
        },
      });
  }

  createScreeningForm(screeningForm: IScreeningForm) {
    console.log('createScreeningForm');

    this.screeningFormsService.createAsync(screeningForm, true, false)
    .pipe(take(1)).subscribe({
      next: (res) => {
        if(res) {
          console.log('Screening form', res);
          this.screeningForm = res;
          if(res.questions) {
            this.questions = res.questions;
          }
          if(this.dialogRef) {
            const notificationRef = this.dialog.open(NotificationWindowComponent, {
              data: { message: "Screening form has been updated!" }
            });

            setTimeout(() => {
              notificationRef.close();
            }, 3000);

            notificationRef.afterClosed().pipe(take(1)).subscribe(() => {
              this.closeDialog(this.screeningForm);
            });
          } else {
            const notificationRef = this.dialog.open(NotificationWindowComponent, {
              data: { message: "Screening form has been updated!" }
            });

            setTimeout(() => {
              notificationRef.close();
            }, 3000);
          }
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

  updateScreeningForm(screeningForm: ScreeningForm) {
    console.log('updateScreeningForm');

    this.questions = this.questions.map((q, index) => ({
      ...q,
      order: index + 1,
      formId: this.screeningForm?._id,
    }));

    screeningForm.questions = this.questions;

    this.screeningFormsService.updateAsync(screeningForm, true, false)
      .pipe(take(1)).subscribe({
        next: (res) => {
          if(res) {
            console.log('Screening form', res);
            if(this.dialogRef) {
              const notificationRef = this.dialog.open(NotificationWindowComponent, {
                data: { message: "Screening form has been created!" }
              });

              setTimeout(() => {
                notificationRef.close();
              }, 3000);

              notificationRef.afterClosed().pipe(take(1)).subscribe(() => {
                this.closeDialog(this.screeningForm);
              });
            } else {
              const notificationRef = this.dialog.open(NotificationWindowComponent, {
                data: { message: "Screening form has been created!" }
              });

              setTimeout(() => {
                notificationRef.close();
              }, 3000);
            }
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error updating data', err);
          this.dialog.open(WarningsErrorsDialogComponent, {
            data: { message: "Error updating screening form!" }
          });
          this.cdr.markForCheck();
        },
      });
  }

  normalizeVideoDuration(question: ScreeningQuestion): void {
    if (
      question.durationInSeconds == null ||
      question.durationInSeconds < this.MIN_VIDEO_DURATION
    ) {
      question.durationInSeconds = this.MIN_VIDEO_DURATION;
    }
  }

  addOption(question: ScreeningQuestion) {
    if (!question.options) {
      question.options = [];
    }
    question.options.push({order: question.options.length, text: ''});
  }

  removeOption(question: ScreeningQuestion, index: number) {
    question.options?.splice(index, 1);
  }

  previewTalentView() {
    if(this.screeningFormId === '') {
      return;
    }
    const url = this.router.serializeUrl(
      this.router.createUrlTree([
        environment.routes.career,
        environment.routes.screening,
        this.positionId,
      ])
    );

    window.open(url, '_blank');
  }

  closeDialog(screeningForm: ScreeningForm) {
    if (this.dialogRef) {
      this.dialogRef.close(screeningForm);
    }
  }
}
