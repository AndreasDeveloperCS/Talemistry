import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';
import { CompanyVersion } from 'src/app/modules/companies/models/company';
import { CompanyVersionService } from 'src/app/modules/companies/services/company-version.service';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { BaseEntity, OwnerEntity } from 'src/app/modules/general/models/base-entity';
import { CopyToastService } from 'src/app/modules/general/services/copy-toast.service';
import { Filtering, FilterRule, Sorting } from 'src/app/modules/general/services/search-logic.service';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { OpenPosition } from 'src/app/modules/positions/models/position';
import { PositionsService } from 'src/app/modules/positions/services/positions.service';
import { environment } from 'src/environments/environment';
import { getPropertyName } from 'src/shared-functions/shared-functions';

@Component({
  selector: 'app-company-preview',
  templateUrl: './company-preview.component.html',
  styleUrl: './company-preview.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyPreviewComponent implements OnInit {
  @Input()
  companyId!: string;

  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  company: CompanyVersion = new CompanyVersion();
  loading: boolean = true;
  positions: OpenPosition[] = [];
  selectedPageSize: number = 10;
  sorting: Sorting = {
    property: getPropertyName<BaseEntity>(e => e.createdDate),
    direction: 'DESC'
  };
  filtering: Filtering = [];
  pageIndex: number = 0;

  constructor(
    private companyService: CompanyVersionService,
    private positionsService: PositionsService,
    private cdr: ChangeDetectorRef,
    private uiInteractionService: UiInteractionService,
    private copyToastService: CopyToastService,
  ) {}

  ngOnInit(): void {
    this.loadCompany();
    this.loadPositions();
  }

  loadCompany(): void {
    if(this.companyId) {
      this.companyService
        .getByIdAsync(this.companyId)
        .pipe(take(1))
        .subscribe({
          next: (res) => {
            console.log('Company Preview', res);
            if(res) {
              this.company = res;
              this.loading = false;
              this.cdr.markForCheck();
            }
          }, 
          error: (error) => {
            console.error('Error Loading the company', error);
            this.loading = false;
            this.cdr.markForCheck();
          }
        });
    }
  }

  loadPositions(): void {
    if(this.companyId) {
      const companyIdFilter = {
        property: 'positionDetails.company._id',
        rule: FilterRule.EQUALS,
        value: this.companyId.toString(),
      };

      // const ownerFilter = {
      //   property: getPropertyName<OwnerEntity>((e) => e.userId),
      //   rule: FilterRule.EQUALS,
      //   value: this.userId
      // };

      this.filtering = [companyIdFilter];

      this.positionsService
        .getAllAsync(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering, true, false)
        .pipe(take(1))
        .subscribe({
          next: (res) => {
            console.log('Positions for the company');
            if(res?.items) {
              this.positions = res.items;
            }
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error Loading the positions', error);
            this.loading = false;
            this.cdr.markForCheck();
          }
        });
    }
  }

  openPosition(positionId: string): void {
    this.uiInteractionService.openDrawer({
      type: 'position',
      id: positionId
    });
  }

  openInNewTab(): void {
    const url = this.companyService.getCompanyLink(this.company?._id);
    window.open(url, '_blank');
  }

  copyLink(): void {
    const url = this.companyService.getCompanyLink(this.company?._id);
    navigator.clipboard.writeText(url);
    this.copyToastService.show('Company link copied');
  }
}