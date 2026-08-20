import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/** Mirrors components/ui/primitives.tsx's StatDelta (Next.js). */
@Component({
  selector: 'tm-stat-delta',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="tm-stat-delta" [class.positive]="value >= 0" [class.negative]="value < 0">
      {{ value >= 0 ? '▲' : '▼' }} {{ absValue }}%
    </span>
  `,
  styles: [
    `
      .tm-stat-delta {
        display: inline-flex;
        align-items: center;
        gap: 0.15rem;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .positive { color: var(--primary); }
      .negative { color: var(--destructive); }
    `,
  ],
})
export class TmStatDeltaComponent {
  @Input({ required: true }) value = 0;

  get absValue(): number {
    return Math.abs(this.value);
  }
}
