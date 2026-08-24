import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { InputFilterBaseComponent } from '../../../general/components/input-filter-base/input-filter-base.component';
import { CompanyBenefit } from '../../models/company-benefits';
import { CompanyBenefitsService } from '../../services/company-benefits';
import { CompanyVersionService } from '../../services/company-version.service';
import { SearchLogicService } from '../../../general/services/search-logic.service';
import { ContentService } from '../../../general/services/content.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { take } from 'rxjs';

@Component({
  selector: 'app-company-benefits',
  templateUrl: './company-benefits.component.html',
  styleUrl: './company-benefits.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyBenefitsComponent extends InputFilterBaseComponent<CompanyBenefit> implements OnInit {
  @Input()
  selectedCompanyBenefits: CompanyBenefit | null = null;

  @Output() companyBenefitChange = new EventEmitter<any>();

  constructor(companyBenefitsService: CompanyBenefitsService,
    protected companyVersionService: CompanyVersionService,
    searchLogicService: SearchLogicService,
    changeDetectorRef: ChangeDetectorRef,
    public content: ContentService) {
    super(companyBenefitsService, searchLogicService, changeDetectorRef);
  }

  async add(rawInput: string) {
    const input = rawInput?.trim();

    if (this.inputControl.valid) {
      const entity = new CompanyBenefit();
      entity.benefit = input;
      entity.isVerified = false;


      const alreadyExists = this.companyVersionService.model.companyBenefits?.some(
        (item) => item.benefit === input
      );

      if (!alreadyExists) {
        this.companyVersionService.model.companyBenefits?.push(entity);
        this.companyBenefitChange.emit(true);
        this.crudService.createAsync(entity, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('New CompanyBenefit was created', res);
          }, error: (err) => {
            console.error('Error', err);
          }
        });
      }
    }
    this.cdr.markForCheck();
    this.resetForm();
  }

  remove(item: CompanyBenefit) {
    const targetIndex = this.companyVersionService.model.companyBenefits?.findIndex(element => element.benefit == item.benefit) ?? -1;
    if (targetIndex >= 0) {
      this.companyVersionService.model.companyBenefits?.splice(targetIndex, 1);
      this.companyBenefitChange.emit(true);
    }
    this.cdr.markForCheck();
  }

  override get populatedCollection() {
    return this.companyVersionService.model.companyBenefits || [];
  }

  getValue(item: CompanyBenefit) {
    return item.benefit;
  }

  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<CompanyBenefit>((e: CompanyBenefit) => e.benefit), value: this.filterControl.value });
    return this._filterParams;
  }
}
