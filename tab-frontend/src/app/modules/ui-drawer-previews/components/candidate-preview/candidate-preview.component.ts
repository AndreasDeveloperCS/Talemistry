import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, EMPTY } from 'rxjs';
import { CandidateUserProfile } from 'src/app/modules/expertise/models/candidate-user-profile';
import { CandidateUserProfileService } from 'src/app/modules/expertise/services/candidate-user-profile.service';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { CopyToastService } from 'src/app/modules/general/services/copy-toast.service';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';

@Component({
  selector: 'app-candidate-preview',
  templateUrl: './candidate-preview.component.html',
  styleUrl: './candidate-preview.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidatePreviewComponent {
  @Input()
  talentId!: string;

  @Input() 
  candidateData!: any;

  profile!: CandidateUserProfile;
  isLoading: boolean = true;
  errorMessage: string = '';
  hardSkills: any[] = [];
  softSkills: any[] = [];
  languageSkills: any[] = [];
  domainSkills: any[] = [];
  managerialSkills: any[] = [];

  constructor(private candidateProfileService: CandidateUserProfileService,
    private uiInteractionService: UiInteractionService,
    private cdr: ChangeDetectorRef,
    private copyToastService: CopyToastService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    if(!this.talentId) {
      return;
    }
    this.candidateProfileService
      .getFullProfileById(this.talentId, true)
      .pipe(
        catchError((err) => {
          console.error('Profile load error', err);
          this.errorMessage = 'Unable to load candidate profile';
          this.isLoading = false;
          this.cdr.markForCheck();
          return EMPTY;
        })
      )
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.hardSkills = profile?.hardSkills || [];
          this.softSkills = profile?.softSkills || [];
          this.domainSkills = profile?.domainSkills || [];
          this.languageSkills = profile?.languagesSkills || [];
          this.managerialSkills = profile?.managerialSkills || [];
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  get lastRecord(): any {
    return this.candidateData?.records?.[this.candidateData.records.length - 1];
  }

  getLanguageLevel(proficiency: number): string {
    const levels = [
      'Beginner',
      'Elementary',
      'Intermediate',
      'Upper-Intermediate',
      'Advanced',
      'Professional',
      'Native'
    ];
    return levels[proficiency - 1] || 'Unknown';
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'passed':
        return 'status-success';
      case 'rejected':
        return 'status-danger';
      default:
        return 'status-pending';
    }
  }

  openApplicantChat(): void {
    if (!this.talentId) {
      return;
    }

    this.uiInteractionService.openDrawer({
      type: 'chat',
      payload: {
        contactId: this.talentId,
      },
      id: this.talentId,
    });
  }

  openInNewTab(): void {
    const url = this.candidateProfileService.getCandidateLink(this.talentId);
    window.open(url, '_blank');
  }

  copyLink(): void {
    const url = this.candidateProfileService.getCandidateLink(this.talentId);
    navigator.clipboard.writeText(url);
    this.copyToastService.show('Candidate link copied');
  }
}