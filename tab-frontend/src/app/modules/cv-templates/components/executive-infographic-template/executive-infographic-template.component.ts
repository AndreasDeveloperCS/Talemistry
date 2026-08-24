import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CandidateUserProfile } from 'src/app/modules/expertise/models/candidate-user-profile';
import { ProficiencyLevel } from 'src/app/modules/skills/models/skill';
import { MAX_PROFICIENCY_LEVEL, PROFICIENCY_LABEL_BY_NUMBER, PROFICIENCY_ORDER } from '../../models/cv-data-template';
import { formatDate, getEducationDegree, getLanguageProficiency, getProficiencyLabel } from '../../models/shared.types';
import { CvDataTemplateService } from '../../services/cv-data-template.service';
import { environment } from 'src/environments/environment';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { CvPreviewService } from '../../services/cv-preview-state.service';
import { CandidateUserProfileService } from 'src/app/modules/expertise/services/candidate-user-profile.service';
import { resolveNumericLevel, splitTextLines } from '../../utils/cv-text-functions';

@Component({
  selector: 'app-executive-infographic-template',
  templateUrl: './executive-infographic-template.component.html',
  styleUrl: './executive-infographic-template.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExecutiveInfographicTemplateComponent implements OnInit, OnDestroy {
  private _onDestroy = new Subject<void>();
  data!: CandidateUserProfile;
  userId: any = sessionStorage.getItem(`${environment.storage.userId}`);
  
  constructor(private previewService: CvPreviewService,
    public cvDataTemplateService: CvDataTemplateService,
    private talentProfileService: CandidateUserProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  yearsExperience = 0;
  totalAchievements = 0;

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
      this.calculateMetrics();
      console.log('CV Data loaded:', this.data);  
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private calculateMetrics(): void {
    this.yearsExperience = this.calculateYearsExperience(this.data.operationalExperience);

    this.totalAchievements = this.data.operationalExperience.reduce(
      (acc, exp) => acc + (this.splitTextLines(exp.achievements)?.length || 0),
      0
    );
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

  getLanguageProficiencyShort(level: number): string {
    return getLanguageProficiency(level).slice(0, 3);
  }

  getEducationDegree(type: string): string {
    return getEducationDegree(type);
  }

  getSkillPercentage(level: ProficiencyLevel | number | string): number {
    const numericLevel = resolveNumericLevel(level);
    return (numericLevel / MAX_PROFICIENCY_LEVEL) * 100;
  }

  getLanguageCircumference(): number {
    return 2 * Math.PI * 36;
  }

  getLanguageStrokeDashoffset(level: number): number {
    const percentage = (level / 6) * 100;
    const circumference = this.getLanguageCircumference();
    return circumference - (percentage / 100) * circumference;
  }

  isCurrent(exp: any): boolean {
    return !exp.endWorkDate || new Date(exp.endWorkDate) > new Date();
  }

  splitTextLines(text: string | string[] | undefined): string[] {
    return splitTextLines(text);
  }
}
