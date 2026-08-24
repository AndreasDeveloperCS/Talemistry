import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, Lock, Sparkles, Mail, ShieldCheck, TrendingUp, Shuffle, Target,
  TriangleAlert, Star, Globe, Languages, Briefcase, ListChecks, Award, GraduationCap, Flame,
} from 'lucide-angular';
import { GeneralModule } from '../general/general.module';
import { PublicProfileToggleComponent } from './components/public-profile-toggle/public-profile-toggle.component';
import { PublicProfileViewComponent } from './components/public-profile-view/public-profile-view.component';
import { QrCodeComponent } from './components/qr-code/qr-code.component';
import { VisitCardsComponent } from './components/visit-cards/visit-cards.component';
import { TmCardComponent } from '../general/components/ui/card/card.component';
import { TmBadgeComponent } from '../general/components/ui/badge/badge.component';
import { TmAvatarComponent } from '../general/components/ui/avatar/avatar.component';
import { TmButtonComponent } from '../general/components/ui/button/button.component';
import { TmProgressComponent } from '../general/components/ui/progress/progress.component';

const PROFILE_ICONS = {
  Lock, Sparkles, Mail, ShieldCheck, TrendingUp, Shuffle, Target, TriangleAlert, Star, Globe,
  Languages, Briefcase, ListChecks, Award, GraduationCap, Flame,
};

@NgModule({
  declarations: [
    QrCodeComponent,
    PublicProfileToggleComponent,
    PublicProfileViewComponent,
    VisitCardsComponent,
  ],
  exports: [
    QrCodeComponent,
    PublicProfileToggleComponent,
    PublicProfileViewComponent,
    VisitCardsComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    FormsModule,
    LucideAngularModule.pick(PROFILE_ICONS),
    TmCardComponent,
    TmBadgeComponent,
    TmAvatarComponent,
    TmButtonComponent,
    TmProgressComponent,
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
export class CustomPublicProfilesModule { }
