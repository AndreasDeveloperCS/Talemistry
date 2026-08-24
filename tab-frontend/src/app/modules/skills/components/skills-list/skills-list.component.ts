import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Skill } from '../../models/skill';
import { SkillsService } from '../../services/skills.service';
import { SkillFormComponent } from '../skill-form/skill-form.component';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { Sorting } from '../../../general/services/search-logic.service';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { take } from 'rxjs';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';

@Component({
  selector: 'app-skills-list',
  templateUrl: './skills-list.component.html',
  styleUrl: './skills-list.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsListComponent extends TableTemplateComponent<Skill> implements OnInit {
  override currentComponentName = this.constructor.name;

  public override sorting: Sorting = {
    property: 'createdDate',
    direction: "DESC"
  }

  public override sortingProcessed: Sorting = {
    property: 'createdDate',
    direction: "ASC"
  }

  entity: Skill = new Skill();

  public override displayedColumns: string[] = [
    'edit',
    'delete',
    'isVerified',
    'skillType',
    'skillName',
  ];

  public override headerNames: Map<string, string> = new Map<string, string>([
    ['isVerified', 'IS VERIFIED'],
    ['skillType', 'SKILL TYPE'],
    ['skillName', 'SKILL NAME'],
  ]);

  constructor(public dialog: MatDialog,
    public authGuard: AuthGuardService,
    private cdr: ChangeDetectorRef,
    public dialogHelper: DialogHelperService,
    public service: SkillsService,
    injector: Injector) {
    super(service, injector);
  }

  isVerifiedSwitched(rowValue: Skill) {
    // console.log('isVerifiedSwitched', rowValue);
    this.service.patchAsync(rowValue._id, rowValue, 'isVerified', !rowValue.isVerified, true);
  }

  create(): void {
    this.dialogHelper.openDialog(SkillFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        this.service.createAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Skill has been created', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Skill has been created!" }
            });
            this.service.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while creating the skill', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while creating the skill!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { panelClass: 'panel-class-dialog' });
  }

  edit(skill: any): void {
    this.dialogHelper.openDialog(SkillFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        result._id = skill._id;
        result.createdBy = skill.createdBy;
        this.service.updateAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Skill has been updated', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Skill has been updated!" }
            });
            this.service.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while updating the skill', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while updating the skill!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { data: skill, panelClass: 'panel-class-dialog' });
  }

  delete(skill: any) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete Motivational Factor with ID: ${skill._id}`);
        this.service.deleteAsync(skill._id).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Skill has been deleted', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Skill has been deleted!" }
            });
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while deleting the skill', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while deleting the skill!" }
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
