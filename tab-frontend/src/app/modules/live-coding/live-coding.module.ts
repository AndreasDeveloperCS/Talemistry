import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { LiveCodingEditorComponent } from './components/live-coding-editor/live-coding-editor.component';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { environment } from 'src/environments/environment';
import { SunSpinnerComponent } from '../general/components/sun-spinner/sun-spinner.component';
import { SqlTableComponent } from './components/sql-table/sql-table.component';
import { SqlResultGridComponent } from './components/sql-result-grid/sql-result-grid.component';

const routes: Routes = [
  {
    path: environment.routes.talentTab.liveCoding.liveCodingPersonal,
    component: LiveCodingEditorComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: environment.routes.talentTab.liveCoding.liveCodingInterview,
    component: LiveCodingEditorComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: environment.routes.recruitmentTab.liveCoding.liveCodingPersonal,
    component: LiveCodingEditorComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: environment.routes.recruitmentTab.liveCoding.liveCodingInterview,
    component: LiveCodingEditorComponent,
    canActivate: [AuthGuardService],
  },
  { path: '', redirectTo: environment.routes.talentTab.liveCoding.liveCodingBlock, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    LiveCodingEditorComponent,
    SqlTableComponent,
    SqlResultGridComponent,
  ],
  exports: [
    LiveCodingEditorComponent,
    SqlTableComponent,
    SqlResultGridComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SunSpinnerComponent,
    RouterModule.forChild(routes)
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    },
  ]
})
export class LiveCodingModule { }
