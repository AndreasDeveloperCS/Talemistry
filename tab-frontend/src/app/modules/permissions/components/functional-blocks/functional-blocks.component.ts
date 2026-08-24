import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FunctionalBlock } from '../../models/functional-block';
import { FunctionalBlocksService } from '../../services/functional-blocks.service';
import { FunctionalBlockFormComponent } from '../functional-block-form/functional-block-form.component';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { Sorting } from '../../../general/services/search-logic.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { take } from 'rxjs';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';

@Component({
  selector: 'app-functional-blocks',
  templateUrl: './functional-blocks.component.html',
  styleUrl: './functional-blocks.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FunctionalBlocksComponent extends TableTemplateComponent<FunctionalBlock> {
  override currentComponentName = this.constructor.name;

  public selectedRegion: string = '';
  public selectedCity: string = '';
  public selectedCountry: string = '';

  public override sorting: Sorting = {
    property: getPropertyName<FunctionalBlock>((e: FunctionalBlock) => e.registerValue),
    direction: "ASC"
  }

  public override sortingProcessed: Sorting = {
    property: getPropertyName<FunctionalBlock>((e: FunctionalBlock) => e.registerValue),
    direction: "DESC"
  }

  public override headerNames: Map<string, string> = new Map<string, string>([
    ['code', 'CODE'],
    ['description', 'DESCRIPTION'],
    ['endpointRoute', 'ENDPOINT ROUTE'],
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
    'endpointRoute',
    'registerValue',
    'bitValue',
    'numberValue',
    'createdBy?',
    'modifiedBy?',
    'createdDate',
    'modifiedDate'
  ];
  
  constructor(public service: FunctionalBlocksService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    public authGuard: AuthGuardService,
    public dialogHelper: DialogHelperService,
    injector: Injector
  ) {
    super(service, injector);
  }

  create(): void {
    this.dialogHelper.openDialog(FunctionalBlockFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        this.service.createAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Functional Block has been created', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Functional Block has been created!" }
            });
            this.service.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while creating the Functional Block', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while creating the Functional Block!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { panelClass: 'panel-class-dialog' });
  }

  edit(functionalBlock: FunctionalBlock): void {
    this.dialogHelper.openDialog(FunctionalBlockFormComponent, (result: FunctionalBlock) => {
      if (result) {
        console.log('Create res', result);
        result._id = functionalBlock._id;
        result.createdBy = functionalBlock.createdBy;
        this.service.updateAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Functional Block has been updated', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Functional Block has been updated!" }
            });
            this.service.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while updating the Functional Block', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while updating the Functional Block!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { data: functionalBlock, panelClass: 'panel-class-dialog' });
  }

  delete(functionalBlock: any) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete Functional Block with ID: ${functionalBlock._id}`);
        this.service.deleteAsync(functionalBlock._id).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Functional Block has been deleted', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Functional Block has been deleted!" }
            });
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while deleting the Functional Block', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while deleting the Functional Block!" }
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

  toggleIsBlockActive(block: FunctionalBlock): void {
    const updatedBlock = { ...block, isActive: !block.isActive };
    this.service.updateAsync(updatedBlock, true, true);
    console.log('Toggling isActive for block:', updatedBlock);
  }
}
