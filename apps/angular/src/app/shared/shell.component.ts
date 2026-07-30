import { Component, signal } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { LogoComponent } from './logo.component'

interface NavItem {
  label: string
  path: string
  icon?: string
  stage?: string
}

@Component({
  selector: 'tal-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <div class="layout">
      <aside class="sidebar" [class.open]="open()">
        <div class="brand">
          <tal-logo [size]="30" [showEndorsement]="true" />
        </div>

        <nav>
          <p class="nav-label">Overview</p>
          @for (item of overview; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-item"
            >
              <span class="ico">{{ item.icon }}</span>{{ item.label }}
            </a>
          }

          <p class="nav-label">Talent Journey</p>
          @for (item of journey; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" class="nav-item">
              <span class="dot" [style.background]="item.stage"></span>{{ item.label }}
            </a>
          }
        </nav>

        <div class="footer-card">
          <p class="ff-title">Reveal the chemistry</p>
          <p class="ff-sub">Full-cycle talent acquisition, end to end.</p>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <button class="menu" (click)="open.set(!open())" aria-label="Toggle navigation">☰</button>
          <div class="search"><input placeholder="Search candidates, roles, skills…" /></div>
          <div class="top-actions">
            <span class="pill">Live</span>
            <span class="avatar">TA</span>
          </div>
        </header>
        <main class="content">
          <ng-content />
        </main>
      </div>
    </div>
  `,
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  open = signal(false)
  overview: NavItem[] = [
    { label: 'Command Center', path: 'dashboard', icon: '▦' },
    { label: 'Candidates', path: 'candidates', icon: '☺' },
    { label: 'Pipeline', path: 'pipeline', icon: '⋮⋮' },
  ]
  journey: NavItem[] = [
    { label: 'Discover & Attract', path: 'pipeline', stage: '#1E5AA8' },
    { label: 'Understand & Match', path: 'pipeline', stage: '#2E8B8B' },
    { label: 'Evaluate', path: 'pipeline', stage: '#C9822E' },
    { label: 'Decide & Offer', path: 'pipeline', stage: '#2FA84F' },
  ]
}
