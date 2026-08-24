import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { CustomPublicProfilesModule } from '../custom-public-profiles/custom-public-profiles.module';
import { GeneralModule } from '../general/general.module';
import { PdfDialogsModule } from '../general/pdf-dialogs.module';
import { ImageCropperDialogComponent } from '../profiles/user-profile/components/image-cropper-dialog/image-cropper-dialog.component';
import { AdditionalInformationComponent } from './components/additional-information/additional-information.component';
import { AdditionalSkillsComponent } from './components/additional-skills/additional-skills';
import { AttachmentsComponent } from './components/attachments/attachments.component';
import { CareerPathComponent } from './components/career-path/career-path.component';
import { CertificatesListComponent } from './components/certificates-list/certificates-list.component';
import { CertificateComponent } from './components/certification/certificate.component';
import { CompensationPackageComponent } from './components/compensation-package/compensation-package.component';
import { CoverLetterAttachDialogComponent } from './components/cover-letter-attach-dialog/cover-letter-attach-dialog.component';
import { CoverLetterCollectionHistoryComponent } from './components/cover-letter-collection-history/cover-letter-collection-history.component';
import { CvCollectionHistoryComponent } from './components/cv-collection-history/cv-collection-history.component';
import { EducationItemComponent } from './components/education-item/education-item.component';
import { EducationListComponent } from './components/education-list/education-list.component';
import { ExperienceEducationBlockComponent } from './components/experience-education-block/experience-education-block.component';
import { ExpertiseBlockComponent } from './components/expertise-block/expertise-block.component';
import { ImportCoverLetterComponent } from './components/import-cover-letter/import-cover-letter.component';
import { ImportCvComponent } from './components/import-cv/import-cv.component';
import { LinkFormComponent } from './components/link-form/link-form.component';
import { LinkComponent } from './components/link/link.component';
import { LocationResidenceInfoComponent } from './components/location-residence-info/location-residence-info.component';
import { MotivationalFactorsComponent } from './components/motivational-factors/motivational-factors.component';
import { ObjectiveComponent } from './components/objective/objective.component';
import { OperationalExpirienceComponent } from './components/operational-expirience/operational-expirience.component';
import { SkillComponent } from './components/skill/skill.component';
import { SkillsExpertiseComponent } from './components/skills-expertise/skills-expertise.component';
import { SocialMediaPlatformsComponent } from './components/social-media-platforms/social-media-platforms.component';
import { SocialNetworkPlatformsComponent } from './components/social-network-platforms/social-network-platforms.component';
import { SummaryComponent } from './components/summary/summary.component';
import { UserSkillsComponent } from './components/user-skills/user-skills.component';
import { CvParserUploadComponent } from './components/cv-parser-upload/cv-parser-upload.component';
import { CvsClsHistoryViewComponent } from './components/cvs-cls-history-view/cvs-cls-history-view.component';
import { SunSpinnerComponent } from '../general/components/sun-spinner/sun-spinner.component';

const routes: Routes = [
  {
    path: environment.routes.talentTab.expertise.expertiseBlock,
    component: ExpertiseBlockComponent,
    canActivate: [AuthGuardService],
  },
  { path: '', redirectTo: environment.routes.talentTab.expertise.expertiseBlock, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    CareerPathComponent,
    ExperienceEducationBlockComponent,
    SkillsExpertiseComponent,
    ImportCvComponent,
    UserSkillsComponent,
    OperationalExpirienceComponent,
    CertificateComponent,
    EducationItemComponent,
    CertificatesListComponent,
    ObjectiveComponent,
    SummaryComponent,
    LinkComponent,
    AdditionalSkillsComponent,
    SkillComponent,
    EducationListComponent,
    AdditionalInformationComponent,
    SocialNetworkPlatformsComponent,
    LinkFormComponent,
    CvCollectionHistoryComponent,
    CoverLetterCollectionHistoryComponent,
    CoverLetterAttachDialogComponent,
    AttachmentsComponent,
    ImportCoverLetterComponent,
    CompensationPackageComponent,
    MotivationalFactorsComponent,
    LocationResidenceInfoComponent,
    ExpertiseBlockComponent,
    SocialMediaPlatformsComponent,
    CvParserUploadComponent,
    CvsClsHistoryViewComponent,
  ],
  exports: [
    CareerPathComponent,
    ExperienceEducationBlockComponent,
    SkillsExpertiseComponent,
    ImportCvComponent,
    UserSkillsComponent,
    OperationalExpirienceComponent,
    CertificateComponent,
    EducationItemComponent,
    CertificatesListComponent,
    ObjectiveComponent,
    SummaryComponent,
    LinkComponent,
    AdditionalSkillsComponent,
    SkillComponent,
    EducationListComponent,
    AdditionalInformationComponent,
    SocialNetworkPlatformsComponent,
    LinkFormComponent,
    CvCollectionHistoryComponent,
    CoverLetterCollectionHistoryComponent,
    CoverLetterAttachDialogComponent,
    AttachmentsComponent,
    ImportCoverLetterComponent,
    CompensationPackageComponent,
    MotivationalFactorsComponent,
    LocationResidenceInfoComponent,
    ExpertiseBlockComponent,
    SocialMediaPlatformsComponent,
    CvParserUploadComponent,
    CvsClsHistoryViewComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    ImageCropperDialogComponent,
    MatFormFieldModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatOptionModule,
    MatDatepickerModule,
    MatInputModule,
    MatTabsModule,
    MatCheckboxModule,
    NgxSliderModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatTableModule,
    MatSortModule,
    CustomPublicProfilesModule,
    PdfDialogsModule,
    SunSpinnerComponent,
    RouterModule.forChild(routes)
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
  ],
})
export class ExpertiseModule { }
