import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralModule } from '../general/general.module';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SkillsBlockComponent } from './components/skills-block/skills-block.component';
import { SkillsListComponent } from './components/skills-list/skills-list.component';
import { SkillFormComponent } from './components/skill-form/skill-form.component';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';

const routes: Routes = [
    {
        path: environment.routes.adminTab.skills.skillsBlock,
        component: SkillsBlockComponent,
        canActivate: [AuthGuardService],
    },
    { path: '', redirectTo: environment.routes.adminTab.skills.skillsBlock, pathMatch: 'full' },
];

@NgModule({
    declarations: [
        SkillsBlockComponent,
        SkillsListComponent,
        SkillFormComponent
    ],
    exports: [
        SkillsBlockComponent,
        SkillsListComponent,
        SkillFormComponent
    ],
  schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],
    imports: [
        GeneralModule,
        CommonModule,
        FormsModule,
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
        MatExpansionModule,
        MatSliderModule,
        NgxSliderModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatNativeDateModule,
        MatOptionModule,
        MatDatepickerModule,
        MatPaginatorModule,
        MatTooltipModule,
        RouterModule.forChild(routes)
  ],
  providers: [
      provideHttpClient(withInterceptorsFromDi()),
      {
          provide: ViewEncapsulation, useValue: ViewEncapsulation.None
      }],
})
export class SkillsModule { }
