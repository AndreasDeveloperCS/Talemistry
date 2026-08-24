import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dark';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/** Mirrors components/ui/primitives.tsx's Button (Next.js). */
@Component({
  selector: 'tm-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="tm-btn"
      [class]="'tm-btn--' + variant + ' tm-btn--' + size"
      [disabled]="disabled"
      [type]="type"
    >
      <ng-content></ng-content>
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class TmButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
}
