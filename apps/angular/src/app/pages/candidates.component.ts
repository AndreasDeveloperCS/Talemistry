import { CommonModule } from '@angular/common'
import { Component, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { ApiService } from '../core/api.service'

@Component({
  selector: 'tal-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <header class="page-head">
      <div>
        <h1>Candidates</h1>
        <p class="sub">Talent intelligence profiles across every open role.</p>
      </div>
    </header>

    <div class="toolbar">
      <input
        class="search"
        [ngModel]="query()"
        (ngModelChange)="query.set($event)"
        placeholder="Search by name, role, skill…"
      />
      <div class="sort">
        <button
          [class.active]="sort() === 'match'"
          (click)="sort.set('match')"
        >
          By chemistry
        </button>
        <button [class.active]="sort() === 'recent'" (click)="sort.set('recent')">
          Recently active
        </button>
      </div>
    </div>

    <div class="grid">
      @for (c of filtered(); track c.id) {
        <a class="card cand" [routerLink]="['/candidates', c.id]">
          <div class="c-head">
            <span class="avatar" [style.background]="c.avatarTone">{{ initials(c.name) }}</span>
            <div>
              <p class="c-name">{{ c.name }}</p>
              <p class="c-title">{{ c.title }}</p>
            </div>
            <span class="match">{{ c.chemistryMatch }}%</span>
          </div>
          <p class="c-loc">{{ c.location }} · {{ c.workStyleType }}</p>
          <div class="spectrum">
            <span class="sp-label">Potential spectrum</span>
            <div class="sp-track">
              <div
                class="sp-range"
                [style.left.%]="c.potentialLow"
                [style.width.%]="c.potentialHigh - c.potentialLow"
              ></div>
            </div>
          </div>
          <div class="tags">
            @for (t of c.tags; track t) {
              <span class="tag">{{ t }}</span>
            }
          </div>
        </a>
      } @empty {
        <p class="empty">No candidates match “{{ query() }}”.</p>
      }
    </div>
  `,
  styleUrl: './candidates.component.scss',
})
export class CandidatesComponent {
  private api = inject(ApiService)
  private candidates = toSignal(this.api.getCandidates(), { initialValue: [] })
  query = signal('')
  sort = signal<'match' | 'recent'>('match')

  filtered = computed(() => {
    const q = this.query().toLowerCase().trim()
    let list = this.candidates().filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.skills.some((s) => s.name.toLowerCase().includes(q)),
    )
    list = [...list].sort((a, b) =>
      this.sort() === 'match'
        ? b.chemistryMatch - a.chemistryMatch
        : +new Date(b.updatedAt) - +new Date(a.updatedAt),
    )
    return list
  })

  initials(name: string): string {
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
  }
}
