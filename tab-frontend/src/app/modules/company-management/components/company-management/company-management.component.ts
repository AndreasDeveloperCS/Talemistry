import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { CompanyCreationModalComponent } from 'src/app/modules/companies/components/company-creation-modal/company-creation-modal.component';
import { environment } from '../../../../../environments/environment';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { CompanyCreationModalShortComponent } from '../../../companies/components/company-creation-modal-short/company-creation-modal-short.component';
import { CompanyVersion, CompanyVersionDialogResult } from '../../../companies/models/company';
import { CurrentCompany } from '../../../companies/models/current-company';
import { CompanyVersionService } from '../../../companies/services/company-version.service';
import { CurrentCompanyService } from '../../../companies/services/current-company.service';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { WarningsErrorsDialogComponent } from '../../../general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { NotificationWindowComponent } from '../../../general/dialogs/notification-window/notification-window.component';
import { OwnerEntity } from '../../../general/models/base-entity';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { FilterRule, Sorting } from '../../../general/services/search-logic.service';

@Component({
  selector: 'app-company-management',
  templateUrl: './company-management.component.html',
  styleUrl: './company-management.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyManagementComponent extends TableTemplateComponent<CompanyVersion> implements OnInit {
  selectedCompany: CompanyVersion | null = null;

  initialLoading: boolean = true;

  currentCompanyId!: any;
  currentCompanyRecord: CurrentCompany | null = null;

  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  companiesById: any;

  public override sorting: Sorting = {
    property: 'createdDate',
    direction: "DESC"
  }

  public override sortingProcessed: Sorting = {
    property: 'createdDate',
    direction: "ASC"
  }

  constructor(
    private dialogHelper: DialogHelperService,
    private companyVersionService: CompanyVersionService,
    private currentCompanyService: CurrentCompanyService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    injector: Injector
  ) {
    super(companyVersionService, injector);
  }

  override ngOnInit() {
    const mainFilter = {
      property: getPropertyName<OwnerEntity>((e: OwnerEntity) => e.userId),
      rule: FilterRule.EQUALS,
      value: `${sessionStorage.getItem(`${environment.storage.userId}`)?.toString()}`
    };
    this.filtering.push(mainFilter);
    super.ngOnInit();
    this.cdr.markForCheck();
    this.loadCurrentCompany();
  }

  loadCurrentCompany() {
    this.currentCompanyService.getByUserIdAsync(this.userId, true).pipe(take(1)).subscribe({
      next: (currentCompany) => {
        console.log('currentCompany', currentCompany);
        if (currentCompany && currentCompany.companyId) {
          this.currentCompanyRecord = currentCompany;
          this.currentCompanyId = currentCompany.companyId;
        } else {
          console.log('No currentCompanyIndex');
          this.currentCompanyRecord = null;
          this.currentCompanyId = null;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load current company', err);
        this.currentCompanyRecord = null;
        this.currentCompanyId = null;
        this.cdr.markForCheck();
      }
    });
  }

  setCurrent(companyId: any) {
    this.currentCompanyId = companyId;

    if (this.currentCompanyRecord) {
      console.log('currentCompanyRecord', this.currentCompanyRecord);
      this.currentCompanyService
        .patchAsync(this.currentCompanyRecord._id, this.currentCompanyRecord, 
                    getPropertyName<CurrentCompany>((e: CurrentCompany) => e.companyId), companyId)
        .pipe(take(1)).subscribe({
          next: (saved) => {
            console.log('saved', saved);
            this.currentCompanyRecord = saved;
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error loading current company', err);
            this.cdr.markForCheck();
          }
      });

    } else {
      console.log('currentCompanyRecord', this.currentCompanyRecord);
      const newCurrent: CurrentCompany = {
        userId: this.userId,
        companyId,
        createdDate: new Date()
      };

      this.currentCompanyService.createAsync(newCurrent).pipe(take(1)).subscribe({
        next: (saved) => {
          console.log('saved', saved);
          this.currentCompanyRecord = saved;
          this.cdr.markForCheck();
        }, error: (err) => {
            console.error('Error creating current company', err);
            this.cdr.markForCheck();
          }
      });
    }
  }

  override ngAfterViewInit() {
    this.changeDetectorRef.detectChanges();
    console.log('Companies:', this.dataItems);
  }

  override customUpdates(): void {
    this.initialLoading = false;
    if (this.dataItems.length >= this.totalItems) {
      console.log('✅ All items loaded, hasMore = false');
    }
  }

  editCompany(company: CompanyVersion): void {
    console.log('Editing company:', company);
    this.dialogHelper.openDialog(CompanyCreationModalComponent, (result: CompanyVersionDialogResult) => {
      if (result) {
        company.data = result.companyInfo;
        console.log('Before updateAsync', result, company._id);
        this.companyVersionService.updatePayloadAsync(company._id, result.companyInfo, true, result?.fileData, true)
          .pipe(take(1)).subscribe({
          next: (saved) => {
            console.log('saved', saved);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Company has been updated!" }
            });
            //this.companyVersionService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error updating company', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error updating company!" }
            });
            this.cdr.markForCheck();
          }
        });
      }
    }, { data: company });
  }

  deleteCompany(company: any) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete company with ID: ${company._id}`);
        this.companyVersionService.deleteAsync(company._id);
        this.dialog.open(NotificationWindowComponent, {
          data: { message: "Company has been deleted!" }
        });
        this.cdr.markForCheck();
      } else {
        console.log('Delete action was cancelled');
        this.cdr.markForCheck();
      }
    }
    this.dialogHelper.confirmationDialog(executeDelete);
  }

  async addCompany(): Promise<any> {
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
        /// subscribe
        this.companyVersionService.createPayloadAsync(companyVersion, true, result?.fileData, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('result', res);
            this.companyVersionService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error creating company', err);
            this.cdr.markForCheck();
          }
        });

        this.dialog.open(NotificationWindowComponent, {
          data: { message: "Company has been created!" }
        });
      }
    }, { panelClass: 'panel-class-dialog' });
  }
}