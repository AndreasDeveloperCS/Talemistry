import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { RecruitmentPlatform, RecruitmentPlatformDialogResult } from '../../models/recruitment-platform';
import { RecruitmentPlatformService } from '../../services/recruitment-platform.service';
import { RecruitmentPlatformFormComponent } from '../recruitment-platform-form/recruitment-platform-form.component';
import { FUNCTIONALBLOCK } from '../../../permissions/models/functional-block-enum';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { Filter, Sorting } from '../../../general/services/search-logic.service';
import { take } from 'rxjs';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';

@Component({
  selector: 'app-recruitment-platform-list',
  templateUrl: './recruitment-platform-list.component.html',
  styleUrl: './recruitment-platform-list.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentPlatformListComponent extends TableTemplateComponent<RecruitmentPlatform> {
  override currentComponentName = this.constructor.name;
  public selectedRecruitmentPlatform: string = '';
  recruitmentPlatform: string[] = [];

  public get isAuthorized(): boolean {
    return this.authGuard.hasFullAccess(FUNCTIONALBLOCK.JOBPLATFORMS);
  }

  public override headerNames: Map<string, string> = new Map<string, string>([
    ['isVerified', 'IS VERIFIED'],
    ['iconImage', 'ICON-IMAGE'],
    ['icon', 'ICON'],
    ['name', 'NAME'],
    ['mainUrl', 'LINK'],
    ['priority', 'PRIORITY'],
    ['_id', 'ID']
  ]);

  public override displayedColumns: string[] = [
    'edit',
    'delete',
    'isVerified',
    'icon',
    'name',
    'mainUrl',
    'priority',
    '_id'
  ];

  public override sorting: Sorting = {
    property: 'priority',
    direction: "ASC"
  }

  public override sortingProcessed: Sorting = {
    property: 'priority',
    direction: "DESC"
  }

  constructor(
    public authGuard: AuthGuardService,
    public dialog: MatDialog,
    public dialogHelper: DialogHelperService,
    private cdr: ChangeDetectorRef,
    private recruitmentPlatformService: RecruitmentPlatformService,
    injector: Injector) {
    super(recruitmentPlatformService, injector);
  }

  getIconImage(rowValue: any, column: any) {
    return rowValue[column];
  }

  override populateDropDownLists() {

    this.recruitmentPlatform = this.data.items ? this.data.items?.map((item: any) => item._id) : [];

    this.recruitmentPlatform.unshift("All");
  }

  recruitmentPlatformChanged($event: any, column: string) {
    // console.log('Recruitment Platform changed', $event, column);
    const filterValue = $event.value;
    this.filtering = this.filtering.filter((filter: Filter) => filter.property !== 'recruitmentPlatform');

    if (filterValue != undefined && filterValue != null && filterValue != "All") {
      const newFilter = this.searchLogicService.getFilter(column, filterValue);

      if (newFilter)
        this.filtering.push(newFilter);

      this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);

    } else {
      this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
    }
  }

  plus(rowValue: RecruitmentPlatform) {
    this.recruitmentPlatformService.patchAsync(rowValue._id, rowValue, 'priority', ++rowValue.priority, true);
  }

  minus(rowValue: RecruitmentPlatform) {
    this.recruitmentPlatformService.patchAsync(rowValue._id, rowValue, 'priority', --rowValue.priority, true);
  }

  isVerifiedSwitched(rowValue: RecruitmentPlatform) {
    // console.log('isVerifiedSwitched', rowValue);
    this.recruitmentPlatformService.patchAsync(rowValue._id, rowValue, 'isVerified', !rowValue.isVerified, true);
  }

  create(): void {
    this.dialogHelper.openDialog(RecruitmentPlatformFormComponent, (result: RecruitmentPlatformDialogResult) => {
      if (result) {
        console.log('Recruitment Platform res:', result);
        this.recruitmentPlatformService.createPayloadAsync(
          result.recruitmentPlatform,
          true,
          result.fileData,
          false
        ).pipe(take(1)).subscribe({
          next: (result: RecruitmentPlatform) => {
            console.log('Created recruitment platform', result);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Recruitment platform has been created!" }
            });
            this.recruitmentPlatformService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (error: any) => {
            console.error('Error creating recruitment platform', error);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error creating recruitment platform!" }
            });
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  edit(recruitmentPlatform: any): void {
    this.dialogHelper.openDialog(RecruitmentPlatformFormComponent, (result: RecruitmentPlatformDialogResult) => {
      if (result) {
        if (result.fileData?.file) {
          this.recruitmentPlatformService.updatePayloadAsync(
            result.recruitmentPlatform,
            true,
            result.fileData,
            false
          ).pipe(take(1)).subscribe({
            next: (result: RecruitmentPlatform) => {
              console.log('Updated recruitmentPlatform', result);
              this.dialog.open(NotificationWindowComponent, {
                data: { message: "RecruitmentPlatform has been updated!" }
              });
              this.recruitmentPlatformService.refreshDataBehaviorSubject.next(true);
              this.cdr.markForCheck();
            }, error: (error: any) => {
              console.error('Error updating recruitmentPlatform', error);
              this.dialog.open(WarningsErrorsDialogComponent, {
                data: { message: "Error updating recruitmentPlatform!" }
              });
              this.cdr.markForCheck();
            }
          });
        } else {
          this.recruitmentPlatformService.updateAsync(
            result.recruitmentPlatform,
            true,
            false
          ).pipe(take(1)).subscribe({
            next: (result: RecruitmentPlatform) => {
              console.log('Updated recruitmentPlatform', result);
              this.dialog.open(NotificationWindowComponent, {
                data: { message: "RecruitmentPlatform has been updated!" }
              });
              this.recruitmentPlatformService.refreshDataBehaviorSubject.next(true);
              this.cdr.markForCheck();
            }, error: (error: any) => {
              console.error('Error updating recruitmentPlatform', error);
              this.dialog.open(WarningsErrorsDialogComponent, {
                data: { message: "Error updating recruitmentPlatform!" }
              });
              this.cdr.markForCheck();
            }
          });
        }
      }
    }, { data: recruitmentPlatform });
  }

  delete(recruitmentPlatform: any) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete paltform with ID: ${recruitmentPlatform._id}`);
        this.recruitmentPlatformService.deleteAsync(recruitmentPlatform._id).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Platform has been deleted', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Platform has been deleted!" }
            });
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while deleting the platform', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while deleting the platform!" }
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