import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GeneralModule } from '../general/general.module';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { CompanyManagementBlockComponent } from './components/company-management-block/company-management-block.component';
import { CompanyManagementComponent } from './components/company-management/company-management.component';
import { CompanyCardComponent } from './components/company-card/company-card.component';
import { LocationModule } from '../location/location.module';
import { IndustriesModule } from '../industries/industries.module';
import { CompaniesModule } from '../companies/companies.module';

const routes: Routes = [
  {
    path: environment.routes.recruitmentTab.companyManagement.companyManagementBlock,
    component: CompanyManagementBlockComponent,
    canActivate: [AuthGuardService],
  },
  { path: '', redirectTo: environment.routes.recruitmentTab.companyManagement.companyManagementBlock, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    CompanyManagementBlockComponent,
    CompanyManagementComponent,
    CompanyCardComponent,
  ],
  exports: [
    CompanyManagementBlockComponent,
    CompanyManagementComponent,
    CompanyCardComponent,
  ],
  imports: [
    GeneralModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    LocationModule,
    IndustriesModule,
    CompaniesModule,
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }]
})
export class CompanyManagementModule { }
