import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Feature } from '../../models/feature';
import { FEATURES } from '../../models/feature.data';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-hr-recruitment-cards',
  standalone: false,
  templateUrl: './hr-recruitment-cards.component.html',
  styleUrl: './hr-recruitment-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrRecruitmentCardsComponent {
  features: Feature[] = FEATURES

  constructor(private router: Router) { }

  onLearnMore(feature: Feature): void {
    const featureId = feature.title.toLowerCase().replace(/\s+/g, "-")
    this.router.navigate(["/features", featureId])
  }

  onStartTrial(): void {
    console.log("Start free trial clicked");
  }

  onScheduleDemo(): void {
    this.router.navigate([environment.routes.scheduleDemo], {
      queryParams: { returnUrl: this.router.url }
    });
  }
}
