import { Routes } from '@angular/router'

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Command Center — Talemistry',
    loadComponent: () =>
      import('./pages/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'pipeline',
    title: 'Pipeline — Talemistry',
    loadComponent: () => import('./pages/pipeline.component').then((m) => m.PipelineComponent),
  },
  {
    path: 'candidates',
    title: 'Candidates — Talemistry',
    loadComponent: () =>
      import('./pages/candidates.component').then((m) => m.CandidatesComponent),
  },
  {
    path: 'candidates/:id',
    title: 'Candidate Profile — Talemistry',
    loadComponent: () =>
      import('./pages/candidate-profile.component').then((m) => m.CandidateProfileComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
]
