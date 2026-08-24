import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { DropDownFilterBaseComponent } from '../../../general/components/drop-down-filter-base/drop-down-filter-base.component';
import { ContentService } from '../../../general/services/content.service';
import { GetCurrecntIpService } from '../../../general/services/get-currecnt-ip.service';
import { SearchLogicService, Sorting } from '../../../general/services/search-logic.service';
import { Country } from '../../../location/models/country';
import { LocationsService } from '../../services/locations.service';
import { PositionsService } from '../../services/positions.service';

@Component({
  selector: 'app-position-details-location',
  templateUrl: './position-details-location.component.html',
  styleUrl: './position-details-location.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDetailsLocationComponent extends DropDownFilterBaseComponent<Country> implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  selectedCountry: Country = new Country();
  locationsList: Country[] = [];
  override selectedItem = new Country();
  
  override sorting: Sorting = {
    property: getPropertyName<Country>((e: Country) => e.name), direction: 'ASC'
  };

  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<Country>((e: Country) => e.name), value: this.filterControl.value });
    return this._filterParams;
  }
  
  constructor(crudService: LocationsService,
    searchLogicService: SearchLogicService,
    changeDetectorRef: ChangeDetectorRef,
    private currecntIpService: GetCurrecntIpService,
    public positionsService: PositionsService,
    public content: ContentService) {
    super(crudService, changeDetectorRef, searchLogicService);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.populateCollection();
    this.positionsService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.locationsList = this.positionsService.model.positionDetails.headquarterLocation;
        this.changeDetectorRef.markForCheck();
      });

    if(this.locationsList.length === 0) {
      this.currecntIpService.getCurrentInfoModel().pipe(takeUntil(this._onDestroy)).subscribe((info: any) => {
      this.add(info.country);
      this.changeDetectorRef.markForCheck();
    });
    }
  }
  
  override ngOnDestroy() {
    super.ngOnDestroy();
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  override select($eventValue: any): void {
    super.select($eventValue);
    this.selectedItem = $eventValue;
  }

  async add(rawInput: string) {
    const input = rawInput?.trim();
    this.rawInputlValue = '';
    this.selectedItem = new Country();

    if (this.filterControl.valid) {
      const positionLocation = new Country();
      positionLocation.name = input;
      const alreadyExists = this.locationsList?.some(
        (location) => location.name === input
      );

      if (!alreadyExists) {
        this.locationsList.push(positionLocation);
        this.positionsService.notifyUpdate();
      }
    }
  }

  remove(item: Country) {
    const index = this.locationsList.findIndex(l =>
      l.name === item.name
    );

    if (index !== -1) {
      this.locationsList.splice(index, 1);
    } else {
      console.warn('Skill not found:', item);
    }
    this.positionsService.notifyUpdate();
  }

  getValue(item: Country) {
    return item.name;
  }
}
