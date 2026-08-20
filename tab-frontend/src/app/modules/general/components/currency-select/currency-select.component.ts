import { AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Currency } from '../../models/currency';
import { Subject, takeUntil } from 'rxjs';
import { ContentService } from '../../services/content.service';
import { PaginatedResource, SearchLogicService, Sorting } from '../../services/search-logic.service';
import { DropDownFilterBaseComponent } from '../drop-down-filter-base/drop-down-filter-base.component';
import { CurrenciesService } from '../../services/currencies.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { CandidateUserProfileService } from 'src/app/modules/expertise/services/candidate-user-profile.service';

@Component({
  selector: 'app-currency-select',
  templateUrl: './currency-select.component.html',
  styleUrl: './currency-select.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurrencySelectComponent
  extends DropDownFilterBaseComponent<Currency>
  implements OnInit, OnDestroy, AfterContentChecked {
    
  @Input() 
  predefinedCurrency: any;

  @Output() currencyChange = new EventEmitter<any>();
  
  protected _onDestroy = new Subject<void>();

  override selectedItem = new Currency();

  override sorting: Sorting = {
    property: getPropertyName<Currency>((e: Currency) => e.name), direction: 'ASC'
  };

  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<Currency>((e: Currency) => e.name), value: this.filterControl.value });
    return this._filterParams;
  }

  constructor(public content: ContentService,
    searchLogicService: SearchLogicService,
    changeDetectorRef: ChangeDetectorRef,
    private currenciesService: CurrenciesService,
    public service: CandidateUserProfileService) {
    super(currenciesService, changeDetectorRef, searchLogicService);
  }

  ngAfterContentChecked() {
    this.changeDetectorRef.detectChanges();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  override setDefaultValue() {
    const newFilter = this.searchLogicService.getFilter('code', 'USD');

    this.currenciesService
      .getAllAsync(this.pageSize, this.page, this.sorting, [newFilter], true, false)
      .pipe(takeUntil(this._onDestroy))
      .subscribe((data: PaginatedResource<Currency>) => {
        if (data.items) {

          if (this.predefinedCurrency) {
            this.collection.push(this.predefinedCurrency);
            this.selectedItem = this.predefinedCurrency;
            this.currencyChange.emit(this.selectedItem);
            this.changeDetectorRef.markForCheck();
          } else {

            const targetCurrency = data.items.filter((item: Currency) => item.code == "USD");
            if (targetCurrency.length > 0 && !this.collection.includes(targetCurrency[0])) {
              this.collection.push(targetCurrency[0]);
            }
            if (targetCurrency.length > 0 && !this.selectedItem._id) {

              this.selectedItem = targetCurrency[0];
              this.currencyChange.emit(this.selectedItem);
            }
            console.log('this.selectedItem', this.selectedItem);
            this.changeDetectorRef.markForCheck();
          }
        }
      });
  }

  override select($eventValue: any): void {
    super.select($eventValue);
    this.currencyChange.emit($eventValue);
  }

  trackOption(index: number, option: Currency): any {
    return option.code || option._id || index;
  }
}
