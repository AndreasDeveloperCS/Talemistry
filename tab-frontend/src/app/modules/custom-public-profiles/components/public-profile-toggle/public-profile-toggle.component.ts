import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { CandidateUserProfileService } from '../../../expertise/services/candidate-user-profile.service';

@Component({
  selector: 'app-public-profile-toggle',
  templateUrl: './public-profile-toggle.component.html',
  styleUrl: './public-profile-toggle.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicProfileToggleComponent {
  @Input()
  isPublic!: boolean;

  @Input()
  pseudonym: string = '';
  
  @Input()
  targetPosition: string = '';

  @Input()
  profileId: string = '';

  userId: any = sessionStorage.getItem(`${environment.storage.userId}`);
  qrCodeEndpointUrl: string = `${environment.sourceUrl}/${environment.routes.publicProfile}/${this.userId}`;

  constructor(private router: Router,
    public service: CandidateUserProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  syncToService() {
    this.service.model.pseudonym = this.pseudonym;
    this.service.model.targetPosition = this.targetPosition;
  }

  togglePublic(): void {
    if(this.profileId !== '') {
      this.service.patchAsync(
        this.profileId,
        { isPublic: this.isPublic },
        getPropertyName<{ isPublic: boolean }>((e) => e.isPublic),
        !this.isPublic,
        true,
        false
      ).pipe(take(1)).subscribe({
        next: (res) => {
          console.log('Public profile status updated:', res);
          this.isPublic = !this.isPublic;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error updating public profile status:', err);
          this.cdr.markForCheck();
        }
      });
    }
  }

  viewPublicPage(): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree([
        environment.routes.talentTab.publicProfile,
        this.userId,
      ])
    );

    window.open(url, '_blank');
  }
}
