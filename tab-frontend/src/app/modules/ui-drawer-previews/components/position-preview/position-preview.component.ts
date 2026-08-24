import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';
import { ROLES } from 'src/app/modules/authentication/models/roles';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { CopyToastService } from 'src/app/modules/general/services/copy-toast.service';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { OpenPosition } from 'src/app/modules/positions/models/position';
import { PositionSkill } from 'src/app/modules/positions/models/position-details';
import { PositionsService } from 'src/app/modules/positions/services/positions.service';
@Component({
  selector: 'app-position-preview',
  templateUrl: './position-preview.component.html',
  styleUrl: './position-preview.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionPreviewComponent implements OnInit {
  @Input()
  positionId!: string;

  position: OpenPosition = new OpenPosition();
  loading: boolean = true;
  isVisible: boolean = false;
  skills: PositionSkill[] = [];

  constructor(
    private positionsService: PositionsService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private uiInteractionService: UiInteractionService,
    private copyToastService: CopyToastService
  ) {
    const roles = this.authService.getRoles();
    console.log('Roles', roles);
    if(roles.includes(ROLES.HR) || roles.includes(ROLES.HM) || roles.includes(ROLES.RC)) {
      this.isVisible = true;
    }
  }

  ngOnInit(): void {
    this.loadPosition();
  }

  loadPosition(): void {
    this.positionsService
      .getByIdAsync(this.positionId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          console.log('Position Preview', res);
          if(res) {
            this.position = res;
            this.skills = [...this.position.positionDetails.requirements.positionSkills];
            this.loading = false;
            this.cdr.markForCheck();
          }
        }, 
        error: (error) => {
          console.error('Error Loading the position', error);
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  openCompany(): void {
    this.uiInteractionService.openDrawer({
      type: 'company',
      id: this.position.positionDetails.company._id
    });
  }

  openApplicants(): void {
    if(!this.isVisible) {
      return;
    }
    this.uiInteractionService.openDrawer({
      type: 'applicants',
      id: this.position._id,
      payload: {
        position: this.position
      }
    });
  }

  openInNewTab(): void {
    const url = this.positionsService.getPositionLink(this.position._id);
    window.open(url, '_blank');
  }

  copyLink(): void {
    const url = this.positionsService.getPositionLink(this.position._id);
    navigator.clipboard.writeText(url);
    this.copyToastService.show('Position link copied');
  }

  formatSectionContent(content?: string): string {
    if (!content) {
      return '';
    }

    return content
      .replace(/<h1\b[^>]*>/gi, '<h4>')
      .replace(/<\/h1>/gi, '</h4>')
      .replace(/<h2\b[^>]*>/gi, '<h4>')
      .replace(/<\/h2>/gi, '</h4>')
      .replace(/<h3\b[^>]*>/gi, '<h4>')
      .replace(/<\/h3>/gi, '</h4>');
  }
}