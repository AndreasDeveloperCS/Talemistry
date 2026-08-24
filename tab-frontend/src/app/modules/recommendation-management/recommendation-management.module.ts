import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { GeneralModule } from '../general/general.module';
import { RecommendationManagementBlockComponent } from './components/recommendation-management-block/recommendation-management-block.component';
import { RecommendationManagementComponent } from './components/recommendation-management/recommendation-management.component';

const routes: Routes = [
  {
    path: environment.routes.talentTab.recommendationManagement.recommendationManagementBlock,
    component: RecommendationManagementBlockComponent,
    canActivate: [AuthGuardService],
  },
  { path: '', redirectTo: environment.routes.talentTab.recommendationManagement.recommendationManagementBlock, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    RecommendationManagementBlockComponent,
    RecommendationManagementComponent,
  ],
  exports: [
    RecommendationManagementBlockComponent,
    RecommendationManagementComponent,
  ],
  imports: [
    GeneralModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }]
})
export class RecommendationManagementModule { }
