import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from './environment'
import { Candidate, DashboardMetrics, Job, JOURNEY_STAGES, PipelineColumn, StageKey } from './models'
import { MOCK_CANDIDATES, MOCK_JOBS, MOCK_METRICS } from './mock-data'

/**
 * Talemistry API client.
 *
 * Talks to the NestJS backend at `environment.apiUrl`. When the backend is not
 * running (local design/preview), every call transparently falls back to the
 * bundled mock dataset so the UI stays fully demonstrable.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient)
  private base = environment.apiUrl

  getCandidates(): Observable<Candidate[]> {
    return this.http
      .get<Candidate[]>(`${this.base}/candidates`)
      .pipe(catchError(() => of(MOCK_CANDIDATES)))
  }

  getCandidate(id: string): Observable<Candidate | undefined> {
    return this.http
      .get<Candidate>(`${this.base}/candidates/${id}`)
      .pipe(catchError(() => of(MOCK_CANDIDATES.find((c) => c.id === id))))
  }

  getJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.base}/jobs`).pipe(catchError(() => of(MOCK_JOBS)))
  }

  getMetrics(): Observable<DashboardMetrics> {
    return this.http
      .get<DashboardMetrics>(`${this.base}/analytics/overview`)
      .pipe(catchError(() => of(MOCK_METRICS)))
  }

  getPipeline(): Observable<PipelineColumn[]> {
    return this.getCandidates().pipe(
      map((candidates) =>
        JOURNEY_STAGES.map((s) => ({
          stage: s.key as StageKey,
          label: s.label,
          color: s.color,
          candidates: candidates.filter((c) => c.stage === s.key),
        })),
      ),
    )
  }
}
