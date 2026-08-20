import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { fromEvent, Subject, take, takeUntil } from 'rxjs';
import { BaseEntity } from '../../models/base-entity';
import { CRUDService } from '../../services/crud.service';
import { Filtering, PaginatedResource, SearchLogicService, Sorting } from '../../services/search-logic.service';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { FormControl, Validators } from '@angular/forms';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';

@Component({
  selector: 'app-input-filter-base',
  templateUrl: './input-filter-base.component.html',
  styleUrl: './input-filter-base.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputFilterBaseComponent<T extends BaseEntity> implements OnInit, AfterViewChecked, AfterViewInit, OnDestroy {
  @ViewChild('searchInput')
  searchInput!: ElementRef;

  @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport;

  @ViewChild('matAutocomplete') matAutocomplete!: MatAutocomplete;
  @ViewChild('matAutocomplete', { read: ElementRef }) autoCompletePanel!: ElementRef;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger!: MatAutocompleteTrigger;

  @Input()
  private _populatedCollection: T[] = [];

  preventAutocompleteFlag: boolean = false;
  filterControl!: FormControl;
  inputControl!: FormControl;
  collection: T[] = [];
  filteredCollection: T[] = [];
  isOpen: boolean = false;

  isLoading: boolean = false;
  page: number = 0;
  totalItems: number = 0;
  pageSize: number = 10;

  rawInputlValue: string = '';

  filtering: Filtering = [];
  sorting: Sorting = {
    property: getPropertyName<T>((e: T) => e._id),
    direction: 'ASC'
  }

  protected _onDestroy = new Subject<void>();

  _filterParams: { column: string, value: any }[] = [];

  get filterParams(): { column: string, value: any }[] {
    return this._filterParams;
  }

  public get populatedCollection(): T[] {
    return this._populatedCollection;
  }
  public set populatedCollection(value: T[]) {
    this._populatedCollection = value;
  }

  constructor(protected crudService: CRUDService<T>,
    protected searchLogicService: SearchLogicService,
    protected cdr: ChangeDetectorRef,
  ) {
    this.filterControl = new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?!\s*$).+/),
    ]);
    this.inputControl = new FormControl("", [
      Validators.required,
      Validators.pattern(/^(?!\s*$).+/),
    ]);
  }

  ngOnInit(): void {
    this.populateCollection();
  }

  ngAfterViewInit() {
    this.searchInput?.nativeElement?.focus();
    this.cdr.detectChanges();
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onAutocompleteOpened() {
    setTimeout(() => {
      const panel = this.autocompleteTrigger.autocomplete.panel?.nativeElement;
      if (panel) {
        fromEvent(panel, 'scroll').pipe(takeUntil(this._onDestroy)).subscribe((event: any) => {
          if (panel.scrollTop + panel.clientHeight >= panel.scrollHeight) {
            this.loadMore();
            this.cdr.markForCheck();
          }
        });
      }
    }, 0);
  }

  filterCollectionItems() {
    this.filterControl.setValue(this.inputControl.value);
    this.applyLocalFilter();
  }

  select($eventValue: any) {
    // console.log('select', $eventValue);
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
        this.cdr.markForCheck();
      }
    });
    return false;
  }

  applyLocalFilter() {
    this.page = 0;
    this.populateFiltering();

    this.crudService
      .getAllAsync(5, this.page, this.sorting, this.filtering, true)
      .pipe(takeUntil(this._onDestroy))
      .subscribe((data: PaginatedResource<T>) => {
        if (!data) {
          return;
        }
        if (data.totalItems) {
          this.totalItems = data.totalItems;
          this.cdr.markForCheck();
        }

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
          this.cdr.markForCheck();
        }
      });
  }

  onScroll($event: any) {
    // console.log('onScroll', $event);
    const bottomReached = ($event.target.offsetHeight + $event.target.scrollTop) >= $event.target.scrollHeight * 0.95;
    if (bottomReached) {
      this.loadMore();
      this.cdr.markForCheck();
    }
  }

  isNextListPopulationAllowed() {
    return !this.isLoading || ((this.collection.length) <= this.totalItems && this.totalItems !== 0);
  }

  isFilterEmpty() {
    return this.filterControl?.value == "" && this.inputControl?.value == "";
  }

  loadMore() {
    if (!this.isNextListPopulationAllowed()) {
      return;
    }
    this.isLoading = true;
    this.page++;

    this.crudService.getAllAsync(this.pageSize, this.page, this.sorting, this.filtering, true)
      .pipe(take(1))
      .subscribe(this.updateCollection.bind(this));
    this.cdr.markForCheck();
  }

  populateCollection() {
    this.crudService
      .getAllAsync(this.pageSize, this.page, this.sorting, this.filtering, true, false)
      .pipe(take(1))
      .subscribe(this.updateCollection.bind(this));
    this.cdr.markForCheck();
  }

  updateCollection(data: PaginatedResource<T>) {
    if (!data) {
      return;
    }
    if (data.totalItems) {
      this.totalItems = data.totalItems;
      this.cdr.markForCheck();
    }

    if (data.items) {
      this.collection = this.collection.concat(...data.items.filter(item => !this.collection.find((element: T) => {
        return item._id == element._id;
      })));
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  resetForm() {
    this.rawInputlValue = '';
    this.cdr.markForCheck();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      if (this.filteredCollection.length === 0) {
        this.filteredCollection = this.collection;
      }
    } else {
      this.filteredCollection = [];
    }
    this.cdr.markForCheck();
  }
}
