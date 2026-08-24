import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';
import { ROLES } from 'src/app/modules/authentication/models/roles';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { BaseEntity, OwnerEntity, PositionEntity } from 'src/app/modules/general/models/base-entity';
import { Filtering, FilterRule, Sorting } from 'src/app/modules/general/services/search-logic.service';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { OpenPosition } from 'src/app/modules/positions/models/position';
import { PositionStatus } from 'src/app/modules/positions/models/position-details';
import { PositionsService } from 'src/app/modules/positions/services/positions.service';
import { PositionMatchResult } from 'src/app/modules/talent-dashboard/interfaces/position-match.interface';
import { environment } from 'src/environments/environment';
import { getPropertyName } from 'src/shared-functions/shared-functions';

@Component({
  selector: 'app-positions-list-preview',
  templateUrl: './positions-list-preview.component.html',
  styleUrl: './positions-list-preview.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionsListPreviewComponent {
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  selectedPageSize: number = 10;
  sorting: Sorting = {
    property: getPropertyName<BaseEntity>(e => e.createdDate),
    direction: 'DESC'
  };
  pageIndex: number = 0;
  searchValue = '';
  selectedStatus: PositionStatus | 'all' | string = PositionStatus.ACTIVE;
  isLoading: boolean = true;
  PositionStatus = PositionStatus;
  mode: 'recruiter' | 'talent' = 'recruiter';
  recruiterPositions: OpenPosition[] = [];
  talentPositions: PositionMatchResult[] = [];

  constructor(
    private positionsService: PositionsService,
    private cdr: ChangeDetectorRef,
    private uiInteractionService: UiInteractionService,
    private authService: AuthService
  ) {
    const roles = this.authService.getRoles();
    console.log('Roles', roles);
    if(roles.includes(ROLES.HR) || roles.includes(ROLES.HM) || roles.includes(ROLES.RC)) {
      this.mode = 'recruiter';
    } 
    else if(roles.includes(ROLES.TALENT)) {
      this.mode = 'talent';
    }
  }

  ngOnInit(): void {
    if (this.mode === 'talent') {
      this.loadTalentPositions();
    }
    if (this.mode === 'recruiter') {
      this.loadRecruiterPositions();
      return;
    }
  }

  loadTalentPositions(): void {
    if (!this.userId) {
      return;
    }
    this.isLoading = true;

    this.positionsService.getTopPositionMatches()
      .pipe(take(1))
      .subscribe({
        next: (res: PositionMatchResult[]) => {
          console.log('Top position matches', res);
          if (res.length) {
            this.talentPositions = res || [];
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Top position matches error', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadRecruiterPositions(): void {
    this.isLoading = true;
    const filters = this.buildFilters();
    this.positionsService.getAllAsyncForHr(this.selectedPageSize, this.pageIndex, this.sorting, filters, true, false)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          console.log('Recruitment funnels', res);
          if(res) {
            this.recruiterPositions = res?.items || [];
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading data', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private buildFilters(): Filtering {
    const filtering: Filtering = [];

    filtering.push({
      property: getPropertyName<OwnerEntity>((e) => e.userId),
      rule: FilterRule.EQUALS,
      value: this.userId
    });

    if (this.selectedStatus !== 'all') {
      filtering.push({
        property: getPropertyName<PositionEntity>((e) => e.status),
        rule: FilterRule.EQUALS,
        value: this.selectedStatus
      });
    }

    const search = this.searchValue?.trim();
    if (search) {
      filtering.push({
        property: getPropertyName<PositionEntity>((e) => e.title),
        rule: FilterRule.LIKE,
        value: search
      });
    }

    return filtering;
  }

  searchPositions(): void {
    this.pageIndex = 0;
    this.loadRecruiterPositions();
  }

  changeStatusFilter(status: PositionStatus | 'all'): void {
    this.selectedStatus = status;
    this.pageIndex = 0;
    this.loadRecruiterPositions();
  }

  getMatchBadgeClass(score: number): string {
    if (score >= 75) {
      return 'match-badge--high';
    }
    if (score >= 50) {
      return 'match-badge--medium';
    }
    return 'match-badge--low';
  }

  openPositionPreview(positionId: string): void {
    this.uiInteractionService.openDrawer({
      type: 'position',
      id: positionId
    });
  }

  openCompanyPreview(companyId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.uiInteractionService.openDrawer({
      type: 'company',
      id: companyId
    });
  }
}
