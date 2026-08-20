import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Subject, take } from 'rxjs';
import { PositionEntity } from 'src/app/modules/general/models/base-entity';
import { getPropertyName } from 'src/shared-functions/shared-functions';
import { environment } from '../../../../../environments/environment';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { Filter, Filtering, FilterRule, PaginatedResource, Sorting } from '../../../general/services/search-logic.service';
import { FUNCTIONALBLOCK } from '../../../permissions/models/functional-block-enum';
import { LayoutType, LayoutTypeIcons } from '../../models/layout-type';
import { OpenPosition } from '../../models/position';
import { PositionStatus } from '../../models/position-details';
import { PositionDialogHelperService } from '../../services/position-dialog.service';
import { PositionsLikedService } from '../../services/positions-liked.service';
import { PositionsService } from '../../services/positions.service';

@Component({
  selector: 'app-positions-list',
  templateUrl: './positions-list.component.html',
  styleUrl: './positions-list.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionsListComponent extends TableTemplateComponent<OpenPosition> implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('jobList') jobListRef?: ElementRef;

  override selectedPageSize: number = 10;
  override currentComponentName = this.constructor.name;
  private charIndex = 0;
  private isFocused = false;
  private typingInterval: any;
  public layoutTypes: LayoutType[] = [];
  public layoutType: typeof LayoutType = LayoutType;
  public layoutTypesIcons: LayoutTypeIcons[] = Object.values(LayoutTypeIcons);
  public layoutTypesIcon: typeof LayoutTypeIcons = LayoutTypeIcons;
  public fullLayoutTypes = LayoutType;
  selectedPosition!: OpenPosition;
  placeholderText: string = 'Discover the Best Match...';
  displayedPlaceholder: string = '';
  initialLoading: boolean = true;
  selectedLayoutType: LayoutType = LayoutType.tileView;
  hasMore: boolean = true;
  loadingMore: boolean = false;
  searchValue: string = '';
  private searchSubject = new Subject<string>();

  public override sorting: Sorting = {
    property: 'createdDate',
    direction: "DESC"
  }

  public override sortingProcessed: Sorting = {
    property: 'createdDate',
    direction: "ASC"
  }

  public get isAuthorised(): boolean {
    return this.authGuard.canCreateItems(FUNCTIONALBLOCK.POSITIONSLIKED);
  }

  public get canCreateItems(): boolean {
    return this.authGuard.canCreateItems(FUNCTIONALBLOCK.POSITIONS);
  }

  public get hasFullAccess(): boolean {
    return this.authGuard.hasFullAccess(FUNCTIONALBLOCK.POSITIONS);
  }

  constructor(
    public positionsService: PositionsService,
    public dialog: MatDialog,
    public authGuard: AuthGuardService,
    public dialogHelper: DialogHelperService,
    public positionDialogHelper: PositionDialogHelperService,
    private likePositionService: PositionsLikedService,
    injector: Injector
  ) {
    super(positionsService, injector);

    this.populateLayoutTypes();

    if (this.isAuthorised) {
      this.likePositionService.fetchLikedPositions();
    }
  }

  override ngOnInit(): void {
    const mainFilter = {
      property: getPropertyName<PositionEntity>((e: PositionEntity) => e.status),
      rule: FilterRule.EQUALS,
      value: PositionStatus.ACTIVE
    };
    this.filtering.push(mainFilter);
    this.searchSubject
    .pipe(
      debounceTime(400),
      distinctUntilChanged()
    )
    .subscribe((value: string) => {

      this.searchValue = value;

      this.pageIndex = 0;
      this.loadingMore = false;

      this.loadPositions();

    });
    super.ngOnInit();
  }
  
  override ngOnDestroy() {
    super.ngOnDestroy();
    this.scrollContainer?.nativeElement.removeEventListener('scroll', this.onWindowScroll.bind(this));
    this.jobListRef?.nativeElement.removeEventListener('scroll', this.onWindowScroll.bind(this));
    clearInterval(this.typingInterval);
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  loadPositions(): void {
    const filtering: Filtering = [...this.filtering];
    const search = this.searchValue?.trim();
    if (search) {
      filtering.push({
        property: getPropertyName<PositionEntity>((e) => e.title),
        rule: FilterRule.LIKE,
        value: search
      });
    }

    this.getList(this.selectedPageSize, this.pageIndex, this.sorting, filtering);
  }
  
  selectPosition(position: OpenPosition) {
    this.selectedPosition = position;
  }

  populateLayoutTypes() {
    const isProd = environment.production;
    const isWideScreen = window.innerWidth >= 1260;

    const allTypes = Object.values(LayoutType);

    this.layoutTypes = allTypes.filter((type) => {
      if (isProd && type === LayoutType.tableView) {
        return false;
      }
      if (!isWideScreen && type === LayoutType.tileView) {
        return false;
      }
      return true;
    });

    const allTypesIcons = Object.values(LayoutTypeIcons);

    this.layoutTypesIcons = allTypesIcons.filter((type) => {
      if (isProd && type === LayoutTypeIcons.tableView) {
        return false;
      }
      if (!isWideScreen && type === LayoutTypeIcons.tileView) {
        return false;
      }
      return true;
    });

    this.selectedLayoutType = isWideScreen ? LayoutType.tileView : LayoutType.shortView;
  }

  getRoleDescription(type: string): string {
    return type;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent): void {
    this.populateLayoutTypes();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (this.selectedLayoutType === this.layoutType.tileView) return;
    if (!this.scrollContainer || this.loadingMore || !this.hasMore) return;

    let threshold = 500;
    if (this.selectedLayoutType === this.layoutType.shortView) {
      threshold = 800;
    } else if (this.selectedLayoutType === this.layoutType.fullView) {
      threshold = 1600;
    }

    const container = this.scrollContainer.nativeElement;
    const scrollPosition = window.scrollY + window.innerHeight;
    const containerBottom = container.offsetTop + container.offsetHeight - threshold;

    if (scrollPosition > containerBottom && this.hasMore) {
      this.loadingMore = true;
      this.pageIndex++;
      this.loadMore();
    }
  }

  onJobListScroll(): void {
    if (!this.jobListRef || this.loadingMore || !this.hasMore) return;

    const element = this.jobListRef.nativeElement;
    const scrollThreshold = 200;

    const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (scrollBottom < scrollThreshold) {
      this.loadingMore = true;
      this.pageIndex++;
      this.loadMore();
    }
  }

  loadMore(): void {
    this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
    this.changeDetectorRef.markForCheck();
  }

  override additionalSubscriptions(): void {
    this.positionsService.refreshDataBehaviorSubject.pipe(take(1)).subscribe((flag: boolean) => {
      if (flag)
        this.reloadData();
      this.changeDetectorRef.markForCheck();
    });
  }

  openNewPosition() {
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
      this.changeDetectorRef.markForCheck();
    });
    this.startTyping();
  }

  startTyping() {
    this.clearTyping();

    this.typingInterval = setInterval(() => {
      if (this.isFocused) return;
      if (this.charIndex < this.placeholderText.length) {
        // Typing
        this.displayedPlaceholder += this.placeholderText.charAt(this.charIndex);
        this.charIndex++;
      } else {
        clearInterval(this.typingInterval);
        this.typingInterval = null;

        setTimeout(() => {
          if (!this.isFocused) {
            this.clearTyping();
            this.startTyping();
            this.changeDetectorRef.markForCheck();
          }
        }, 1500);
      }
      this.changeDetectorRef.markForCheck();
    }, 120);
  }

  onFocus() {
    this.isFocused = true;
    this.displayedPlaceholder = this.placeholderText;
  }

  onBlur() {
    this.isFocused = false;
    this.startTyping();
  }

  clearTyping() {
    clearInterval(this.typingInterval);
    this.typingInterval = null;
    this.displayedPlaceholder = '';
    this.charIndex = 0;
  }

  selectDefault(): boolean {
    if (!this.selectedPosition && this.dataItems?.length > 0) {
      this.selectedPosition = this.dataItems[0];
    }
    return true; // Ensures ngIf doesn't block rendering
  }

  protected override getList(selectedPageSize: number, pageIndex: number, sorting: Sorting, filtering: Filtering) {
    if (!this.hasFullAccess) {
      const newFilter = this.searchLogicService.getFilter('isVerified', true);

      if (newFilter && !filtering.some(item => item.property == newFilter.property && item.value == newFilter.value)) {
        this.filtering = this.filtering.filter((filter: Filter) => filter.property !== 'isVerified');
        filtering.push(newFilter);
      }
    }

    this.positionsService.getAllAsync(selectedPageSize, pageIndex, sorting, filtering, true, false)
      .pipe(take(1))
      .subscribe(this.updateCollection.bind(this));
    this.changeDetectorRef.markForCheck();
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

      if(this.loadingMore) {
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
      this.changeDetectorRef.markForCheck();
    } catch (ex) {
      if (!environment.production) {
        console.error('update users Collection', ex);
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
    this.changeDetectorRef.markForCheck();
  }
}
