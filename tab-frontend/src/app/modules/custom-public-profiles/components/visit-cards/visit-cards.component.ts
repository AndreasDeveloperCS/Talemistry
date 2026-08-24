import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TemplateColor } from '../../../cv-templates/models/cv-template-color.enum';
import { CandidateUserProfileService } from '../../../expertise/services/candidate-user-profile.service';
import { VisitCardPdfService } from '../../services/visit-card-pdf.service';

@Component({
  selector: 'app-visit-cards',
  templateUrl: './visit-cards.component.html',
  styleUrl: './visit-cards.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisitCardsComponent {
  userId: any = sessionStorage.getItem(`${environment.storage.userId}`);
  qrCodeEndpointUrl: string = `${environment.sourceUrl}/${environment.routes.publicProfile}/${this.userId}`;
  TemplateColor = TemplateColor;

  selectedColor: TemplateColor = TemplateColor.DarkBlue;
  colorOptions = Object.values(TemplateColor);

  profile = {
    firstName: 'John',
    lastName: 'Doe',
    targetPosition: 'Frontend Developer',
    email: 'john.doe@email.com',
    phone: '+1 234 567 890',
  };

  constructor(public service: CandidateUserProfileService,
    private visitCardPdfService: VisitCardPdfService,
  ) {}

  selectColor(color: TemplateColor) {
    this.selectedColor = color;
  }

  downloadVisitCards(): void {
    console.log('downloadVisitCards');
    this.visitCardPdfService.downloadVisitCardsPdf(this.userId, this.selectedColor, true)
      .pipe(take(1)).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `visit-cards.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error loading data', err);
      },
    });
  }
}
