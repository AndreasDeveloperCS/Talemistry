import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { switchMap } from 'rxjs/operators'
import { ApiService } from '../core/api.service'

@Component({
  selector: 'tal-candidate-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (candidate(); as c) {
      <a routerLink="/candidates" class="back">← Back to candidates</a>

      <header class="profile-head card">
        <span class="avatar" [style.background]="c.avatarTone">{{ initials(c.name) }}</span>
        <div class="ph-info">
          <h1>{{ c.name }}</h1>
          <p class="ph-title">{{ c.title }}</p>
          <p class="ph-meta">{{ c.location }} · Work style: <strong>{{ c.workStyleType }}</strong></p>
          <div class="tags">
            @for (t of c.tags; track t) {
              <span class="tag">{{ t }}</span>
            }
          </div>
        </div>
        <div class="chem">
          <svg viewBox="0 0 120 120" width="110" height="110">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--muted)" stroke-width="12" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--growth-green)"
              stroke-width="12"
              stroke-linecap="round"
              [attr.stroke-dasharray]="circ"
              [attr.stroke-dashoffset]="circ - (circ * c.chemistryMatch) / 100"
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="58" text-anchor="middle" class="chem-num">{{ c.chemistryMatch }}%</text>
            <text x="60" y="76" text-anchor="middle" class="chem-lbl">Chemistry</text>
          </svg>
        </div>
      </header>

      <div class="grid">
        <section class="card">
          <h2>Candidate Formula</h2>
          <p class="card-sub">The blend of talent elements that make this person tick.</p>
          <div class="elements">
            @for (e of c.elements; track e.name) {
              <div class="el-row">
                <span class="el-name">{{ e.name }}</span>
                <div class="el-track">
                  <div class="el-bar" [style.width.%]="e.score"></div>
                </div>
                <span class="el-score">{{ e.score }}</span>
              </div>
            }
          </div>
        </section>

        <section class="card">
          <h2>Team Chemistry</h2>
          <p class="card-sub">Work-style spectrums — no single answer is “better”.</p>
          <div class="axes">
            @for (a of c.workStyle; track a.key) {
              <div class="axis">
                <div class="axis-ends">
                  <span>{{ a.left }}</span><span>{{ a.right }}</span>
                </div>
                <div class="axis-track">
                  <div class="axis-node" [style.left.%]="a.value"></div>
                </div>
              </div>
            }
          </div>
        </section>

        <section class="card skills-card">
          <h2>Verified Skills</h2>
          <p class="card-sub">Signals confirmed through assessment or supervised interview.</p>
          <div class="skills">
            @for (s of c.skills; track s.name) {
              <div class="skill">
                <div class="sk-head">
                  <span class="sk-name">
                    {{ s.name }}
                    @if (s.verified) {
                      <span class="verified" title="Verified">✓</span>
                    }
                  </span>
                  <span class="sk-level">{{ s.level }}</span>
                </div>
                <div class="sk-track">
                  <div class="sk-bar" [style.width.%]="s.level"></div>
                </div>
              </div>
            }
          </div>
        </section>
      </div>
    } @else {
      <p class="loading">Loading profile…</p>
    }
  `,
  styleUrl: './candidate-profile.component.scss',
})
export class CandidateProfileComponent {
  private api = inject(ApiService)
  private route = inject(ActivatedRoute)
  circ = 2 * Math.PI * 50

  candidate = toSignal(
    this.route.paramMap.pipe(switchMap((p) => this.api.getCandidate(p.get('id')!))),
  )

  initials(name: string): string {
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
  }
}
