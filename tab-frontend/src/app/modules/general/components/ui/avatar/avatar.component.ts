import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** Mirrors components/ui/primitives.tsx's Avatar (Next.js). */
@Component({
  selector: 'tm-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="tm-avatar"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.fontSize.px]="size * 0.38"
      [style.backgroundColor]="src ? 'transparent' : tone"
    >
      @if (src) {
        <img [src]="src" [alt]="name" />
      } @else {
        {{ initials(name) }}
      }
    </span>
  `,
  styles: [
    `
      .tm-avatar {
        display: inline-flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 50%;
        font-weight: 600;
        color: #fff;
      }
      img {
        height: 100%;
        width: 100%;
        object-fit: cover;
      }
    `,
  ],
})
export class TmAvatarComponent {
  @Input({ required: true }) name!: string;
  @Input() src?: string;
  @Input() size = 36;
  @Input() tone = '#383c5b';

  initials = initials;
}
