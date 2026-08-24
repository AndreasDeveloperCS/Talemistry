import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatError, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, Routes } from '@angular/router';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { environment } from '../../../environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { GeneralModule } from '../general/general.module';
import { IndustriesModule } from '../industries/industries.module';
import { LocationModule } from '../location/location.module';
import { CompanyBenefitsComponent } from './components/company-benefits/company-benefits.component';
import { CompanyBlockComponent } from './components/company-block/company-block.component';
import { CompanyCreationModalShortComponent } from './components/company-creation-modal-short/company-creation-modal-short.component';
import { CompanyCreationModalComponent } from './components/company-creation-modal/company-creation-modal.component';
import { CompanyListComponent } from './components/company-list/company-list.component';
import { CompanyOpenPositionSingleComponent } from './components/company-open-position-single/company-open-position-single.component';
import { CompanyOpenPositionsComponent } from './components/company-open-positions/company-open-positions.component';
import { CompanyProfileComponent } from './components/company-profile/company-profile.component';
import { CompanyValuesComponent } from './components/company-values/company-values.component';

const routes: Routes = [
  {
      path: environment.routes.adminTab.companies.companiesBlock,
      component: CompanyBlockComponent,
      canActivate: [AuthGuardService],
  },
];

@NgModule({
  declarations: [
    CompanyCreationModalComponent,
    CompanyCreationModalShortComponent,
    CompanyProfileComponent,
    CompanyListComponent,
    CompanyBlockComponent,
    CompanyOpenPositionsComponent,
    CompanyOpenPositionSingleComponent,
    CompanyValuesComponent,
    CompanyBenefitsComponent,
  ],
  exports: [
    CompanyCreationModalComponent,
    CompanyCreationModalShortComponent,
    CompanyProfileComponent,
    CompanyListComponent,
    CompanyBlockComponent,
    CompanyOpenPositionsComponent,
    CompanyOpenPositionSingleComponent,
    CompanyValuesComponent,
    CompanyBenefitsComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatIcon,
    MatDialogModule,
    MatSelectModule,
    LocationModule,
    IndustriesModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatButtonModule,
    MatOptionModule,
    NgxMatSelectSearchModule,
    MatInputModule,
    DragDropModule,
    MatGridListModule,
    TextFieldModule,
    MatButtonToggleModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule,
    MatLabel,
    MatNativeDateModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatSliderModule,
    NgxSliderModule,
    MatError,
    MatPaginatorModule,
    MatTooltipModule,
    
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
  ],
})
export class CompaniesModule { }
