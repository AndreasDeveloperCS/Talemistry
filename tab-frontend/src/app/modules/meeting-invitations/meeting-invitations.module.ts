import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { GeneralModule } from '../general/general.module';
import { MeetingTemplateCardComponent } from './components/meeting-template-card/meeting-template-card.component';
import { MeetingTemplateFormComponent } from './components/meeting-template-form/meeting-template-form.component';
import { MeetingTemplateManagementComponent } from './components/meeting-template-management/meeting-template-management.component';

@NgModule({
  declarations: [
    MeetingTemplateCardComponent,
    MeetingTemplateFormComponent,
    MeetingTemplateManagementComponent,
  ],
  exports: [
    MeetingTemplateCardComponent,
    MeetingTemplateFormComponent,
    MeetingTemplateManagementComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
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
export class MeetingInvitationsModule { }