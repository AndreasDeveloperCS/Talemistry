import { CommonModule } from '@angular/common'
import { Component, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ApiService } from '../core/api.service'
import { DashboardMetrics } from '../core/models'

@Component({
  selector: 'tal-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="page-head">
      <div>
        <h1>Talent Command Center</h1>
        <p class="sub">A live view of your full-cycle acquisition engine.</p>
      </div>
      <span class="stage-chip">All journeys</span>
    </header>

    @if (metrics(); as m) {
      <section class="kpis">
        <div class="kpi card">
          <p class="k-label">Active candidates</p>
          <p class="k-value">{{ m.activeCandidates }}</p>
          <p class="k-trend up">+12% vs last cycle</p>
        </div>
        <div class="kpi card">
          <p class="k-label">Open roles</p>
          <p class="k-value">{{ m.openRoles }}</p>
          <p class="k-trend">across 3 teams</p>
        </div>
        <div class="kpi card">
          <p class="k-label">Avg. time to hire</p>
          <p class="k-value">{{ m.avgTimeToHire }}<span class="unit">days</span></p>
          <p class="k-trend up">−4 days improvement</p>
        </div>
        <div class="kpi card">
          <p class="k-label">Offer accept rate</p>
          <p class="k-value">{{ m.offerAcceptRate }}<span class="unit">%</span></p>
          <p class="k-trend up">strong chemistry match</p>
        </div>
      </section>

      <div class="grid">
        <section class="card">
          <h2>Journey funnel</h2>
          <p class="card-sub">Candidates active at each of the seven stages.</p>
          <div class="funnel">
            @for (s of m.stageCounts; track s.stage) {
              <div class="fn-row">
                <span class="fn-label">
                  <span class="dot" [style.background]="s.color"></span>{{ s.label }}
                </span>
                <div class="fn-bar-track">
                  <div
                    class="fn-bar"
                    [style.width.%]="barWidth(s.count)"
                    [style.background]="s.color"
                  ></div>
                </div>
                <span class="fn-count">{{ s.count }}</span>
              </div>
            }
          </div>
        </section>

        <section class="card">
          <h2>Hiring trend</h2>
          <p class="card-sub">Hires vs. applicant volume over the last 6 months.</p>
          <div class="chart">
            @for (t of metrics()!.hiringTrend; track t.label) {
              <div class="bar-group">
                <div class="bars">
                  <div
                    class="bar applicants"
                    [style.height.%]="(t.applicants / maxApplicants()) * 100"
                    [title]="t.applicants + ' applicants'"
                  ></div>
                  <div
                    class="bar hires"
                    [style.height.%]="(t.hires / 10) * 100"
                    [title]="t.hires + ' hires'"
                  ></div>
                </div>
                <span class="bar-label">{{ t.label }}</span>
              </div>
            }
          </div>
          <div class="legend">
            <span><i class="sw applicants"></i>Applicants</span>
            <span><i class="sw hires"></i>Hires</span>
          </div>
        </section>
      </div>
    } @else {
      <p class="loading">Loading command center…</p>
    }
  `,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private api = inject(ApiService)
  metrics = toSignal(this.api.getMetrics())

  maxCount = computed(() =>
    Math.max(1, ...(this.metrics()?.stageCounts.map((s) => s.count) ?? [1])),
  )
  maxApplicants = computed(() =>
    Math.max(1, ...(this.metrics()?.hiringTrend.map((t) => t.applicants) ?? [1])),
  )

  barWidth(count: number): number {
    return Math.max(6, (count / this.maxCount()) * 100)
  }
}
