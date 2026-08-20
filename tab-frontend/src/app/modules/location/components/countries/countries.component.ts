import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { DropDownFilterBaseComponent } from '../../../general/components/drop-down-filter-base/drop-down-filter-base.component';
import { ContentService } from '../../../general/services/content.service';
import { SearchLogicService, Sorting } from '../../../general/services/search-logic.service';
import { Country } from '../../models/country';
import { CountriesService } from '../../services/countries.service';

@Component({
  selector: 'app-countries',
  templateUrl: './countries.component.html',
  styleUrl: './countries.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountriesComponent extends DropDownFilterBaseComponent<Country> implements OnInit, OnDestroy {

  @Input()
  public set selectedCountry(value: Country | string | null) {
    if (value instanceof Country) {
      this.selectedItem = value;
    } else if (typeof value === 'string') {
      this.selectedItem.name = value;
    } else {
      this.selectedItem = new Country();
    }
    this.collection = this.collection
      .concat([this.selectedItem].filter((item: Country) => !this.collection.find((element: Country) => {
        return item.name == element.name;
      })));
    console.log('selectedCountry', value, this.selectedItem);
  }

  @Output() countryChange = new EventEmitter<any>();

  protected _onDestroy = new Subject<void>();
  override selectedItem = new Country();

  public get selectedCountry(): Country | string | null {
    return this.selectedItem;
  }

  constructor(crudService: CountriesService,
    searchLogicService: SearchLogicService,
    changeDetectorRef: ChangeDetectorRef,
    public content: ContentService) {
    super(crudService, changeDetectorRef, searchLogicService);
  }
  
  ngAfterContentChecked() {
    this.changeDetectorRef.detectChanges();
  }
  
  override ngOnDestroy() {
    super.ngOnDestroy();
    this._onDestroy.next();
    this._onDestroy.complete();
  }
  
  override select($eventValue: any): void {
    super.select($eventValue);
    this.countryChange.emit($eventValue);
    console.log('this.selectedItem', this.selectedItem);
  }

  getValue(item: Country) {
    return item.name;
  }

  override sorting: Sorting = {
    property: getPropertyName<Country>((e: Country) => e.name), direction: 'ASC'
  };

  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<Country>((e: Country) => e.name), value: this.filterControl.value });
    return this._filterParams;
  }
}
