import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { DropDownFilterBaseComponent } from '../../../general/components/drop-down-filter-base/drop-down-filter-base.component';
import { ContentService } from '../../../general/services/content.service';
import { SearchLogicService, Sorting } from '../../../general/services/search-logic.service';
import { City } from '../../models/city';
import { CitiesService } from '../../services/cities.service';
import { Country } from '../../models/country';

@Component({
  selector: 'app-cities',
  templateUrl: './cities.component.html',
  styleUrl: './cities.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CitiesComponent extends DropDownFilterBaseComponent<City> implements OnInit, OnDestroy {

  @Input()
  public set selectedCity(value: City | string | null) {
    if (value instanceof City) {
      this.selectedItem = value;
    } else if (typeof value === 'string') {
      this.selectedItem.name = value;
    }
    this.collection = this.collection
      .concat([this.selectedItem].filter((item: City) => !this.collection.find((element: City) => {
        return item.name == element.name;
      })));
    console.log('selectedCity', value, this.selectedItem);
  }

  @Input()
  public set selectedCountry(value: Country | string | null) {
    if (value instanceof Country) {
      this.selectedItem.country = value.code;
    } else if (typeof value === 'string') {
      this.selectedItem.country = value;
    }
  }

  @Output() cityChange = new EventEmitter<any>();

  override selectedItem = new City();

  public get selectedCity(): City | string | null {
    return this.selectedItem;
  }

  private _selectedCountry: Country | string | null = null;
  public get selectedCountry(): Country | string | null {
    return this._selectedCountry;
  }

  protected _onDestroy = new Subject<void>();

  constructor(crudService: CitiesService,
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
    this.cityChange.emit($eventValue);
    console.log('this.selectedItem', this.selectedItem);
  }

  getValue(item: City) {
    return item.name;
  }

  override sorting: Sorting = {
    property: getPropertyName<City>((e: City) => e.name), direction: 'ASC'
  };

  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<City>((e: City) => e.name), value: this.filterControl.value });
    return this._filterParams;
  }
}
