import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CandidateUserProfile } from '../../../expertise/models/candidate-user-profile';
import { CvDataTemplateService } from '../../services/cv-data-template.service';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { CvPreviewService } from '../../services/cv-preview-state.service';
import { CandidateUserProfileService } from 'src/app/modules/expertise/services/candidate-user-profile.service';
import { environment } from 'src/environments/environment';
import { splitTextLines } from '../../utils/cv-text-functions';

@Component({
  selector: 'app-timeline-professional-template',
  templateUrl: './timeline-professional-template.component.html',
  styleUrl: './timeline-professional-template.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineProfessionalTemplateComponent implements OnInit, OnDestroy {
  private _onDestroy = new Subject<void>();
  cvData!: CandidateUserProfile;
  userId: any = sessionStorage.getItem(`${environment.storage.userId}`);

  constructor(
    private previewService: CvPreviewService,
    public cvDataTemplateService: CvDataTemplateService,
    private talentProfileService: CandidateUserProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.previewService.mode$
    .pipe(
      takeUntil(this._onDestroy),
      switchMap(mode => {
        if (mode === 'user') {
          return this.talentProfileService.loadProfile(this.userId);
        }
        return of(this.cvDataTemplateService.getDefaultData());
      })
    )
    .subscribe(data => {
      this.cvData = data;
      console.log('CV Data loaded:', this.cvData);  
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  splitTextLines(text: string | string[] | undefined): string[] {
    return splitTextLines(text);
  }
}
