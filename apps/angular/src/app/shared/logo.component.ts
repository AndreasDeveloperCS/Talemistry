import { Component, Input } from '@angular/core'

@Component({
  selector: 'tal-logo',
  standalone: true,
  template: `
    <span class="logo">
      <svg
        [attr.width]="size"
        [attr.height]="size"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <!-- Artistic cyclohexane ring: six vertices in chair-like hexagon -->
        <path
          d="M20 5 L32 12 L32 27 L20 34 L8 27 L8 12 Z"
          stroke="var(--insight-teal)"
          stroke-width="1.4"
          stroke-linejoin="round"
          opacity="0.55"
        />
        <!-- Bonds radiating to shared center (the 'chemistry') -->
        <path
          d="M20 20 L20 5 M20 20 L32 12 M20 20 L32 27 M20 20 L20 34 M20 20 L8 27 M20 20 L8 12"
          stroke="var(--growth-green)"
          stroke-width="1"
          stroke-linecap="round"
          opacity="0.35"
        />
        <!-- Carbon vertices -->
        <circle cx="20" cy="5" r="3" fill="var(--growth-green)" />
        <circle cx="32" cy="12" r="2.6" fill="var(--insight-teal)" />
        <circle cx="32" cy="27" r="2.6" fill="var(--horizon-blue)" />
        <circle cx="20" cy="34" r="3" fill="var(--growth-green)" />
        <circle cx="8" cy="27" r="2.6" fill="var(--horizon-blue)" />
        <circle cx="8" cy="12" r="2.6" fill="var(--insight-teal)" />
        <!-- Nucleus -->
        <circle cx="20" cy="20" r="3.4" fill="var(--deep-navy)" />
        <circle cx="20" cy="20" r="1.4" fill="var(--growth-green)" />
      </svg>
      @if (showWord) {
        <span class="words">
          <span class="wordmark">Talemistry</span>
          @if (showEndorsement) {
            <span class="endorsement">Nomado Innovations</span>
          }
        </span>
      }
    </span>
  `,
  styles: [
    `
      .logo {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .words {
        display: inline-flex;
        flex-direction: column;
        line-height: 1.05;
      }
      .wordmark {
        font-weight: 700;
        font-size: 1.05rem;
        letter-spacing: -0.01em;
        color: var(--foreground);
      }
      .endorsement {
        font-size: 0.62rem;
        font-weight: 500;
        letter-spacing: 0.02em;
        color: var(--muted-foreground);
      }
    `,
  ],
})
export class LogoComponent {
  @Input() size = 30
  @Input() showWord = true
  @Input() showEndorsement = false
}
