import { NgModule, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { UsersBlockComponent } from './components/users-block/users-block.component';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { UsersListComponent } from './components/users-list/users-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { RoleSelectionComponent } from './components/role-selection/role-selection.component';
import { GeneralModule } from '../general/general.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

const routes: Routes = [
  {
    path: environment.routes.adminTab.users.usersBlock,
    component: UsersBlockComponent,
    canActivate: [AuthGuardService],
  },
  { path: '', redirectTo: environment.routes.adminTab.users.usersBlock, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    UsersBlockComponent,
    UsersListComponent,
    UserFormComponent,
    RoleSelectionComponent
  ],
  exports: [
    UsersBlockComponent,
    UsersListComponent,
    UserFormComponent
  ],
  imports: [
    GeneralModule,
    CommonModule,
    FormsModule,
    MatSelectModule,
    DragDropModule,
    MatButtonModule,
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
    }]
})
export class UsersModule { }
