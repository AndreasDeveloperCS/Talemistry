import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { ContentService } from '../../../general/services/content.service';
import { TalentPipelineProgressService } from '../../../position-management/services/talent-pipeline-progress.service';
import { environment } from '../../../../../environments/environment';
import { take } from 'rxjs';
import { IAppliedPosition } from '../../models/applied-positions-payloads';

@Component({
  selector: 'app-applied-positions-management',
  templateUrl: './applied-positions-management.component.html',
  styleUrl: './applied-positions-management.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppliedPositionsManagementComponent implements OnInit {
  isLoading: boolean = true;
  appliedPositions: IAppliedPosition[] = [];

  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';

  constructor(public content: ContentService,
    private talentPipelineProgressService: TalentPipelineProgressService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    if(this.userId) {
      this.talentPipelineProgressService.getAppliedPositionsByTalentId1(this.userId, true)
      .pipe(take(1)).subscribe({
        next: (res) => {
          console.log('In Angular zone?', NgZone.isInAngularZone());
          console.log('AppliedPositionsManagementComponent', res);
          if(res && res.length > 0) {
            this.appliedPositions = res;
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading data', err);
          this.cdr.markForCheck();
        },
      });
    }
  }
}
