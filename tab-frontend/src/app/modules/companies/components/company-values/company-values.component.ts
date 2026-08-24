import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CompanyValue } from '../../models/company-values';
import { InputFilterBaseComponent } from '../../../general/components/input-filter-base/input-filter-base.component';
import { CompanyValuesService } from '../../services/company-values';
import { CompanyVersionService } from '../../services/company-version.service';
import { SearchLogicService } from '../../../general/services/search-logic.service';
import { ContentService } from '../../../general/services/content.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';

@Component({
  selector: 'app-company-values',
  templateUrl: './company-values.component.html',
  styleUrl: './company-values.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyValuesComponent extends InputFilterBaseComponent<CompanyValue> implements OnInit {
  @Input()
  selectedCompanyValue: CompanyValue | null = null;

  @Output() companyValueChange = new EventEmitter<any>();

  constructor(companyValuesService: CompanyValuesService,
    protected companyVersionService: CompanyVersionService,
    searchLogicService: SearchLogicService,
    changeDetectorRef: ChangeDetectorRef,
    public content: ContentService) {
    super(companyValuesService, searchLogicService, changeDetectorRef);
  }

  async add(rawInput: string) {
    const input = rawInput?.trim();

    if (this.inputControl.valid) {
      const entity = new CompanyValue();
      entity.value = input;
      entity.isVerified = false;

      const alreadyExists = this.companyVersionService.model.companyValues?.some(
        (item) => item.value === input
      );

      if (!alreadyExists) {
        this.companyVersionService.model.companyValues?.push(entity);

        this.companyValueChange.emit(true);

        this.crudService.createAsync(entity, true, false);
      }
    }
    this.resetForm();
    this.cdr.markForCheck();
  }

  remove(item: CompanyValue) {
    const targetIndex = this.companyVersionService.model.companyValues?.findIndex(element => element.value == item.value) ?? -1;
    if (targetIndex >= 0) {
      this.companyVersionService.model.companyValues?.splice(targetIndex, 1);
      this.companyValueChange.emit(true);
    }
    this.cdr.markForCheck();
  }

  override get populatedCollection() {
    return this.companyVersionService.model.companyValues || [];
  }

  getValue(item: CompanyValue) {
    return item.value;
  }

  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<CompanyValue>((e: CompanyValue) => e.value), value: this.filterControl.value });
    return this._filterParams;
  }
}
