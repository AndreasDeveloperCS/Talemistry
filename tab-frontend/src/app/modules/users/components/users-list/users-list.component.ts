import { Component, Input, OnInit, Output, ViewChild, EventEmitter, OnDestroy, ChangeDetectorRef, Injector, ChangeDetectionStrategy } from '@angular/core';
import { UserFormComponent } from '../user-form/user-form.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable, take } from 'rxjs';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { User } from '../../models/user';
import { UsersService } from '../../services/users.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { Sorting } from '../../../general/services/search-logic.service';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersListComponent extends TableTemplateComponent<User> {
  override currentComponentName = this.constructor.name;
  entity: User = new User();

  public override sorting: Sorting = {
    property: 'email',
    direction: "ASC"
  }

  public override sortingProcessed: Sorting = {
    property: 'email',
    direction: "DESC"
  }
  public override displayedColumns: string[] = [
    'edit',
    'delete',
    'email',
    'firstname',
    'lastname',
    'phone',
    'isVerifiedEmail',
    'role',
    '_id',
    'createdBy',
    'modifiedBy',
    'createdDate',
    'modifiedDate'
  ];

  public override headerNames: Map<string, string> = new Map<string, string>([
    ['_id', 'USER ID'],
    ['firstname', 'Firstname'],
    ['lastname', 'Lastname'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['isVerifiedEmail', 'IS Verified'],
    ['role', 'ROLE'],
    ['createdBy', 'CREATED BY'],
    ['modifiedBy', 'MODIFIED BY'],
    ['createdDate', 'created Date'],
    ['modifiedDate', 'modified Date']
  ]);

  constructor(private usersService: UsersService,
    private dialogHelper: DialogHelperService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
    injector: Injector) {
    super(usersService, injector);
  }

  override ngAfterViewInit() {
    this.changeDetectorRef.detectChanges();
  }

  isVerifiedSwitched(rowValue: User) {
    console.log('isVerifiedSwitched', rowValue);
    this.crudService.patchAsync(rowValue._id, rowValue, 'isVerifiedEmail', !rowValue.isVerifiedEmail, true);
  }

  create(): void {
    this.dialogHelper.openDialog(UserFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        this.usersService.createAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('User has been created', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "User has been created!" }
            });
            this.usersService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while creating the user', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while creating the user!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { panelClass: 'panel-class-dialog' });
  }

  edit(user: User): void {
    this.dialogHelper.openDialog(UserFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        result._id = user._id;
        this.usersService.updateAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('User has been updated', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "User has been updated!" }
            });
            this.usersService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while updating the user', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while updating the user!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { data: user, panelClass: 'panel-class-dialog' });
  }

  delete(user: any) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete useer with ID: ${user._id}`);
        this.usersService.deleteAsync(user._id).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('User has been deleted', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "User has been deleted!" }
            });
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while deleting the user', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while deleting the user!" }
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
