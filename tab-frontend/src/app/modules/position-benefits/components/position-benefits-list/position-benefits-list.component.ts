import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { PositionBenefitsService } from '../../services/position-benefits.service';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { PositionBenefit } from '../../models/position-benefit';
import { MatDialog } from '@angular/material/dialog';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { Sorting } from '../../../general/services/search-logic.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { PositionBenefitsFormComponent } from '../position-benefits-form/position-benefits-form.component';
import { take } from 'rxjs';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';

@Component({
  selector: 'app-position-benefits-list',
  templateUrl: './position-benefits-list.component.html',
  styleUrl: './position-benefits-list.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionBenefitsListComponent extends TableTemplateComponent<PositionBenefit> implements OnInit {
  override currentComponentName = this.constructor.name;
  public selectedCountry: string = '';
  countries: string[] = [];
  entity: PositionBenefit = new PositionBenefit();

  constructor(public positionService: PositionBenefitsService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private dialogHelper: DialogHelperService,
    injector: Injector) {
    super(positionService, injector);
  }

  public override sorting: Sorting = {
    property: getPropertyName<PositionBenefit>((e: PositionBenefit) => e.benefit), 
    direction: 'DESC'
  }

  public override sortingProcessed: Sorting = {
    property: getPropertyName<PositionBenefit>((e: PositionBenefit) => e.benefit), 
    direction: "DESC"
  }

  public override headerNames: Map<string, string> = new Map<string, string>([
    ['isVerified', 'IS VERIFIED'],
    ['benefit', 'BENEFIT'],
    ['createdBy', 'CREATED BY'],
  ]);

  public override displayedColumns: string[] = [
    'edit',
    'delete',
    'isVerified',
    'benefit',
    'createdBy'
  ];
  
  isVerifiedSwitched(rowValue: PositionBenefit) {
    // console.log('isVerifiedSwitched', rowValue);
    this.crudService.patchAsync(rowValue._id, rowValue, 'isVerified', !rowValue.isVerified, true);
  }

  create(): void {
    this.dialogHelper.openDialog(PositionBenefitsFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        this.positionService.createAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Benefit has been created', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Benefit has been created!" }
            });
            this.positionService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while creating the benefit', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while creating the benefit!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { panelClass: 'panel-class-dialog' });
  }

  edit(positionBenefit: PositionBenefit): void {
    this.dialogHelper.openDialog(PositionBenefitsFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        result._id = positionBenefit._id;
        result.createdBy = positionBenefit.createdBy;
        this.positionService.updateAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Benefit has been updated', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Benefit has been updated!" }
            });
            this.positionService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while updating the benefit', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while updating the benefit!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { data: positionBenefit, panelClass: 'panel-class-dialog' });
  }

  delete(positionBenefit: PositionBenefit) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete benefit with ID: ${positionBenefit._id}`);
        this.positionService.deleteAsync(positionBenefit._id).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Benefit has been deleted', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Benefit has been deleted!" }
            });
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while deleting the benefit', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while deleting the benefit!" }
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
