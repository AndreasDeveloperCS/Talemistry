import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { CompanyCreationModalShortComponent } from '../../../companies/components/company-creation-modal-short/company-creation-modal-short.component';
import { CompanyData, CompanyVersion } from '../../../companies/models/company';
import { CompanyVersionService } from '../../../companies/services/company-version.service';
import { DropDownFilterBaseComponent } from '../../../general/components/drop-down-filter-base/drop-down-filter-base.component';
import { NotificationWindowComponent } from '../../../general/dialogs/notification-window/notification-window.component';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { SearchLogicService } from '../../../general/services/search-logic.service';
import { PositionsService } from '../../../positions/services/positions.service';
import { CurrentCompanyService } from '../../../companies/services/current-company.service';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';

@Component({
  selector: 'app-position-details-company',
  templateUrl: './position-details-company.component.html',
  styleUrl: './position-details-company.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDetailsCompanyComponent extends DropDownFilterBaseComponent<CompanyVersion> {
  protected _onDestroy = new Subject<void>();
  override selectedItem: CompanyVersion = new CompanyVersion();
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  companyForm: FormGroup;
  selectedCompanyId: any;
  
  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<CompanyVersion>((e: CompanyVersion) => e.data.companyName), value: this.filterControl.value });
    return this._filterParams;
  }
  
  get selectedCompany() {
    return this.positionService.model.positionDetails.company;
  }

  set selectedCompany(value) {
    this.positionService.model.positionDetails.company = value;
    console.log('set company', value);
    //console.log('model', this.positionService.model.positionDetails.company);
  }
  
  constructor(public content: ContentService,
    searchLogicService: SearchLogicService,
    changeDetectorRef: ChangeDetectorRef,
    private companyVersionService: CompanyVersionService,
    public positionService: PositionsService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private currentCompanyService: CurrentCompanyService,
    public dialogHelper: DialogHelperService) {
    super(companyVersionService, changeDetectorRef, searchLogicService);

    this.positionService.modelUpdated$.pipe(take(1)).subscribe(() => {
      this.selectedCompany = this.positionService?.model?.positionDetails?.company;
      console.log('selectedCompany', this.selectedCompany);
      this.changeDetectorRef.markForCheck();
    });

    if(this.positionService?.model?.positionDetails?.company.data.companyName === "" || 
      this.positionService?.model?.positionDetails?.company.data.companyName === undefined 
    ) {
      this.loadCurrentCompany();
    }

    this.companyForm = this.formBuilder.group({
      company: [this.selectedCompany || '', [Validators.required, Validators.minLength(3)]],
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.positionService.modelUpdated$.pipe(takeUntil(this._onDestroy)).subscribe(() => {
      this.selectedCompany = this.positionService.model.positionDetails.company;
      this.changeDetectorRef.markForCheck();
    });
    this.companyForm.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((value: any) => {
        this.positionService.updateForm({
          company: value.company,
        });
        this.positionService.model.positionDetails.company = value.company;
        this.positionService.notifyUpdate();
        this.changeDetectorRef.markForCheck();
      });
  }
  
  override ngOnDestroy() {
    super.ngOnDestroy();
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  loadCurrentCompany() {
    this.currentCompanyService.getByUserIdAsync(this.userId, true).pipe(take(1)).subscribe({
      next: (currentCompanyInfo) => {
        console.log('currentCompanyInfo', currentCompanyInfo);
        this.changeDetectorRef.markForCheck();
        if (currentCompanyInfo && currentCompanyInfo.companyId) {
          this.selectedCompanyId = currentCompanyInfo.companyId;
          this.companyVersionService.getByIdAsync(currentCompanyInfo.companyId, true)
            .pipe(take(1)).subscribe({
              next: (currentCompany) => {
                console.log('currentCompanyVersion', currentCompany);
                this.selectedCompany = currentCompany;
                this.changeDetectorRef.markForCheck();
            }});
        } else {
          console.log('No currentCompanyIndex');
          this.changeDetectorRef.markForCheck();
        }
      },
      error: (err) => {
        console.error('Failed to load current company', err);
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  deleteCompany() {
    this.positionService.model.positionDetails.company = new CompanyVersion();
  }

  override select($event: any) {
    super.select($event);
    //console.log('select', $event);
    this.selectedItem = $event;
    this.selectedCompany = $event;
    this.positionService.notifyUpdate();
  }

  openAddNewCompany() {
    this.dialogHelper.openDialog(CompanyCreationModalShortComponent, (result: CompanyData) => {
      if (result) {
        const currentCurrency = this.companyVersionService.getDefaultCurrency();
        console.log('Default currency set to USD', result, currentCurrency);
        if (result) {
          result.currency = currentCurrency;
        }
        console.log('result', result);

        let companyVersion = new CompanyVersion();
        companyVersion.data = result;
        companyVersion.userId = this.userId;
        companyVersion.createdBy = this.userId;
        
        this.companyVersionService.createAsync(companyVersion, true, false)
          .pipe(take(1)).subscribe({
            next: (res) => {
              console.log("Company has been created!", res);
              this.dialog.open(NotificationWindowComponent, {
                data: { message: "Company has been created!" }
              });
              this.changeDetectorRef.markForCheck();
            }, error: (err) => {
              console.error("Error creating the company!", err);
              this.dialog.open(WarningsErrorsDialogComponent, {
                data: { message: "Error creating the company!" }
              });
              this.changeDetectorRef.markForCheck();
            }
          })
      }
    }, { panelClass: 'panel-class-dialog' });
  }
}
