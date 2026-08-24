import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CandidateUserProfile } from 'src/app/modules/expertise/models/candidate-user-profile';
import {
  formatDate,
  getEducationDegree,
  getLanguageProficiency,
  getProficiencyLabel,
  getShortProficiencyLabel,
} from '../../models/shared.types';
import { CvDataTemplateService } from '../../services/cv-data-template.service';
import { PROFICIENCY_LABEL_BY_NUMBER } from '../../models/cv-data-template';
import { ProficiencyLevel } from 'src/app/modules/skills/models/skill';
import { environment } from 'src/environments/environment';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { CvPreviewService } from '../../services/cv-preview-state.service';
import { CandidateUserProfileService } from 'src/app/modules/expertise/services/candidate-user-profile.service';
import { splitTextLines } from '../../utils/cv-text-functions';

@Component({
  selector: 'app-hexagon-tech-template',
  templateUrl: './hexagon-tech-template.component.html',
  styleUrl: './hexagon-tech-template.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HexagonTechTemplateComponent implements OnInit, OnDestroy {
  private _onDestroy = new Subject<void>();
  data!: CandidateUserProfile;
  userId: any = sessionStorage.getItem(`${environment.storage.userId}`);
  
  linkedIn: { platform: string; url: string } | undefined;
  website: { platform: string; url: string } | undefined;
  
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

  getProficiencyLabel(level: number): string {
    return getProficiencyLabel(level);
  }

  getShortLabel(level: number): string {
    return getShortProficiencyLabel(level);
  }

  getLanguageProficiency(level: number): string {
    return getLanguageProficiency(level);
  }

  getEducationDegree(type: string): string {
    return getEducationDegree(type);
  }

  getSkillLabelFromNumeric(level: number | any): ProficiencyLevel | '' {
    if(typeof level !== 'number') {
      return level;
    }
    return PROFICIENCY_LABEL_BY_NUMBER[level] ?? '';
  }

  getLanguageBarWidth(level: number): number {
    return (level / 6) * 100;
  }

  isCurrent(exp: any): boolean {
    return !exp.endWorkDate || new Date(exp.endWorkDate) > new Date();
  }

  splitTextLines(text: string | string[] | undefined): string[] {
    return splitTextLines(text);
  }
}
