import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { SocialMedia, SocialMediaDialogResult, UserSocialMedia } from '../../models/social-media';
import { SocialMediaService } from '../../services/social-media.service';
import { SocialMediaFormComponent } from '../social-media-form/social-media-form.component';
import { FUNCTIONALBLOCK } from '../../../permissions/models/functional-block-enum';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { Filter, Sorting } from '../../../general/services/search-logic.service';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { take } from 'rxjs';

@Component({
  selector: 'app-social-media-list',
  templateUrl: './social-media-list.component.html',
  styleUrl: './social-media-list.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SocialMediaListComponent extends TableTemplateComponent<SocialMedia> {
  override currentComponentName = this.constructor.name;
  public selectedSocialMedia: string = '';
  socialMedia: string[] = [];
  entity: UserSocialMedia = new UserSocialMedia();

  public get isAuthorized(): boolean {
    return this.authGuard.hasFullAccess(FUNCTIONALBLOCK.SOCIALMEDIA);
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
    private cdr: ChangeDetectorRef,
    public dialogHelper: DialogHelperService,
    private socialMediaService: SocialMediaService,
    injector: Injector
  ) {
    super(socialMediaService, injector);
  }

  getIconImage(rowValue: any, column: any) {
    return rowValue[column];
  }

  override populateDropDownLists() {

    this.socialMedia = this.data.items ? this.data.items?.map((item: any) => item._id) : [];

    this.socialMedia.unshift("All");
    this.cdr.markForCheck();
  }

  socialMediaChanged($event: any, column: string) {
    const filterValue = $event.value;
    this.filtering = this.filtering.filter((filter: Filter) => filter.property !== 'socialMedia');

    if (filterValue != undefined && filterValue != null && filterValue != "All") {
      const newFilter = this.searchLogicService.getFilter(column, filterValue);

      if (newFilter)
        this.filtering.push(newFilter);

      this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);

    } else {
      this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
    }
  }

  plus(rowValue: SocialMedia) {
    this.socialMediaService.patchAsync(rowValue._id, rowValue, 'priority', ++rowValue.priority, true);
  }

  minus(rowValue: SocialMedia) {
    this.socialMediaService.patchAsync(rowValue._id, rowValue, 'priority', --rowValue.priority, true);
  }

  isVerifiedSwitched(rowValue: SocialMedia) {
    this.socialMediaService.patchAsync(rowValue._id, rowValue, 'isVerified', !rowValue.isVerified, true);
  }

  create(): void {
    this.dialogHelper.openDialog(SocialMediaFormComponent, (result: SocialMediaDialogResult) => {
      if (result) {
        console.log('Social Media res:', result);
        this.socialMediaService.createPayloadAsync(
          result.socialMediaInfo,
          true,
          result.fileData,
          false
        ).pipe(take(1)).subscribe({
          next: (result: SocialMedia) => {
            console.log('Created social media', result);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Social Media has been created!" }
            });
            this.socialMediaService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (error: any) => {
            console.error('Error creating social media', error);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error creating social media!" }
            });
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  edit(socialMedia: any): void {
    this.dialogHelper.openDialog(SocialMediaFormComponent, (result: SocialMediaDialogResult) => {
      if (result) {
        console.log('Social Media res:', result);
        if (result.fileData?.file) {
          this.socialMediaService.updatePayloadAsync(
            result.socialMediaInfo,
            true,
            result.fileData,
            false
          ).pipe(take(1)).subscribe({
            next: (result: SocialMedia) => {
              console.log('Updated social media', result);
              this.dialog.open(NotificationWindowComponent, {
                data: { message: "Social Media has been updated!" }
              });
              this.socialMediaService.refreshDataBehaviorSubject.next(true);
              this.cdr.markForCheck();
            }, error: (error: any) => {
              console.error('Error updating social media', error);
              this.dialog.open(WarningsErrorsDialogComponent, {
                data: { message: "Error updating social media!" }
              });
              this.cdr.markForCheck();
            }
          });
        } else {
          this.socialMediaService.updateAsync(
            result.socialMediaInfo,
            true,
            false
          ).pipe(take(1)).subscribe({
            next: (result: SocialMedia) => {
              console.log('Updated social media', result);
              this.dialog.open(NotificationWindowComponent, {
                data: { message: "Social Media has been updated!" }
              });
              this.socialMediaService.refreshDataBehaviorSubject.next(true);
              this.cdr.markForCheck();
            }, error: (error: any) => {
              console.error('Error updating social media', error);
              this.dialog.open(WarningsErrorsDialogComponent, {
                data: { message: "Error updating social media!" }
              });
              this.cdr.markForCheck();
            }
          });
        }
      }
    }, { data: socialMedia });
  }

  delete(socialMedia: any) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete social medial with ID: ${socialMedia._id}`);
        this.socialMediaService.deleteAsync(socialMedia._id).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Benefit has been deleted', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Social media has been deleted!" }
            });
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while deleting the social media', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while deleting the social media!" }
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
