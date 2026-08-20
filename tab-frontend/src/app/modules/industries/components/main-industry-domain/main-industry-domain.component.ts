import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { IndustryDomain } from '../../../industries/models/industry';
import { SearchLogicService, Sorting } from '../../../general/services/search-logic.service';
import { ContentService } from '../../../general/services/content.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { IndustryDomainService } from '../../../industries/services/industry-domains.service';
import { InputFilterBaseComponent } from '../../../general/components/input-filter-base/input-filter-base.component';
import { CompaniesService } from '../../../companies/services/companies.service';
import { CompanyVersionService } from '../../../companies/services/company-version.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-main-industry-domain',
  templateUrl: './main-industry-domain.component.html',
  styleUrl: './main-industry-domain.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainIndustryDomainComponent extends InputFilterBaseComponent<IndustryDomain> implements OnInit {
  @Input()
  selectedMainIndustryDomain: IndustryDomain | null = null;

  @Input()
  selectedIndustryCategories: IndustryDomain[] | null = null

  @Output() industryDomainChange = new EventEmitter<any>();

  override get populatedCollection() {
    return this.companyVersionService.model.industryCategories || [];
  }
  
  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<IndustryDomain>((e: IndustryDomain) => e.industryName), value: this.filterControl.value });
    return this._filterParams;
  }

  constructor(industryService: IndustryDomainService,
    protected companyService: CompaniesService,
    protected companyVersionService: CompanyVersionService,
    searchLogicService: SearchLogicService,
    changeDetectorRef: ChangeDetectorRef,
    public content: ContentService) {
    super(industryService, searchLogicService, changeDetectorRef);
  }

  async add(rawInput: string) {
    const input = rawInput?.trim();

    if (this.inputControl.valid) {
      const entity = new IndustryDomain();
      entity.industryName = input;
      entity.isVerified = false;

      const alreadyExists = this.companyVersionService.model.industryCategories?.some(
        (item) => item.industryName === input
      );

      if (!alreadyExists) {
        // console.log("VERIFIED this.inputControl: ", motivationalFactor);
        this.companyVersionService.model.industryCategories?.push(entity);

        this.industryDomainChange.emit(true);

        this.crudService.createAsync(entity, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Entity has been successfully created', res);
            this.crudService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error creating the entity', err);
            this.cdr.markForCheck();
          }
        })
      }
    }
    this.resetForm();
    this.cdr.markForCheck();
  }

  remove(item: IndustryDomain) {
    const targetIndex = this.companyVersionService.model.industryCategories?.findIndex(element => element.industryName == item.industryName) ?? -1;
    if (targetIndex >= 0) {
      this.companyVersionService.model.industryCategories?.splice(targetIndex, 1);
      this.industryDomainChange.emit(true);
    }
    this.cdr.markForCheck();
  }

  getValue(item: IndustryDomain) {
    return item.industryName;
  }

  getSubgroup(item: IndustryDomain) {
    return item.subgroups;
  }
} 
