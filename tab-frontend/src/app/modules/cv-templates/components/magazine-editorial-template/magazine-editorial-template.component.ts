import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { formatDate,
  getProficiencyLabel,
  getLanguageProficiency,
  getEducationDegree,
} from '../../models/shared.types';
import { CandidateUserProfile } from 'src/app/modules/expertise/models/candidate-user-profile';
import { CvDataTemplateService } from '../../services/cv-data-template.service';
import { ProficiencyLevel, UserOperationalExpirience } from 'src/app/modules/skills/models/skill';
import { environment } from 'src/environments/environment';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { CandidateUserProfileService } from 'src/app/modules/expertise/services/candidate-user-profile.service';
import { CvPreviewService } from '../../services/cv-preview-state.service';
import { PROFICIENCY_LABEL_BY_NUMBER } from '../../models/cv-data-template';
import { splitTextLines } from '../../utils/cv-text-functions';

@Component({
  selector: 'app-magazine-editorial-template',
  templateUrl: './magazine-editorial-template.component.html',
  styleUrl: './magazine-editorial-template.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MagazineEditorialTemplateComponent implements OnInit, OnDestroy {
  private _onDestroy = new Subject<void>();
  data!: CandidateUserProfile;
  userId: any = sessionStorage.getItem(`${environment.storage.userId}`);
  
  yearsExperience = 0;
  currentYear = new Date().getFullYear();
  
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
      this.yearsExperience = this.calculateYearsExperience(this.data.operationalExperience);
      console.log('CV Data loaded:', this.data);  
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private calculateYearsExperience(experiences: any[]): number {
    console.log('experiences', experiences);

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const DAYS_IN_YEAR = 365.25;

    const today = new Date();

    const totalDays = experiences.reduce((acc, exp) => {
      if (!exp.startWorkDate) return acc;

      const start = new Date(exp.startWorkDate);

      // ⭐ business rule: isCurrent overrides endWorkDate
      const end =
        exp.isCurrent || !exp.endWorkDate
          ? today
          : new Date(exp.endWorkDate);

      const diffDays = Math.max(0, (end.getTime() - start.getTime()) / MS_PER_DAY);

      return acc + diffDays;
    }, 0);

    return Math.round((totalDays / DAYS_IN_YEAR) * 10) / 10;
  }

  formatDate(date: Date | string | undefined): string {
    return formatDate(date);
  }

  getProficiencyLabel(level: number): string {
    return getProficiencyLabel(level);
  }

  getSkillLabelFromNumeric(level: number | any): ProficiencyLevel | '' {
    if(typeof level !== 'number') {
      return level;
    }
    return PROFICIENCY_LABEL_BY_NUMBER[level] ?? '';
  }

  getLanguageProficiency(level: number): string {
    return getLanguageProficiency(level);
  }

  getEducationDegree(type: string): string {
    return getEducationDegree(type);
  }

  getDateRange(exp: UserOperationalExpirience): string {
    return `${this.formatDate(exp.startWorkDate)} — ${this.formatDate(exp.endWorkDate)}`;
  }

  getDomainBarWidth(years: number): number {
    return Math.min((years / 10) * 100, 100);
  }

  get featuredExperience(): UserOperationalExpirience | null {
    return this.data.operationalExperience.length > 0
      ? this.data.operationalExperience[0]
      : null;
  }

  get otherExperience(): UserOperationalExpirience[] {
    return this.data.operationalExperience.slice(1);
  }

  getSocialIcon(platform: string): string {
    switch (platform.toLowerCase()) {
      case 'linkedin': return 'linkedin';
      case 'github': return 'code';
      default: return 'link';
    }
  }

  splitTextLines(text: string | string[] | undefined): string[] {
    return splitTextLines(text);
  }
}
