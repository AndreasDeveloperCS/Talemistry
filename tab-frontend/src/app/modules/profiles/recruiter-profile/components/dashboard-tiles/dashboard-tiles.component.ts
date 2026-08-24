import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard-tiles',
  templateUrl: './dashboard-tiles.component.html',
  styleUrl: './dashboard-tiles.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardTilesComponent implements OnInit {
  companiesCount = 0;
  positionsCount = 0;
  candidatesCount = 0;
  successCount = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.animateAllCount();
  }

  animateCount(property: CounterKey, target: number, duration = 1000): void {
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        this[property] = target;
        clearInterval(interval);
      } else {
        this[property] = Math.floor(current);
      }
      this.cdr.markForCheck();
    }, stepTime);
  }

  animateAllCount() {
    this.animateCount('companiesCount', 12);
    this.animateCount('positionsCount', 47);
    this.animateCount('candidatesCount', 1247);
    this.animateCount('successCount', 89);
  }
}

type CounterKey = 'companiesCount' | 'positionsCount' | 'candidatesCount' | 'successCount';