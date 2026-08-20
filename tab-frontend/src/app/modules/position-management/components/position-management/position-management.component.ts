import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { take } from 'rxjs';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { OpenPosition } from '../../../positions/models/position';
import { environment } from '../../../../../environments/environment';
import { FUNCTIONALBLOCK } from '../../../permissions/models/functional-block-enum';
import { FilterRule, PaginatedResource, Sorting } from '../../../general/services/search-logic.service';
import { PositionsService } from '../../../positions/services/positions.service';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { OwnerEntity } from '../../../general/models/base-entity';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';

@Component({
  selector: 'app-position-management',
  templateUrl: './position-management.component.html',
  styleUrl: './position-management.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionManagementComponent
  extends TableTemplateComponent<OpenPosition> implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  override selectedPageSize: number = 8;
  initialLoading: boolean = true;
  override currentComponentName = this.constructor.name;

  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';

  hasMore = true;
  loadingMore = false;

  public get canEditItems(): boolean {
    return this.authGuard.canEditItem(FUNCTIONALBLOCK.POSITIONS);
  }

  public override sorting: Sorting = {
    property: 'createdDate',
    direction: "DESC"
  }

  public override sortingProcessed: Sorting = {
    property: 'createdDate',
    direction: "ASC"
  }

  constructor(
    public positionsService: PositionsService,
    public authGuard: AuthGuardService,
    private cdr: ChangeDetectorRef,
    injector: Injector
  ) {
    super(positionsService, injector);
  }

  override ngOnInit() {
    const mainFilter = {
      property: getPropertyName<OwnerEntity>((e: OwnerEntity) => e.userId),
      rule: FilterRule.EQUALS,
      value: `${sessionStorage.getItem(`${environment.storage.userId}`)?.toString()}`
    };
    this.filtering.push(mainFilter);
    super.ngOnInit();
    this.cdr.markForCheck();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!this.hasMore) {
      return;
    }

    let threshold = 100;

    const container = this.scrollContainer.nativeElement;
    const scrollPosition = window.scrollY + window.innerHeight;
    const containerBottom = container.offsetTop + container.offsetHeight - threshold;

    if (scrollPosition > containerBottom && this.hasMore) {
      this.loadingMore = true;
      this.pageIndex++;
      this.loadMore();
    }
  }

  loadMore(): void {
    this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
    this.cdr.markForCheck();
  }

  override additionalSubscriptions(): void {
    this.positionsService.refreshDataBehaviorSubject.pipe(take(1)).subscribe((flag: boolean) => {
      if (flag)
        this.reloadData();
    });
    this.cdr.markForCheck();
  }

  openCreatePositionDialog() {
    this.positionsService.openNewPosition();
  }

  checkPositionsQuantity() {
    return this.dataItems.length > 0;
  }

  onPositionsListUpdated(updated: any) {
    if (updated) {
      this.reloadData();
    }
  }

  override ngAfterViewInit() {
    setTimeout(() => {
      this.changeDetectorRef.detectChanges();
      this.cdr.markForCheck();
    });
  }

  override updateCollection(data: PaginatedResource<OpenPosition>) {
    console.log('data', data);
    try {
      if (!environment.production && !environment.showDebugginLogs) {
        console.log('Data Received:', data, this.dataSource, this.isNotEmptyEvent);
      }
      if (!this.dataSource || data === undefined || data.page === undefined || data.totalItems === undefined || data.items === undefined) {
        return;
      }
      this.isNotEmptyEvent.emit(data.items.length > 0);
      this.data = data;

      if (this.loadingMore) {
        this.dataItems = [...this.dataItems, ...data.items];
      } else {
        this.dataItems = data.items;
      }
      this.pageIndex = data.page;
      this.totalItems = this.data.totalItems;

      this.dataSource.data = this.data.items;

      this.dataSource.paginator = this.matPaginator;

      if (this.dataSource.paginator) {
        this.dataSource.paginator.length = this.totalItems;
      }

      this.sortingProcessed.direction = this.sorting.direction;
      this.sortingProcessed.property = this.sorting.property;

      this.customUpdates();
      this.cdr.markForCheck();
    } catch (ex) {
      if (!environment.production) {
        console.error('update users Collection', ex);
        this.cdr.markForCheck();
      }
    }
  }

  override customUpdates(): void {
    this.initialLoading = false;
    if (this.dataItems.length >= this.totalItems) {
      this.hasMore = false;
      console.log('✅ All items loaded, hasMore = false');
    }
    this.loadingMore = false;
    this.cdr.markForCheck();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.scrollContainer?.nativeElement.removeEventListener('scroll', this.onWindowScroll.bind(this));
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  statuses = ['Draft', 'Active', 'Paused', 'Closed'];
}
