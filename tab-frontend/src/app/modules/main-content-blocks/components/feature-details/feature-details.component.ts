import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FEATURE_DETAILS, FeatureDetail } from '../../models/feature-details.data';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-feature-details',
  standalone: false,
  templateUrl: './feature-details.component.html',
  styleUrl: './feature-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureDetailsComponent implements OnInit {
  feature: FeatureDetail | null = null
  chartData: any[] = []

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) { 
    window.scrollTo(0, 0);
  }

  ngOnInit(): void {
    const featureId = this.route.snapshot.paramMap.get("id");
    if (featureId) {
      this.feature = FEATURE_DETAILS.find((f) => f.id === featureId) || null;
      this.generateChartData();
    }
  }

  generateChartData(): void {
    if (this.feature) {
      this.chartData = this.feature.stats.map((stat) => ({
        name: stat.label,
        value: Number.parseFloat(stat.value.replace(/[^\d.]/g, "")),
        trend: stat.trend,
      }));
    }
  }

  goBack(): void {
    this.router.navigate(["/main"]);
  }

  startTrial(): void {
    console.log("Starting trial for:", this.feature?.title);
  }

  scheduleDemo(): void {
    this.router.navigate([environment.routes.scheduleDemo], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  onContactSales(): void {
    this.router.navigate([environment.routes.contactUs]);
  }
}
