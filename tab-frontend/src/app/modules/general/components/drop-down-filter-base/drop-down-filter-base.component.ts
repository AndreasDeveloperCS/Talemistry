import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, Subscription, take, takeUntil } from 'rxjs';
import { BaseEntity } from '../../models/base-entity';
import { CRUDService } from '../../services/crud.service';
import { Filtering, PaginatedResource, SearchLogicService, Sorting } from '../../services/search-logic.service';
import { MatSelect } from '@angular/material/select';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';

@Component({
  selector: 'app-drop-down-filter-base',
  templateUrl: './drop-down-filter-base.component.html',
  styleUrl: './drop-down-filter-base.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropDownFilterBaseComponent<T extends BaseEntity> implements OnInit,
  AfterViewInit,
  OnDestroy {

  @ViewChild(MatSelect) matSelect!: MatSelect;

  openedChangeSubscription!: Subscription;
  protected _destroy = new Subject<void>();
  rawInputlValue: string = '';
  
  sorting: Sorting = {
    property: getPropertyName<T>((e: T) => e._id),
    direction: 'ASC'
  }

  filtering: Filtering = [];
  isLoading: boolean = false;
  page: number = 0;
  totalItems: number = 0;
  pageSize: number = 10;
  collection: T[] = [];
  selectedItem!: T;
  filterControl = new FormControl('', []);
  _filterParams: { column: string, value: any }[] = [];

  get filterParams(): { column: string, value: any }[] {
    return this._filterParams;
  }

  constructor(public crudService: CRUDService<T>,
    protected changeDetectorRef: ChangeDetectorRef,
    public searchLogicService: SearchLogicService) {
  }

  ngOnInit(): void {
    this.populateCollection();
    this.setDefaultValue();
  }

  ngAfterViewInit() {
    this.openedChangeSubscription = this.matSelect.openedChange.pipe(takeUntil(this._destroy)).subscribe((opened) => {
      if (opened) {
        setTimeout(() => {
          const panel = document.querySelector('.mat-select-panel') as HTMLElement;
          if (panel) {
            panel.addEventListener('scroll', this.onScroll.bind(this));
            this.changeDetectorRef.detectChanges();
          }
          this.changeDetectorRef.markForCheck();
        });
      }
      this.changeDetectorRef.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._destroy.next();
    this._destroy.complete();
  }

  resetForm() {
    this.rawInputlValue = '';
  }

  select($eventValue: any) {
    console.log('select', $eventValue);
  }

  trackById(index: number, item: T): any {
    return item._id;
  }

  populateFiltering(): boolean {
    const filterParams = this.filterParams;
    this.filtering.splice(0, this.filtering.length);
    filterParams.forEach((filterParam) => {
      const newFilter = this.searchLogicService.getFilter(filterParam.column, filterParam.value);
      if (newFilter) {
        this.filtering.push(newFilter);
      }
    });
    return false;
  }

  applyLocalFilter() {
    this.page = 0;
    this.populateFiltering();

    this.crudService
      .getAllAsync(5, this.page, this.sorting, this.filtering, true)
      .pipe(take(1))
      .subscribe((data: PaginatedResource<T>) => {

        if (data.totalItems) {
          this.totalItems = data.totalItems;
        }
        console.log(data);

        if (data.items) {
          this.collection = this.collection
            .concat(...data.items.filter((item: T) => !this.collection.find((element: T) => {
              return item._id == element._id;
            })));

          this.collection = this.collection
            .filter((item: T) => data.items?.some((element: T) => {
              return item._id == element._id;
            }));

          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  onScroll($event: any) {
    const target = $event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const offsetHeight = target.offsetHeight;
    const bottomReached = (offsetHeight + scrollTop) >= scrollHeight * 0.95;
    if (bottomReached) {
      this.loadMore();
    }
  }

  isNextListPopulationAllowed() {
    return this.isLoading || (this.collection.length >= this.totalItems && this.totalItems !== 0);
  }

  loadMore() {
    if (this.isNextListPopulationAllowed()) {
      return;
    }

    this.isLoading = true;
    this.page++;

    this.crudService.getAllAsync(10, this.page, this.sorting, this.filtering, true)
      .pipe(take(1))
      .subscribe(this.updateCollection.bind(this));
      this.changeDetectorRef.markForCheck();
  }

  populateCollection() {
    this.crudService
      .getAllAsync(this.pageSize, this.page, this.sorting, this.filtering, true, false)
      .pipe(take(1))
      .subscribe(this.updateCollection.bind(this));
    this.changeDetectorRef.markForCheck();
  }

  setDefaultValue() { }

  updateCollection(data: PaginatedResource<T>) {
    if (!data) {
      return;
    }
    if (data && data.totalItems) {
      this.totalItems = data.totalItems;
      this.changeDetectorRef.markForCheck();
    }

    if (data.items) {
      this.collection = this.collection.concat(...data.items.filter(item => !this.collection.find((element: T) => {
        return item._id == element._id;
      })));
      this.isLoading = false;
      this.changeDetectorRef.markForCheck();
    }
  }
}
