import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/** Mirrors components/ui/primitives.tsx's Progress (Next.js). */
@Component({
  selector: 'tm-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="tm-progress-track"
      [style.backgroundColor]="track"
      role="progressbar"
      [attr.aria-valuenow]="clamped"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="tm-progress-bar" [style.width.%]="clamped" [style.backgroundColor]="color"></div>
    </div>
  `,
  styles: [
    `
      .tm-progress-track {
        height: 0.5rem;
        width: 100%;
        overflow: hidden;
        border-radius: 9999px;
      }
      .tm-progress-bar {
        height: 100%;
        border-radius: 9999px;
        transition: width 0.2s ease;
      }
    `,
  ],
})
export class TmProgressComponent {
  @Input({ required: true }) value = 0;
  @Input() color = 'var(--primary)';
  @Input() track = 'var(--muted)';

  get clamped(): number {
    return Math.max(0, Math.min(100, Math.round(this.value)));
  }
}
