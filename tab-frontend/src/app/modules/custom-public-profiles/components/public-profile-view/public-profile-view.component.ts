import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, EMPTY, Subject, take, takeUntil } from 'rxjs';
import { AuthService, convertRoleToRoute } from 'src/app/modules/authentication/services/auth.service';
import { AuthRedirectService } from 'src/app/modules/general/services/auth-redirect.service';
import { environment } from 'src/environments/environment';
import { CandidateUserProfile } from '../../../expertise/models/candidate-user-profile';
import { CandidateUserProfileService } from '../../../expertise/services/candidate-user-profile.service';
import { ContentService } from '../../../general/services/content.service';
import { UserProfileService } from '../../../profiles/user-profile/services/user-profile.service';
import { ProficiencyLevel, Skill } from '../../../skills/models/skill';

const PROFICIENCY_PERCENT: Record<ProficiencyLevel, number> = {
  [ProficiencyLevel.Beginner]: 15,
  [ProficiencyLevel.Intern]: 30,
  [ProficiencyLevel.Junior]: 45,
  [ProficiencyLevel.Regular]: 60,
  [ProficiencyLevel.Professional]: 75,
  [ProficiencyLevel.Expert]: 90,
  [ProficiencyLevel.Lead]: 100,
};

export interface RadarAxis {
  label: string;
  value: number;
}

export interface SkillRow {
  name: string;
  percent: number;
  verified: boolean;
}

@Component({
  selector: 'app-public-profile-view',
  templateUrl: './public-profile-view.component.html',
  styleUrl: './public-profile-view.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicProfileViewComponent {
  profile!: CandidateUserProfile;
  userId: string = '';
  currentRoute: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';
  
  protected _onDestroy = new Subject<void>();

  constructor(
    public service: CandidateUserProfileService,
    public userService: UserProfileService,
    private authService: AuthService,
    private authRedirect: AuthRedirectService,
    private activatedRoute: ActivatedRoute,
    public content: ContentService,
    private cdr: ChangeDetectorRef
  ) {
    this.service.restoreCacheIntoCurrentState();
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(take(1))
      .subscribe(params => {
        this.userId = params.get('userId') || '';
        //console.log('Current user ID:', this.userId);
        if (!this.userId) {
          return;
        }
        this.getUserInfo();
        this.cdr.markForCheck();
      });
  }
  
  getUserInfo() {
    this.service
      .getFullProfileById(this.userId, true)
      .pipe(
        takeUntil(this._onDestroy),
        catchError((err) => {
          console.log('Profile load error:', err);

          if (err.status === 403) {
            this.errorMessage = 'This profile is private and cannot be viewed.';
          } else if (err.status === 404) {
            this.errorMessage = 'Profile not found.';
          } else {
            this.errorMessage = 'Unable to load profile. Please try again later.';
          }

          this.isLoading = false;
          this.cdr.markForCheck();

          // 🔑 IMPORTANT: return a safe value so stream completes normally
          return EMPTY;
        })
      )
      .subscribe({
        next: (fullProfile: CandidateUserProfile) => {
          this.profile = fullProfile;
          this.cdr.markForCheck();
          this.isLoading = false;
        },
      });
  }

  getLanguageLevel(proficiency: number): string {
    const levels = [
      "Beginner",
      "Elementary",
      "Intermediate",
      "Upper-Intermediate",
      "Advanced",
      "Professional",
      "Native",
    ];
    return levels[proficiency - 1] || "Unknown";
  }

  formatDate(date: Date): string {
    return new Date(date).getFullYear().toString();
  }

  formatDateRange(start: Date, end: Date, isCurrent: any): string {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    const startFormatted = startDate.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const endFormatted = isCurrent
      ? 'Present'
      : endDate?.toLocaleString('en-US', {
          month: 'long',
          year: 'numeric'
        });

    return `${startFormatted} - ${endFormatted}`;
  }

  /** Radar chart geometry (SVG viewBox 0 0 200 200, centered at 100,100). */
  readonly radarSize = 200;
  readonly radarCenter = 100;
  readonly radarMaxRadius = 80;

  private avgProficiency(skills: { proficiencyEstimation: ProficiencyLevel }[]): number {
    if (!skills?.length) return 0;
    const total = skills.reduce((sum, s) => sum + (PROFICIENCY_PERCENT[s.proficiencyEstimation] ?? 0), 0);
    return Math.round(total / skills.length);
  }

  /** Candidate Formula: average proficiency per skill category, built from real profile data. */
  getFormulaAxes(): RadarAxis[] {
    if (!this.profile) return [];
    return [
      { label: 'Hard Skills', value: this.avgProficiency(this.profile.hardSkills ?? []) },
      { label: 'Domain Skills', value: this.avgProficiency(this.profile.domainSkills ?? []) },
      { label: 'Soft Skills', value: this.avgProficiency(this.profile.softSkills ?? []) },
      { label: 'Managerial Skills', value: this.avgProficiency(this.profile.managerialSkills ?? []) },
    ];
  }

  /** Polygon points for the radar shape, one vertex per axis, starting at the top. */
  getRadarPoints(axes: RadarAxis[]): string {
    const n = axes.length;
    if (!n) return '';
    return axes
      .map((axis, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = (Math.max(0, Math.min(100, axis.value)) / 100) * this.radarMaxRadius;
        const x = this.radarCenter + r * Math.cos(angle);
        const y = this.radarCenter + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  /** Label anchor point for each axis, just outside the max radius. */
  getRadarLabelPos(axes: RadarAxis[], index: number): { x: number; y: number } {
    const n = axes.length;
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = this.radarMaxRadius + 16;
    return {
      x: this.radarCenter + r * Math.cos(angle),
      y: this.radarCenter + r * Math.sin(angle),
    };
  }

  /** Flattened list of every skill across categories, real proficiency + verified flag. */
  private allSkillRows(): SkillRow[] {
    if (!this.profile) return [];
    const all = [
      ...(this.profile.hardSkills ?? []),
      ...(this.profile.domainSkills ?? []),
      ...(this.profile.softSkills ?? []),
      ...(this.profile.managerialSkills ?? []),
    ];
    return all.map((s) => ({
      name: s.skillName,
      percent: PROFICIENCY_PERCENT[s.proficiencyEstimation] ?? 0,
      verified: !!(s as Skill).isVerified,
    }));
  }

  /** Verified Skills panel: top 8 skills by proficiency. */
  getVerifiedSkills(): SkillRow[] {
    return [...this.allSkillRows()].sort((a, b) => b.percent - a.percent).slice(0, 8);
  }

  /** Potential Spectrum — "Demonstrated strengths" derived from Expert/Lead-level real skills. */
  getTopStrengths(): string[] {
    return this.allSkillRows()
      .filter((s) => s.percent >= 90)
      .map((s) => s.name)
      .slice(0, 5);
  }

  /** Potential Spectrum — "Development areas" derived from Beginner/Intern-level real skills. */
  getDevelopmentAreas(): string[] {
    return this.allSkillRows()
      .filter((s) => s.percent <= 30)
      .map((s) => s.name)
      .slice(0, 5);
  }

  contactCandidate(): void {
    if (!this.authRedirect.isAuthorized()) {
      this.authRedirect.handleUnauthorizedAction();
      return;
    }

    console.log('Opening contact dialog...');
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    if (!userId) {
      return;
    }
    const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`);
    if (!idToken) {
      return;
    }
    const decodedToken = this.authService.decodeJWTToken(idToken);
    const role = convertRoleToRoute(decodedToken.user.role);
    const url =
      `${environment.sourceUrl}/${role}/` +
      `${environment.routes.communication.communication}/` +
      `${environment.routes.communication.textChat}` +
      `?contactId=${this.profile.user._id}` +
      `&name=${encodeURIComponent(this.profile.user.firstname)}`;

    window.open(url, '_blank');
  }
}
