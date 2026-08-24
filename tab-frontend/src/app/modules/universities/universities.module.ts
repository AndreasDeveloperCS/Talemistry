import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { UniversitiesBlockComponent } from './components/universities-block/universities-block.component';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { UniversitiesListComponent } from './components/universities-list/universities-list.component';
import { UniversityFormComponent } from './components/university-form/university-form.component';
import { EducationalInstitutionsComponent } from './components/educational-institutions/educational-institutions.component';
import { GeneralModule } from '../general/general.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDialogModule } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';

const routes: Routes = [
    {
        path: environment.routes.adminTab.universities.universitiesBlock,
        component: UniversitiesBlockComponent,
        canActivate: [AuthGuardService],
    },
    { path: '', redirectTo: environment.routes.adminTab.universities.universitiesBlock, pathMatch: 'full' },
];

@NgModule({
  declarations: [
      UniversitiesListComponent,
      UniversityFormComponent,
      UniversitiesBlockComponent,
      EducationalInstitutionsComponent
  ],
  exports: [
      UniversitiesListComponent,
      UniversityFormComponent,
      UniversitiesBlockComponent,
      EducationalInstitutionsComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
      GeneralModule,
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      MatSelectModule,
      MatButtonModule,
      DragDropModule,
      MatFormFieldModule,
      NgxMatSelectSearchModule,
      MatDialogModule,
      MatGridListModule,
      MatIconModule,
      TextFieldModule,
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
      RouterModule.forChild(routes)
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
        provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }]
})
export class UniversitiesModule { }
