import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Injector, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { take, takeUntil } from 'rxjs';
import { AuthGuardService } from 'src/app/modules/authentication/guard/auth-guard.service';
import { CompanyVersionService } from 'src/app/modules/companies/services/company-version.service';
import { TableTemplateComponent } from 'src/app/modules/general/components/table-template/table-template.component';
import { BaseEntity, OwnerEntity, PositionEntity } from 'src/app/modules/general/models/base-entity';
import { Filtering, FilterRule, PaginatedResource, Sorting } from 'src/app/modules/general/services/search-logic.service';
import { FUNCTIONALBLOCK } from 'src/app/modules/permissions/models/functional-block-enum';
import { OpenPosition } from 'src/app/modules/positions/models/position';
import { PositionStatus } from 'src/app/modules/positions/models/position-details';
import { PositionsService } from 'src/app/modules/positions/services/positions.service';
import { environment } from 'src/environments/environment';
import { getPropertyName } from 'src/shared-functions/shared-functions';

@Component({
  selector: 'app-positions-panel',
  templateUrl: './positions-panel.component.html',
  styleUrl: './positions-panel.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionsPanelComponent extends TableTemplateComponent<OpenPosition>
  implements OnInit, AfterViewInit, OnDestroy {

  @Input() selectedPosition: OpenPosition | null = null;
  @Output() positionSelected = new EventEmitter<OpenPosition>();

  searchQuery: string = '';
  allStatusFilter: string = 'all';
  statusFilter: PositionStatus | string = PositionStatus.ACTIVE;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  override selectedPageSize: number = 10;
  initialLoading: boolean = true;
  override currentComponentName = this.constructor.name;
  statusOptions = Object.values(PositionStatus);
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';

  hasMore = true;
  loadingMore = false;

  public get canEditItems(): boolean {
    return this.authGuard.canEditItem(FUNCTIONALBLOCK.POSITIONS);
  }

  public override sorting: Sorting = {
    property: getPropertyName<BaseEntity>(e => e.createdDate),
    direction: 'DESC'
  };

  public override sortingProcessed: Sorting = {
    property: getPropertyName<BaseEntity>(e => e.createdDate),
    direction: "ASC"
  }

  getLocation(position: OpenPosition) {
    const locations = position?.positionDetails?.headquarterLocation;

    if (!locations) {
      return '';
    }

    return Array.isArray(locations)
      ? locations.map(loc => loc?.name).filter(name => name).join(', ')
      : '';
  }

  constructor(
    public positionsService: PositionsService,
    public authGuard: AuthGuardService,
    private cdr: ChangeDetectorRef,
    private companyService: CompanyVersionService,
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
    const statusFilter = {
      property: getPropertyName<PositionEntity>((e: PositionEntity) => e.status),
      rule: FilterRule.EQUALS,
      value: PositionStatus.ACTIVE
    };
    this.filtering.push(statusFilter);
    super.ngOnInit();
    this.cdr.markForCheck();
  }

  override ngAfterViewInit() {
    setTimeout(() => {
      this.changeDetectorRef.detectChanges();
      this.cdr.markForCheck();
    });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.scrollContainer?.nativeElement.removeEventListener('scroll', this.onScroll.bind(this));
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onScroll(): void {
    if (!this.hasMore || this.loadingMore) {
      return;
    }

    let threshold = 50;

    const container = this.scrollContainer.nativeElement;
    const scrollPosition = window.scrollY + window.innerHeight;
    const containerBottom = container.offsetTop + container.offsetHeight - threshold;

    if (scrollPosition > containerBottom && this.hasMore) {
      this.loadingMore = true;
      this.pageIndex++;
      this.loadMore();
    }
  }

  override getList(selectedPageSize: number, pageIndex: number, sorting: Sorting, filtering: Filtering) {

    if (!environment.production && environment.showDebugginLogs) {
      // console.log('getList', this.constructor.name, this.crudService.currentServiceName, this.currentComponentName);
    }

    this.positionsService.getAllAsyncForHr(selectedPageSize, pageIndex, sorting, filtering, true, false)
      .pipe(takeUntil(this._onDestroy))
      .subscribe(this.updateCollection.bind(this));
    this.changeDetectorRef.markForCheck();
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

  override reloadData() {
    this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
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
        if (this.dataItems.length > 0) {
          this.onSelectPosition(this.dataItems[0]);
        }
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

  onSelectPosition(position: OpenPosition): void {
    this.selectedPosition = position;
    this.positionSelected.emit(position);
  }

  getStatusClass(status: PositionStatus): string {
    switch (status) {
      case PositionStatus.ACTIVE:
        return 'badge-success';
      case PositionStatus.PAUSED:
        return 'badge-warning';
      case PositionStatus.CLOSED:
        return 'badge-muted';
      default:
        return '';
    }
  }

  formatDate(dateString: any): string {
    if (!dateString) {
      return '';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  onChangeStatusFilter() {
    console.log('onChangeStatusFilter', this.statusFilter);

    this.filtering = this.filtering.filter(
      f => f.property !== getPropertyName<PositionEntity>(e => e.status)
    );

    if (this.statusFilter !== this.allStatusFilter) {
      this.filtering.push({
        property: getPropertyName<PositionEntity>(e => e.status),
        rule: FilterRule.EQUALS,
        value: this.statusFilter
      });
    }

    this.pageIndex = 0;

    this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
  }

  onSearchChange(): void {
    console.log('Search query changed:', this.searchQuery);

    this.filtering = this.filtering.filter(
      f => f.property !== getPropertyName<PositionEntity>(e => e.title)
    );

    if (this.searchQuery?.trim()) {
      this.filtering.push({
        property: getPropertyName<PositionEntity>(e => e.title),
        rule: FilterRule.LIKE,
        value: this.searchQuery.trim()
      });
    }

    this.pageIndex = 0;

    this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
  }

  onNavigateToPositionPage(positionId: string, event: Event): void {
    event.stopPropagation();
    this.positionsService.openPositionPage(positionId);
  }

  onNavigateToCompanyPage(companyId: string, event: Event) {
    event.stopPropagation();
    if (companyId) {
      this.companyService.openCompanyPage(companyId);
    }
  }
}
