import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

/** Mirrors components/ui/primitives.tsx's Card (Next.js). */
@Component({
  selector: 'tm-card',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  styles: [
    `
      :host {
        display: block;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
        background: var(--card);
        color: var(--card-foreground);
      }
    `,
  ],
})
export class TmCardComponent {}
