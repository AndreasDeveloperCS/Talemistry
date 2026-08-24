import { moveItemInArray } from '@angular/cdk/drag-drop';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Injector, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { BaseEntity } from '../../models/base-entity';
import { ContentService } from '../../services/content.service';
import { CRUDService } from '../../services/crud.service';
import { Filter, Filtering, PaginatedResource, SearchLogicService, Sorting } from '../../services/search-logic.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-table-template',
  templateUrl: './table-template.component.html',
  styleUrl: './table-template.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableTemplateComponent<T extends BaseEntity> implements OnInit, AfterViewInit, OnDestroy {

  protected changeDetectorRef: ChangeDetectorRef;
  protected searchLogicService: SearchLogicService;
  public content: ContentService;

  public currentComponentName: string = this.constructor.name;

  private sortingSubject = new Subject<{ property: string, direction: string }>();

  @ViewChild('paginator')
  public paginator!: MatPaginator;

  @ViewChild('matSort')
  public sort!: MatSort;

  protected _onDestroy = new Subject<void>();

  @ViewChild(MatPaginator)
  set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
  }

  get matSorting(): MatSort {
    return this.dataSource.sort ?? this.sort
  }

  @ViewChild(MatSort)
  set matSorting(ms: MatSort) {

    this.sort = ms;
    this.dataSource.sort = this.sort;
  }

  pageSizes = [5, 10, 20, 25, 50, 100, 200];

  private _pageIndex: number = 0;
  private _totalItems: number = 0;

  public get pageIndex(): number {
    return this._pageIndex;
  }

  public set pageIndex(value: number) {
    this._pageIndex = value;
  }

  public data!: PaginatedResource<T>;

  public get totalItems(): number {
    return this._totalItems;
  }

  public set totalItems(value: number) {
    this._totalItems = value;
  }

  @Output()
  isNotEmptyEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  dataItems: T[] = [];

  get isNotEmpty(): boolean {
    return this.dataItems?.length > 0;
  }

  filtering: Filtering = [];

  sorting!: Sorting;

  sortingProcessed!: Sorting;

  public filter: string = '';

  public selectedPageSize: number = 10;

  constructor(public crudService: CRUDService<T>,
    protected injector: Injector) {

    this.changeDetectorRef = injector.get(ChangeDetectorRef);
    this.searchLogicService = injector.get(SearchLogicService);
    this.content = injector.get(ContentService);

    this.crudService.refreshDataBehaviorSubject.asObservable()
      .pipe(takeUntil(this._onDestroy))
      .subscribe((flag: boolean) => {
        // console.log('refreshDataBehaviorSubject', flag);
        if (flag)
          this.reloadData();
      });
      this.changeDetectorRef.markForCheck();
  }

  public displayedColumns: string[] = [];

  public headerNames: Map<string, string> = new Map<string, string>([]);

  private _dataSource: MatTableDataSource<T, MatPaginator> = new MatTableDataSource<T, MatPaginator>();
  public get dataSource(): MatTableDataSource<T, MatPaginator> {
    return this._dataSource;
  }
  public set dataSource(value: MatTableDataSource<T, MatPaginator>) {
    this._dataSource = value;
  }

  protected columnSorting: Map<string, number> = new Map<string, number>([]);

  updateCollection(data: PaginatedResource<T>) {
    console.log('updateCollection', data);
    try {
      if (!environment.production && !environment.showDebugginLogs) {
        console.log('Data Received:', data, this.dataSource, this.isNotEmptyEvent);
      }

      if (!this.dataSource || data === undefined || data.page === undefined || data.totalItems === undefined || data.items === undefined) {
        return;
      }
      this.isNotEmptyEvent.emit(data.items.length > 0);
      this.data = data;

      this.dataItems = data.items;
      this.pageIndex = data.page;
      this.totalItems = this.data.totalItems;

      this.dataSource.data = this.data.items;
      this.dataSource.paginator = this.matPaginator;

      if (this.dataSource.paginator) {
        this.dataSource.paginator.length = this.totalItems;
      }

      this.populateDropDownLists();

      this.sortingProcessed.direction = this.sorting.direction;
      this.sortingProcessed.property = this.sorting.property;
      //this.totalItems = this.data.totalItems;
      this.changeDetectorRef.markForCheck();
      this.customUpdates();
    } catch (ex) {
      if (!environment.production) {
        console.error('update users Collection', ex);
      }
      this.changeDetectorRef.markForCheck();
    }
  }

  customUpdates() {

  }

  populateDropDownLists() {

  }

  load(dataSource: any) {
    if (!environment.production && environment.showDebugginLogs) {
      // console.log('load', dataSource);
    }
  }

  manualSortingHandle(sorting: Sorting) {
    if (!environment.production && environment.showDebugginLogs) {
      console.log('manualSortingHandle', this.sorting, this.sortingProcessed);
    }

    this.getList(this.selectedPageSize, this.pageIndex, sorting, this.filtering);
  }

  manualHandleSort(column: any) {
    this.sorting['property'] = column;
    this.sorting['direction'] = this.sorting['direction'] == 'DESC' ? 'ASC' : 'DESC';
    this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
  }

  getValue(rowValue: any, column: any) {
    return rowValue[column];
  }

  ngOnInit(): void {

    window.scrollTo(0, 0);
    this.additionalSubscriptions();

    this.sortingSubject.pipe(
      debounceTime(300), // Adjust the debounce time as needed
      //distinctUntilChanged((prev, curr) => prev.property === curr.property && prev.direction === curr.direction)
    ).pipe(takeUntil(this._onDestroy)).subscribe((sorting: Sorting) => {
      try {
        if (!environment.production && environment.showDebugginLogs) {
          // console.log('sortingSubject', sorting, this.sortingProcessed);
        }

        if (sorting.direction != this.sortingProcessed.direction || sorting.property != this.sortingProcessed.property) {
          this.manualSortingHandle(sorting);
        }
        this.changeDetectorRef.markForCheck();
      } catch (ex) {
        console.error(ex);
        this.changeDetectorRef.markForCheck();
      }
    });

    this.dataSource.sortingDataAccessor = (item: any, property: any) => {
      this.manualSorting(property);
      //  this.sorting['property'] = property;
      //  this.sorting['direction'] = this.dataSource.sort?.direction ?? 'DESC';

      this.sortingSubject.next(this.sorting);

      return item[property];
    };

    this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  additionalSubscriptions() {

  }

  manualSorting(property: string) {
    this.sorting['property'] = property;
    this.sorting['direction'] = this.dataSource.sort?.direction ?? 'DESC';
  }

  drop(event: any) {
    moveItemInArray(this.displayedColumns, event.previousIndex, event.currentIndex);
  }

  protected applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.changeDetectorRef.markForCheck();
  }

  reloadData() {
    this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
  }

  protected getServerData($event: PageEvent | any) {
    this.selectedPageSize = $event.pageSize;
    this.getList($event.pageSize, $event.pageIndex, this.sorting, this.filtering);
    this.changeDetectorRef.markForCheck();
  }

  protected getList(selectedPageSize: number, pageIndex: number, sorting: Sorting, filtering: Filtering) {

    if (!environment.production && environment.showDebugginLogs) {
      // console.log('getList', this.constructor.name, this.crudService.currentServiceName, this.currentComponentName);
    }

    this.crudService.getAllAsync(selectedPageSize, pageIndex, sorting, filtering, true, false)
      .pipe(takeUntil(this._onDestroy))
      .subscribe(this.updateCollection.bind(this));
    this.changeDetectorRef.markForCheck();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.dataSource.paginator) {
        this.dataSource.paginator.length = this.totalItems;
      }
      this.changeDetectorRef.detectChanges();
    }, 0);
  }

  applyLocalFilter($event: any, column: string) {
    // console.log('applyLocalFilter', $event, column);

    const filterValue = ($event.target as HTMLInputElement).value;

    this.filtering = this.filtering.filter((filter: Filter) => filter.property !== column);

    if (filterValue != undefined && filterValue != null && filterValue != "" && filterValue != "All") {
      const newFilter = this.searchLogicService.getFilter(column, filterValue);

      if (newFilter)
        this.filtering.push(newFilter);

      this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
    } else {
      if (!environment.production && environment.showDebugginLogs) {
        // console.log('applyLocalFilter', this.constructor.name, this.crudService.currentServiceName);
      }

      this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
    }
    this.changeDetectorRef.markForCheck();
  }
}
