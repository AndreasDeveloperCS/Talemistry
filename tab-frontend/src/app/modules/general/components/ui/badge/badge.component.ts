import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type BadgeTone = 'neutral' | 'green' | 'teal' | 'violet' | 'navy' | 'red' | 'copper' | 'amber';

/** Mirrors components/ui/primitives.tsx's Badge (Next.js) — 8 status tones. */
@Component({
  selector: 'tm-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="tm-badge" [class]="'tm-badge--' + tone"><ng-content></ng-content></span>`,
  styles: [
    `
      .tm-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        border-radius: 9999px;
        padding: 0.125rem 0.625rem;
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
      }
      .tm-badge--neutral { background: var(--badge-neutral-bg); color: var(--badge-neutral-fg); }
      .tm-badge--green { background: var(--badge-green-bg); color: var(--badge-green-fg); }
      .tm-badge--teal { background: var(--badge-teal-bg); color: var(--badge-teal-fg); }
      .tm-badge--violet { background: var(--badge-violet-bg); color: var(--badge-violet-fg); }
      .tm-badge--navy { background: var(--badge-navy-bg); color: var(--badge-navy-fg); }
      .tm-badge--red { background: var(--badge-red-bg); color: var(--badge-red-fg); }
      .tm-badge--copper { background: var(--badge-copper-bg); color: var(--badge-copper-fg); }
      .tm-badge--amber { background: var(--badge-amber-bg); color: var(--badge-amber-fg); }
    `,
  ],
})
export class TmBadgeComponent {
  @Input() tone: BadgeTone = 'neutral';
}
