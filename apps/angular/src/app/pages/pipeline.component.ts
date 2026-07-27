import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { ApiService } from '../core/api.service'

@Component({
  selector: 'tal-pipeline',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="page-head">
      <div>
        <h1>Talent Pipeline</h1>
        <p class="sub">The seven-stage journey — from Discover to Offer.</p>
      </div>
    </header>

    <div class="stepper">
      @for (col of columns() ?? []; track col.stage; let i = $index) {
        <div class="step">
          <span class="s-dot" [style.background]="col.color"></span>
          <span class="s-label">{{ col.label }}</span>
          @if (i < (columns()?.length ?? 0) - 1) {
            <span class="s-line"></span>
          }
        </div>
      }
    </div>

    <div class="board">
      @for (col of columns() ?? []; track col.stage) {
        <section class="column">
          <header class="col-head" [style.borderTopColor]="col.color">
            <span class="col-title">{{ col.label }}</span>
            <span class="col-count">{{ col.candidates.length }}</span>
          </header>
          <div class="col-body">
            @for (c of col.candidates; track c.id) {
              <a class="cand-card" [routerLink]="['/candidates', c.id]">
                <div class="cc-top">
                  <span class="cc-avatar" [style.background]="c.avatarTone">{{ initials(c.name) }}</span>
                  <span class="cc-match" [style.color]="col.color">{{ c.chemistryMatch }}%</span>
                </div>
                <p class="cc-name">{{ c.name }}</p>
                <p class="cc-title">{{ c.title }}</p>
                <div class="cc-tags">
                  @for (t of c.tags.slice(0, 2); track t) {
                    <span class="tag">{{ t }}</span>
                  }
                </div>
              </a>
            } @empty {
              <p class="empty">No candidates</p>
            }
          </div>
        </section>
      }
    </div>
  `,
  styleUrl: './pipeline.component.scss',
})
export class PipelineComponent {
  private api = inject(ApiService)
  columns = toSignal(this.api.getPipeline())

  initials(name: string): string {
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
  }
}
