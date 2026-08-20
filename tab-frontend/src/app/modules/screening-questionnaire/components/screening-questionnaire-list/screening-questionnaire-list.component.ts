import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { Filter, Sorting } from '../../../general/services/search-logic.service';
import { concatMap, from, take } from 'rxjs';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { ScreeningQuestionnaireFormComponent } from '../screening-questionnaire-form/screening-questionnaire-form.component';
import { ScreeningQuestionTemplate } from '../../models/screening-question-templates';
import { ScreeningQuestionTemplatesService } from '../../services/screening-question-templates.service';
import { SCREENING_QUESTION_TEMPLATES } from 'src/app/modules/screening-questionnaire/constants/screening-question-templates.constants';

@Component({
  selector: 'app-screening-questionnaire-list',
  templateUrl: './screening-questionnaire-list.component.html',
  styleUrl: './screening-questionnaire-list.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScreeningQuestionnaireListComponent extends TableTemplateComponent<ScreeningQuestionTemplate> implements OnInit {
  override currentComponentName = this.constructor.name;
  entity: ScreeningQuestionTemplate = new ScreeningQuestionTemplate();

  public override sorting: Sorting = {
    property: 'text',
    direction: "ASC"
  }

  public override sortingProcessed: Sorting = {
    property: 'text',
    direction: "DESC"
  }

  public override headerNames: Map<string, string> = new Map<string, string>([
    ['isVerified', 'IS VERIFIED'],
    ['text', 'TEXT'], 
    ['type', 'TYPE'], 
    ['positionTags', 'POSITION TAGS'], 
    ['seniorityLevels', 'SENIORITY LEVELS'], 
    ['category', 'CATEGORY'], 
    ['_id', 'ID']
  ]);

  public override displayedColumns: string[] = [
    'isVerified',
    'edit',
    'delete',
    'text',
    'type',
    'positionTags',
    'seniorityLevels',
    'category',
    '_id',
  ];
  
  constructor(private screeningQuestionTemplateService: ScreeningQuestionTemplatesService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private dialogHelper: DialogHelperService,
    injector: Injector) {
    super(screeningQuestionTemplateService, injector);
  }

  isVerifiedSwitched(rowValue: ScreeningQuestionTemplate) {
    // console.log('isVerifiedSwitched', rowValue);
    this.screeningQuestionTemplateService.patchAsync(rowValue._id, rowValue, 'isVerified', !rowValue.isVerified, true);
  }

  seedAll(): void {
    from(SCREENING_QUESTION_TEMPLATES)
      .pipe(concatMap(dto => this.screeningQuestionTemplateService.createAsync(dto, true, false)),)
      .subscribe({
        next: res => {
          console.log('Created:', res);
          this.screeningQuestionTemplateService.refreshDataBehaviorSubject.next(true);
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('Seed error:', err)
        },
        complete: () => {
          console.log('✅ Screening templates seeded')
        },
      });
  }

  create(): void {
    this.dialogHelper.openDialog(ScreeningQuestionnaireFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        this.screeningQuestionTemplateService.createAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Screening Question has been created', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Screening Question has been created!" }
            });
            this.screeningQuestionTemplateService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while creating the Screening Question', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while creating the Screening Question!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    });
  }

  edit(screeningQuestion: any): void {
    this.dialogHelper.openDialog(ScreeningQuestionnaireFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        result._id = screeningQuestion._id;
        result.createdBy = screeningQuestion.createdBy;
        this.screeningQuestionTemplateService.updateAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Screening Question has been updated', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Screening Question has been updated!" }
            });
            this.screeningQuestionTemplateService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while updating the Screening Question', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while updating the Screening Question!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { data: screeningQuestion });
  }

  delete(screeningQuestion: any) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete Screening Question with ID: ${screeningQuestion._id}`);
        this.screeningQuestionTemplateService.deleteAsync(screeningQuestion._id).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Screening Question has been deleted', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Screening Question has been deleted!" }
            });
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while deleting the Screening Question', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while deleting the Screening Question!" }
            });
            this.cdr.markForCheck();
          }
        });
      } else {
        console.log('Delete action was cancelled');
      }
    }
    this.dialogHelper.confirmationDialog(executeDelete);
    this.cdr.markForCheck();
  }
}