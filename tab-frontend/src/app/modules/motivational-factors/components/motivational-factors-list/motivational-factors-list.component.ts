import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { MotivationalFactor } from '../../models/motivational-factor';
import { MotivationalFactorsService } from '../../services/motivational-factors.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { Sorting } from '../../../general/services/search-logic.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { MotivationalFactorsFormComponent } from '../motivational-factors-form/motivational-factors-form.component';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { take } from 'rxjs';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';

@Component({
  selector: 'app-motivational-factors-list',
  templateUrl: './motivational-factors-list.component.html',
  styleUrl: './motivational-factors-list.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MotivationalFactorsListComponent extends TableTemplateComponent<MotivationalFactor> implements OnInit {
  override currentComponentName = this.constructor.name;
  public selectedCountry: string = '';
  countries: string[] = [];
  entity: MotivationalFactor = new MotivationalFactor();

  constructor(public factorService: MotivationalFactorsService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private dialogHelper: DialogHelperService,
    injector: Injector) {
    super(factorService, injector);
  }

  public override sorting: Sorting = {
    property: getPropertyName<MotivationalFactor>((e: MotivationalFactor) => e.factor), 
    direction: 'DESC'
  }

  public override sortingProcessed: Sorting = {
    property: getPropertyName<MotivationalFactor>((e: MotivationalFactor) => e.factor), 
    direction: "DESC"
  }

  public override headerNames: Map<string, string> = new Map<string, string>([
    ['isVerified', 'IS VERIFIED'],
    ['factor', 'FACTOR'],
    ['createdBy', 'CREATED BY'],
  ]);

  public override displayedColumns: string[] = [
    'edit',
    'delete',
    'isVerified',
    'factor',
    'createdBy'
  ];

  isVerifiedSwitched(rowValue: MotivationalFactor) {
    this.crudService.patchAsync(rowValue._id, rowValue, 'isVerified', !rowValue.isVerified, true);
  }

  create(): void {
    this.dialogHelper.openDialog(MotivationalFactorsFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        this.factorService.createAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Motivational factor has been created', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Motivational factor has been created!" }
            });
            this.factorService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while creating the motivational factor', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while creating the motivational factor!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { panelClass: 'panel-class-dialog' });
  }

  edit(motivationalFactor: MotivationalFactor): void {
    this.dialogHelper.openDialog(MotivationalFactorsFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        result._id = motivationalFactor._id;
        result.createdBy = motivationalFactor.createdBy;
        this.factorService.updateAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Motivational factor has been updated', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Motivational factor has been updated!" }
            });
            this.factorService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while updating the motivational factor', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while updating the motivational factor!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { data: motivationalFactor, panelClass: 'panel-class-dialog' });
  }

  delete(motivationalFactor: MotivationalFactor) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete Motivational Factor with ID: ${motivationalFactor._id}`);
        this.factorService.deleteAsync(motivationalFactor._id).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Motivational factor has been deleted', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Motivational factor has been deleted!" }
            });
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while deleting the motivational factor', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while deleting the motivational factor!" }
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

  // create(): void {
  //   this.dialogHelper.openDialog(MotivationalFactorsFormComponent, (result) => {
  //     if (result) {
  //       this.crudService.createAsync(result, true, false);
  //       console.log('Position Motivational Factor created:', result);
  //       this.cdr.markForCheck();
  //     }
  //   }, { panelClass: 'panel-class-dialog' });
  // }

  // edit(motivationalFactor: MotivationalFactor): void {
  //   this.dialogHelper.openDialog(MotivationalFactorsFormComponent, (result) => {
  //     if (result) {
  //       result._id = motivationalFactor._id;
  //       result.createdBy = motivationalFactor.createdBy;
  //       this.crudService.updateAsync(result, true);
  //       console.log('Motivational Factor updated:', result);
  //       this.cdr.markForCheck();
  //     }
  //   }, { data: motivationalFactor, panelClass: 'panel-class-dialog' });
  // }

  // delete(motivationalFactor: MotivationalFactor) {
  //   const executeDelete = (confirmed: boolean) => {
  //     if (confirmed) {
  //       console.log(`Attempting to delete Motivational Factor with ID: ${motivationalFactor._id}`);
  //       this.crudService.deleteAsync(motivationalFactor._id);
  //     } else {
  //       console.log('Delete action was cancelled');
  //     }
  //   }
  //   this.dialogHelper.confirmationDialog(executeDelete);
  //   this.cdr.markForCheck();
  // }
}
