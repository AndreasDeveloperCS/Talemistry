import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
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
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { environment } from '../../../environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { GeneralModule } from '../general/general.module';
import { MotivationalFactorsBlockComponent } from './components/motivational-factors-block/motivational-factors-block.component';
import { MotivationalFactorsListComponent } from './components/motivational-factors-list/motivational-factors-list.component';
import { MotivationalFactorsFormComponent } from './components/motivational-factors-form/motivational-factors-form.component';

const routes: Routes = [
  {
    path: environment.routes.adminTab.motivationalFactors.motivationalFactorsBlock,
    component: MotivationalFactorsBlockComponent,
    canActivate: [AuthGuardService],
  },
];

@NgModule({
  declarations: [
    MotivationalFactorsBlockComponent,
    MotivationalFactorsListComponent,
    MotivationalFactorsFormComponent,
  ],
  exports: [
    MotivationalFactorsBlockComponent,
    MotivationalFactorsListComponent,
    MotivationalFactorsFormComponent,
  ],
  schemas: [
      CUSTOM_ELEMENTS_SCHEMA
  ],
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
  providers:
    [
      provideHttpClient(withInterceptorsFromDi())
    ]
})
export class MotivationalFactorsModule { }
