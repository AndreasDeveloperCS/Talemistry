import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA, ViewEncapsulation } from '@angular/core';
import { GeneralModule } from '../general/general.module';
import { CreativeBlocksTemplateComponent } from './components/creative-blocks-template/creative-blocks-template.component';
import { MinimalistSingleTemplateComponent } from './components/minimalist-single-template/minimalist-single-template.component';
import { ModernTwoColumnTemplateComponent } from './components/modern-two-column-template/modern-two-column-template.component';
import { TimelineProfessionalTemplateComponent } from './components/timeline-professional-template/timeline-professional-template.component';
import { FormsModule } from '@angular/forms';
import { CvTemplatesComponent } from './components/cv-templates/cv-templates.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { ExecutiveInfographicTemplateComponent } from './components/executive-infographic-template/executive-infographic-template.component';
import { HexagonTechTemplateComponent } from './components/hexagon-tech-template/hexagon-tech-template.component';
import { MagazineEditorialTemplateComponent } from './components/magazine-editorial-template/magazine-editorial-template.component';
import { SplitAccentTemplateComponent } from './components/split-accent-template/split-accent-template.component';
import { MatIconModule } from '@angular/material/icon';

const routes: Routes = [
  { 
    path: '', 
    component: CvTemplatesComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: environment.routes.talentTab.cvTempletes.minimalistSingleTemplate, 
        component: MinimalistSingleTemplateComponent,
        canActivate: [AuthGuardService] 
      },
      { 
        path: environment.routes.talentTab.cvTempletes.modernTwoColumnTemplate, 
        component: ModernTwoColumnTemplateComponent,
        canActivate: [AuthGuardService] 
      },
      { 
        path: environment.routes.talentTab.cvTempletes.creativeBlocksTemplate, 
        component: CreativeBlocksTemplateComponent,
        canActivate: [AuthGuardService] 
      },
      { 
        path: environment.routes.talentTab.cvTempletes.timelineProfessionalTemplate, 
        component: TimelineProfessionalTemplateComponent,
        canActivate: [AuthGuardService]
      },
      { 
        path: environment.routes.talentTab.cvTempletes.executiveInfographicTemplate, 
        component: ExecutiveInfographicTemplateComponent,
        canActivate: [AuthGuardService]
      },
      { 
        path: environment.routes.talentTab.cvTempletes.hexagonTechTemplate, 
        component: HexagonTechTemplateComponent,
        canActivate: [AuthGuardService]
      },
      { 
        path: environment.routes.talentTab.cvTempletes.magazineEditorialTemplate, 
        component: MagazineEditorialTemplateComponent,
        canActivate: [AuthGuardService]
      },
      { 
        path: environment.routes.talentTab.cvTempletes.splitAccentTemplate, 
        component: SplitAccentTemplateComponent,
        canActivate: [AuthGuardService]
      },
    ]
  },
  { path: '', redirectTo: environment.routes.talentTab.cvTempletes.minimalistSingleTemplate, pathMatch: 'full' },
]

@NgModule({
  declarations: [
    CreativeBlocksTemplateComponent,
    MinimalistSingleTemplateComponent,
    ModernTwoColumnTemplateComponent,
    TimelineProfessionalTemplateComponent,
    ExecutiveInfographicTemplateComponent,
    HexagonTechTemplateComponent,
    MagazineEditorialTemplateComponent,
    SplitAccentTemplateComponent,
    CvTemplatesComponent,
  ],
  exports: [
    CreativeBlocksTemplateComponent,
    MinimalistSingleTemplateComponent,
    ModernTwoColumnTemplateComponent,
    TimelineProfessionalTemplateComponent,
    ExecutiveInfographicTemplateComponent,
    HexagonTechTemplateComponent,
    MagazineEditorialTemplateComponent,
    SplitAccentTemplateComponent,
    CvTemplatesComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    MatIconModule,
    FormsModule,
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
export class CvTemplatesModule { }
