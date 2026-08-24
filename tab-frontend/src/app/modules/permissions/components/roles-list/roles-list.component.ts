import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RoleFormComponent } from '../role-form/role-form.component';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { Role } from '../../models/role';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { Sorting } from '../../../general/services/search-logic.service';
import { RolesService } from '../../services/roles.service';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { take } from 'rxjs';

@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RolesListComponent extends TableTemplateComponent<Role> {
  override currentComponentName = this.constructor.name;

  public selectedRegion: string = '';
  public selectedCity: string = '';
  public selectedCountry: string = '';

  public override sorting: Sorting = {
    property: getPropertyName<Role>((e: Role) => e.registerValue),
    direction: "ASC"
  }

  public override sortingProcessed: Sorting = {
    property: getPropertyName<Role>((e: Role) => e.registerValue),
    direction: "DESC"
  }

  public override headerNames: Map<string, string> = new Map<string, string>([
    ['code', 'CODE'],
    ['description', 'DESCRIPTION'],
    ['route', 'ROUTE'],
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
    'route',
    'registerValue',
    'bitValue',
    'numberValue',
    'createdBy?',
    'modifiedBy?',
    'createdDate',
    'modifiedDate'
  ];
  
  constructor(public service: RolesService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    public authGuard: AuthGuardService,
    public dialogHelper: DialogHelperService,
    injector: Injector
  ) {
    super(service, injector);
  }

  create(): void {
    this.dialogHelper.openDialog(RoleFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        this.service.createAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Role has been created', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Role has been created!" }
            });
            this.service.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while creating the Role', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while creating the Role!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { panelClass: 'panel-class-dialog' });
  }

  edit(role: Role): void {
    this.dialogHelper.openDialog(RoleFormComponent, (result: Role) => {
      if (result) {
        console.log('Create res', result);
        result._id = role._id;
        result.createdBy = role.createdBy;
        this.service.updateAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Role has been updated', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Role has been updated!" }
            });
            this.service.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while updating the Role', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while updating the Role!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { data: role, panelClass: 'panel-class-dialog' });
  }

  delete(role: any) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete Role with ID: ${role._id}`);
        this.service.deleteAsync(role._id).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Role has been deleted', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Role has been deleted!" }
            });
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while deleting the Role', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while deleting the Role!" }
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

  toggleIsRoleActive(role: Role): void {
    const updatedRole = { ...role, isActive: !role.isActive };
    this.service.updateAsync(updatedRole, true, true);
    console.log('Toggling isActive for role:', updatedRole);
  }
}
