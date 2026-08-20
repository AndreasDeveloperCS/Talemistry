import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, take, takeUntil } from 'rxjs';
import { PositionData } from '../../models/position-data';
import { PositionApplyFormComponent } from '../position-apply-form/position-apply-form.component';
import { ContentService } from '../../../general/services/content.service';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { PositionsService } from '../../services/positions.service';
import { FUNCTIONALBLOCK } from '../../../permissions/models/functional-block-enum';
import { OpenPosition } from '../../models/position';
import { environment } from '../../../../../environments/environment';
import { TalentPipelineProgressService } from 'src/app/modules/position-management/services/talent-pipeline-progress.service';

@Component({
  selector: 'app-position-description-full',
  templateUrl: './position-description-full.component.html',
  styleUrl: './position-description-full.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDescriptionFullComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  positionData!: PositionData;

  @Input()
  isAuthorised: boolean = false;
  
  @ViewChild('applyForm') applyForm!: PositionApplyFormComponent;

  protected _onDestroy = new Subject<void>();
  private positionId!: string;
  appliedPositionIds: string[] = [];
  hasAlreadyApplied = false;
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  isLoading: boolean = true;

  public get isAuthorizedInterview(): boolean {
    return this.authGuard.canEditItem(FUNCTIONALBLOCK.INTERVIEWS);
  }

  constructor(private router: Router,
    private activatedRoute: ActivatedRoute,
    public content: ContentService,
    private authGuard: AuthGuardService,
    private changeDetectorRef: ChangeDetectorRef,
    public service: PositionsService,
    private talentPipelineProgressService: TalentPipelineProgressService
  ) {  }

  ngAfterViewInit(): void {
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.activatedRoute.paramMap
      .pipe(takeUntil(this._onDestroy))
      .subscribe(params => {
        this.positionId = params.get('positionsId') || '';
        console.log('Current positionId ID:', this.positionId);
        if (!this.positionId) {
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
          return;
        }
        this.service
          .getByIdAsync(this.positionId)
          .pipe(take(1))
          .subscribe((result: OpenPosition) => {
            const position = result as OpenPosition;
            if (!position) {
              this.isLoading = false;
              this.changeDetectorRef.markForCheck();
              return;
            }

            this.positionData = new PositionData(position);
            this.isPositionAlreadyAppliedFor();
            console.log('positionData', this.positionData);
            this.isLoading = false;
            this.changeDetectorRef.markForCheck();
          });
      });

    window.scrollTo(0, 0);
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  isPositionAlreadyAppliedFor() {
    if (this.userId) {
      this.talentPipelineProgressService.getAppliedPositionIds(this.userId, true)
        .pipe(take(1))
        .subscribe({
          next: (ids) => {
            if(ids) {
              this.appliedPositionIds = ids;
              console.log('appliedPositionIds', this.appliedPositionIds);
              this.hasAlreadyApplied = ids.includes(this.positionId);
              console.log('hasAlreadyApplied', this.hasAlreadyApplied);
              this.isLoading = false;
              this.changeDetectorRef.markForCheck();
            }
          },
          error: (err) => {
            console.error('Error loading applied ids', err);
            this.isLoading = false;
            this.changeDetectorRef.markForCheck();
          }
        });
    }
  }

  scrollToApplyForm() {
    if (this.applyForm?.nativeElement) {
      const rect = this.applyForm.nativeElement.getBoundingClientRect();
      const offset = window.scrollY + rect.top - 50;

      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }

  navigateInterviewSession() {
    this.router.navigate([environment.routes.positions, this.positionData.position._id, 'interviews'], {
      state: {
        data: this.positionData.position._id,
      },
    });
  }

  onApplicationSubmitted(): void {
    this.hasAlreadyApplied = true;
    if (!this.appliedPositionIds.includes(this.positionId)) {
      this.appliedPositionIds.push(this.positionId);
    }
    this.changeDetectorRef.markForCheck();
  }
}
