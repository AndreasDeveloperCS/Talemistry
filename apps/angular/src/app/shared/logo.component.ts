import { Component, Input } from '@angular/core'

@Component({
  selector: 'tal-logo',
  standalone: true,
  template: `
    <span class="logo" [style.gap.px]="8">
      <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="7" r="4" fill="var(--growth-green)" />
        <circle cx="7" cy="22" r="4" fill="var(--horizon-blue)" />
        <circle cx="25" cy="22" r="4" fill="var(--deep-navy)" />
        <path
          d="M16 9.5 L8.5 20 M16 9.5 L23.5 20 M9.5 22 L22.5 22"
          stroke="var(--insight-teal)"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>
      @if (showWord) {
        <span class="wordmark">Talemistry</span>
      }
    </span>
  `,
  styles: [
    `
      .logo {
        display: inline-flex;
        align-items: center;
      }
      .wordmark {
        font-weight: 700;
        font-size: 1.05rem;
        letter-spacing: -0.01em;
        color: var(--foreground);
      }
    `,
  ],
})
export class LogoComponent {
  @Input() size = 28
  @Input() showWord = true
}
