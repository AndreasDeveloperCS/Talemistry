import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, take } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { NotificationWindowComponent } from '../../../general/dialogs/notification-window/notification-window.component';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { Sorting } from '../../../general/services/search-logic.service';
import { Company, CompanyData, CompanyVersion, CompanyVersionDialogResult } from '../../models/company';
import { CompanyVersionService } from '../../services/company-version.service';
import { CompanyCreationModalShortComponent } from '../company-creation-modal-short/company-creation-modal-short.component';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';

@Component({
  selector: 'app-company-list',
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyListComponent extends TableTemplateComponent<CompanyVersion> {
  override currentComponentName = this.constructor.name;
  entity: CompanyVersion = new CompanyVersion();
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';

  constructor(
    private companyVersionService: CompanyVersionService,
    private dialogHelper: DialogHelperService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    injector: Injector
  ) {
    super(companyVersionService, injector);
    console.log(this.currentComponentName);
  }

  public override sorting: Sorting = {
    property: 'email',
    direction: "ASC"
  }

  public override sortingProcessed: Sorting = {
    property: 'email',
    direction: "DESC"
  }

  public override headerNames: Map<string, string> = new Map<string, string>([
    ['isVerified', 'Is Verified'],
    ['companyName', 'Name'],
    ['shortDescription', 'Short Description'],
    ['mainIndustryDomain', 'Main Industry Domain'],
    ['userId', 'USER ID'],
    ['companySize', 'Size'],
    ['companySizeRange', 'Size Range'],
    ['companyRevenue', 'Revenue'],
    ['taxNumber', 'Tax Number'],
    ['currency', 'Currency'],
    ['companySite', 'Site'],
    ['companyAddress', 'Address'],
    ['companyEmail', 'Email'],
    ['companyPhone', 'Phone'],
    ['createdBy', 'CREATED BY'],
    ['modifiedBy', 'MODIFIED BY'],
    ['createdDate', 'created Date'],
    ['modifiedDate', 'modified Date']
  ]);

  public override displayedColumns: string[] = [
    'edit',
    'delete',
    'isVerified',
    'companyName',
    'shortDescription',
    'mainIndustryDomain',
    'userId',
    'companySize',
    'companySizeRange',
    'companyRevenue',
    'taxNumber',
    'currency',
    'companySite',
    'companyAddress',
    'companyEmail',
    'companyPhone',
    'createdBy',
    'modifiedBy',
    'createdDate',
    'modifiedDate'
  ];

  override ngAfterViewInit() {
    this.changeDetectorRef.detectChanges();
  }

  isVerifiedSwitched(rowValue: CompanyVersion) {
    console.log('isVerifiedSwitched', rowValue);
    this.companyVersionService.patchAsync(rowValue._id, rowValue, 'isVerified', !rowValue.isVerified, true)
      .pipe(take(1)).subscribe({
        next: (res) => {
          console.log('Successfully updated field', res);
          this.cdr.markForCheck();
        }, error: (err) => {
          this.crudService.refreshDataBehaviorSubject.next(true);
          this.cdr.markForCheck();
          console.log('Error while updating the field', err);
        }
      })
  }

  async create(): Promise<any> {
    this.dialogHelper.openDialog(CompanyCreationModalShortComponent, (result: CompanyVersionDialogResult) => {
      if (result) {
        const currentCurrency = this.companyVersionService.getDefaultCurrency();
        console.log('Default currency set to USD', result, currentCurrency);
        if (result) {
          result.companyInfo.currency = currentCurrency;
        }
        console.log('result', result);

        let companyVersion = new CompanyVersion();
        companyVersion.data = result.companyInfo;
        companyVersion.userId = this.userId;
        companyVersion.createdBy = this.userId;

        this.companyVersionService.createPayloadAsync(companyVersion, true, result?.fileData, false).pipe(take(1)).subscribe({
          next: (res) => {
            if(res) {
              this.dialog.open(NotificationWindowComponent, {
                data: { message: "Company has been created!" }
              });
              this.companyVersionService.refreshDataBehaviorSubject.next(true);
              this.cdr.markForCheck();
            }
          }, error: (err) => {
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error creating the company!" }
            });
            console.error('Error creating the company', err);
            this.cdr.markForCheck();
          }
        });
      }
    }, { panelClass: 'panel-class-dialog' });
  }

  edit(company: Company): void {
    console.log('Editing company:', company);
    this.dialogHelper.openDialog(CompanyCreationModalShortComponent, (result: CompanyVersionDialogResult) => {
      if (result) {
        console.log('Before updateAsync', result, company._id);
        this.companyVersionService.updatePayloadAsync(company._id, result.companyInfo, true, result?.fileData, true)
          .pipe(take(1)).subscribe({
          next: (res) => {
            if(res) {
              this.dialog.open(NotificationWindowComponent, {
                data: { message: "Company has been updated!" }
              });
              this.cdr.markForCheck();
            }
          }, error: (err) => {
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error updating the company!" }
            });
            console.error('Error creating the company', err);
            this.cdr.markForCheck();
          }
        });
      }
    }, { data: company, panelClass: 'panel-class-dialog' });
  }

  delete(company: any) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete company with ID: ${company._id}`);
        this.companyVersionService.deleteAsync(company._id, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            if(res) {
              this.dialog.open(NotificationWindowComponent, {
                data: { message: "Company has been deleted!" }
              });
              this.companyVersionService.refreshDataBehaviorSubject.next(true);
              this.cdr.markForCheck();
            }
          }, error: (err) => {
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error deleting the company!" }
            });
            console.error('Error deleting the company', err);
            this.cdr.markForCheck();
          }
        });
      } else {
        console.log('Delete action was cancelled');
      }
    }
    this.dialogHelper.confirmationDialog(executeDelete);
  }
}