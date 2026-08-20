import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
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
import { RECAPTCHA_V3_SITE_KEY, RecaptchaFormsModule, RecaptchaModule, RecaptchaV3Module } from 'ng-recaptcha-2';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { NgxEditorModule } from 'ngx-editor';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { environment } from '../../../environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { AiGeneratorsModule } from '../general/ai-generators.module';
import { CompaniesModule } from '../companies/companies.module';
import { CompanyProfileComponent } from '../companies/components/company-profile/company-profile.component';
import { PdfDialogsModule } from '../general/pdf-dialogs.module';
import { CompanyVersion } from '../companies/models/company';
import { GeneralModule } from '../general/general.module';
import { ScreeningFormComponent } from '../position-management/components/screening-form/screening-form.component';
import { PositionPipelinesModule } from '../position-pipelines/position-pipelines.module';
import { AddCvDialogComponent } from './components/add-cv-dialog/add-cv-dialog.component';
import { ApplyFormComponent } from './components/apply-form/apply-form.component';
import { JobWizardComponent } from './components/job-wizard/job-wizard.component';
import { OpenedPositionFullComponent } from './components/opened-position-full/opened-position-full.component';
import { OpenedPositionPlateViewComponent } from './components/opened-position-plate-view/opened-position-plate-view.component';
import { OpenedPositionShortItemComponent } from './components/opened-position-short-item/opened-position-short-item.component';
import { OpenedPositionTilesComponent } from './components/opened-position-tiles/opened-position-tiles.component';
import { PositionApplyFormComponent } from './components/position-apply-form/position-apply-form.component';
import { PositionCreationSuccessComponent } from './components/position-creation-success/position-creation-success.component';
import { PositionDescriptionBenefitsComponent } from './components/position-description-benefits/position-description-benefits.component';
import { PositionDescriptionFullComponent } from './components/position-description-full/position-description-full.component';
import { PositionDescriptionGenericComponent } from './components/position-description-generic/position-description-generic.component';
import { PositionDescriptionReqirementsComponent } from './components/position-description-reqirements/position-description-reqirements.component';
import { PositionDescriptionSummaryComponent } from './components/position-description-summary/position-description-summary.component';
import { PositionDetailedInfoComponent } from './components/position-detailed-info/position-detailed-info.component';
import { PositionDetailsBenefitsComponent } from './components/position-details-benefits/position-details-benefits.component';
import { PositionDetailsCompanyComponent } from './components/position-details-company/position-details-company.component';
import { PositionDetailsFirstComponent } from './components/position-details-first/position-details-first.component';
import { PositionDetailsHiringManagersComponent } from './components/position-details-hiring-managers/position-details-hiring-managers.component';
import { PositionDetailsLocationComponent } from './components/position-details-location/position-details-location.component';
import { PositionDetailsMainComponent } from './components/position-details-main/position-details-main.component';
import { PositionDetailsRequiredCertificationComponent } from './components/position-details-required-certification/position-details-required-certification.component';
import { PositionDetailsRequiredEducationComponent } from './components/position-details-required-education/position-details-required-education.component';
import { PositionDetailsSecondComponent } from './components/position-details-second/position-details-second.component';
import { PositionDetailsSkillComponent } from './components/position-details-skill/position-details-skill.component';
import { PositionDetailsTitleComponent } from './components/position-details-title/position-details-title.component';
import { PositionPageDialogComponent } from './components/position-page-dialog/position-page-dialog.component';
import { PositionSkillUnifiedComponent } from './components/position-skill-unified/position-skill-unified.component';
import { PositionsBlockComponent } from './components/positions-block/positions-block.component';
import { PositionsListComponent } from './components/positions-list/positions-list.component';
import { PositionsComponent } from './components/positions/positions.component';
import { OpenPosition } from './models/position';

const routes: Routes = [
  {
    path: 'positions-block',
    canActivate: [AuthGuardService],
    component: PositionsBlockComponent,
  },
  {
    path: 'positions',
    // canActivate: [AuthGuardService],
    component: PositionsListComponent,
  },
  {
    path: 'positions/:positionsId',
    //canActivate: [AuthGuardService],
    component: PositionDescriptionFullComponent, data: OpenPosition,
    // children: [
    //   {
    //     path: 'interviews',
    //     canActivate: [AuthGuardService],
    //     component: InterviewsDashboardComponent, data: OpenPosition
    //   },
    //   {
    //     path: 'interviews/:interviewId',
    //     canActivate: [AuthGuardService],
    //     component: InterviewSessionComponent, data: OpenPosition
    //   },
    // ]
  },
  {
    path: 'screening/:positionId',
    canActivate: [AuthGuardService],
    component: ScreeningFormComponent,
  },
  {
    path: 'companies/:companyId',
    //canActivate: [AuthGuardService],
    component: CompanyProfileComponent, data: CompanyVersion,
  },
];

@NgModule({
  declarations: [
    PositionPageDialogComponent,
    PositionDetailsTitleComponent,
    PositionDetailsFirstComponent,
    PositionDetailsSecondComponent,
    PositionDescriptionGenericComponent,
    PositionDescriptionReqirementsComponent,
    PositionDescriptionBenefitsComponent,
    PositionDescriptionSummaryComponent,
    PositionCreationSuccessComponent,
    PositionDetailsCompanyComponent,
    PositionDetailsLocationComponent,
    PositionDetailsHiringManagersComponent,
    PositionDetailsBenefitsComponent,
    PositionDetailsSkillComponent,
    PositionDetailsRequiredEducationComponent,
    PositionDetailsRequiredCertificationComponent,
    AddCvDialogComponent,
    ApplyFormComponent,
    OpenedPositionFullComponent,
    OpenedPositionPlateViewComponent,
    OpenedPositionShortItemComponent,
    OpenedPositionTilesComponent,
    PositionApplyFormComponent,
    PositionDescriptionFullComponent,
    PositionDetailedInfoComponent,
    PositionDetailsMainComponent,
    PositionsComponent,
    PositionsBlockComponent,
    PositionsListComponent,
    JobWizardComponent,
    PositionSkillUnifiedComponent,
  ],
  exports: [
    PositionPageDialogComponent,
    PositionDetailsTitleComponent,
    PositionDetailsFirstComponent,
    PositionDetailsSecondComponent,
    PositionDescriptionGenericComponent,
    PositionDescriptionReqirementsComponent,
    PositionDescriptionBenefitsComponent,
    PositionDescriptionSummaryComponent,
    PositionCreationSuccessComponent,
    PositionDetailsCompanyComponent,
    PositionDetailsLocationComponent,
    PositionDetailsHiringManagersComponent,
    PositionDetailsBenefitsComponent,
    PositionDetailsSkillComponent,
    PositionDetailsRequiredEducationComponent,
    PositionDetailsRequiredCertificationComponent,
    AddCvDialogComponent,
    ApplyFormComponent,
    OpenedPositionFullComponent,
    OpenedPositionPlateViewComponent,
    OpenedPositionShortItemComponent,
    OpenedPositionTilesComponent,
    PositionApplyFormComponent,
    PositionDescriptionFullComponent,
    PositionDetailedInfoComponent,
    PositionDetailsMainComponent,
    PositionsComponent,
    PositionsBlockComponent,
    PositionsListComponent,
    JobWizardComponent,
    PositionSkillUnifiedComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    MatDialogModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    NgxEditorModule,
    AiGeneratorsModule,
    CompaniesModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
    MatGridListModule,
    MatInputModule,
    MatButtonToggleModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatSliderModule,
    NgxSliderModule,
    MatAutocompleteModule,
    MatTooltipModule,
    PdfViewerModule,
    PdfDialogsModule,
    RecaptchaFormsModule,
    RecaptchaModule,
    RecaptchaV3Module,
    PositionPipelinesModule,
    RouterModule.forChild(routes)
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.RECAPTCHA_KEY_V3
    },
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
  ]
})
export class PositionsModule { }
