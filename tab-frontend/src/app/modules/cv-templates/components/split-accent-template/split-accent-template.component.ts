import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { formatDate,
  getLanguageProficiency,
  getEducationDegree,
} from '../../models/shared.types';
import { CandidateUserProfile } from 'src/app/modules/expertise/models/candidate-user-profile';
import { CvDataTemplateService } from '../../services/cv-data-template.service';
import { environment } from 'src/environments/environment';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { CandidateUserProfileService } from 'src/app/modules/expertise/services/candidate-user-profile.service';
import { CvPreviewService } from '../../services/cv-preview-state.service';
import { splitTextLines } from '../../utils/cv-text-functions';

@Component({
  selector: 'app-split-accent-template',
  templateUrl: './split-accent-template.component.html',
  styleUrl: './split-accent-template.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplitAccentTemplateComponent implements OnInit, OnDestroy {
  private _onDestroy = new Subject<void>();
  data!: CandidateUserProfile;
  userId: any = sessionStorage.getItem(`${environment.storage.userId}`);

  linkedIn: { platform: string; url: string } | undefined;
  website: { platform: string; url: string } | undefined;
  proficiencyLevels = [1, 2, 3, 4, 5, 6];

  constructor(private previewService: CvPreviewService,
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
      this.data = data;
      console.log('CV Data loaded:', this.data);  
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  formatDate(date: Date | string | undefined): string {
    return formatDate(date);
  }

  getLanguageProficiency(level: number): string {
    return getLanguageProficiency(level);
  }

  getEducationDegree(type: string): string {
    return getEducationDegree(type);
  }

  isCurrent(exp: any): boolean {
    return !exp.endWorkDate || new Date(exp.endWorkDate) > new Date();
  }

  splitTextLines(text: string | string[] | undefined): string[] {
    return splitTextLines(text);
  }
}
