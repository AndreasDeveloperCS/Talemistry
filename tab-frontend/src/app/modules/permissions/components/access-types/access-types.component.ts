import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AccessType } from '../../models/access-type';
import { AccessTypesService } from '../../services/access-types.service';
import { AccessTypeFormComponent } from '../access-type-form/access-type-form.component';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { Sorting } from '../../../general/services/search-logic.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { take } from 'rxjs';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';

@Component({
  selector: 'app-access-types',
  templateUrl: './access-types.component.html',
  styleUrl: './access-types.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessTypesComponent extends TableTemplateComponent<AccessType> {
  override currentComponentName = this.constructor.name;
  public selectedRegion: string = '';
  public selectedCity: string = '';
  public selectedCountry: string = '';

  public override sorting: Sorting = {
    property: getPropertyName<AccessType>((e: AccessType) => e.registerValue),
    direction: "ASC"
  }

  public override sortingProcessed: Sorting = {
    property: getPropertyName<AccessType>((e: AccessType) => e.registerValue),
    direction: "DESC"
  }

  public override headerNames: Map<string, string> = new Map<string, string>([
    ['code', 'CODE'],
    ['description', 'DESCRIPTION'],
    ['methods', 'METHODS'],
    ['registerValue', 'REGISTER VALUE'],
    ['bitValue', 'BIT VALUE'],
    ['numberValue', 'NUMBER VALUE'],
    ['createdBy?', 'CREATED BY?'],
    ['modifiedBy?', 'MODIFIED BY?'],
    ['createdDate', 'CREATED DATE'],
    ['modifiedDate', 'MODIFIED DATE']
  ]);

  public override displayedColumns: string[] = [
    'edit',
    'delete',
    'isActive',
    'code',
    'description',
    'methods',
    'registerValue',
    'bitValue',
    'numberValue',
    'createdBy?',
    'modifiedBy?',
    'createdDate',
    'modifiedDate'
  ];
  
  constructor(public service: AccessTypesService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    public authGuard: AuthGuardService,
    public dialogHelper: DialogHelperService,
    injector: Injector
  ) {
    super(service, injector);
  }

  create(): void {
    this.dialogHelper.openDialog(AccessTypeFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        this.service.createAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Access Type has been created', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Access Type has been created!" }
            });
            this.service.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while creating the Access Type', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while creating the Access Type!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { panelClass: 'panel-class-dialog' });
  }

  edit(accessType: any): void {
    this.dialogHelper.openDialog(AccessTypeFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        result._id = accessType._id;
        result.createdBy = accessType.createdBy;
        this.service.updateAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Access Type has been updated', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Access Type has been updated!" }
            });
            this.service.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while updating the Access Type', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while updating the Access Type!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { data: accessType, panelClass: 'panel-class-dialog' });
  }

  delete(accessType: any) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete Access Type with ID: ${accessType._id}`);
        this.service.deleteAsync(accessType._id).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Access Type has been deleted', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Access Type has been deleted!" }
            });
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while deleting the Access Type', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while deleting the Access Type!" }
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

  toggleIsAccessTypeActive(accessType: AccessType): void {
    const updatedAccessType = { ...accessType, isActive: !accessType.isActive };
    this.service.updateAsync(updatedAccessType, true, true);
    console.log('Toggling isActive for block:', updatedAccessType);
  }
}