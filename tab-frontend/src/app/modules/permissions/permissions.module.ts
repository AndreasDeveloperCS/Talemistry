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
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule, Routes } from '@angular/router';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { GeneralModule } from '../general/general.module';
import { AccessTypeFormComponent } from './components/access-type-form/access-type-form.component';
import { AccessTypesComponent } from './components/access-types/access-types.component';
import { FunctionalBlockFormComponent } from './components/functional-block-form/functional-block-form.component';
import { FunctionalBlocksComponent } from './components/functional-blocks/functional-blocks.component';
import { PermissionsBlockComponent } from './components/permissions-block/permissions-block.component';
import { PermissionsListComponent } from './components/permissions-list/permissions-list.component';
import { RoleFormComponent } from './components/role-form/role-form.component';
import { RolesListComponent } from './components/roles-list/roles-list.component';
import { BitValuePipe } from './pipes/bit-value.pipe';
import { environment } from '../../../environments/environment';

const routes: Routes = [
  {
    path: environment.routes.adminTab.permissions.permissionsBlock,
    component: PermissionsBlockComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: environment.routes.adminTab.permissions.permissionsList,
        component: PermissionsListComponent,
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.permissions.rolesList,
        component: RolesListComponent,
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.permissions.accessTypes,
        component: AccessTypesComponent,
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.permissions.functionalBlocks,
        component: FunctionalBlocksComponent,
        canActivate: [AuthGuardService]
      },
    ]
  },
];

@NgModule({
  declarations: [
    RoleFormComponent,
    PermissionsBlockComponent,
    PermissionsListComponent,
    RolesListComponent,
    FunctionalBlocksComponent,
    AccessTypesComponent,
    FunctionalBlockFormComponent,
    AccessTypeFormComponent,
    BitValuePipe,
  ],
  exports: [
    RoleFormComponent,
    PermissionsBlockComponent,
    PermissionsListComponent,
    RolesListComponent,
    FunctionalBlocksComponent,
    AccessTypesComponent,
    FunctionalBlockFormComponent,
    AccessTypeFormComponent,
    BitValuePipe,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    GeneralModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    DragDropModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
    MatDialogModule,
    MatGridListModule,
    TextFieldModule,
    MatButtonToggleModule,
    MatTabsModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatExpansionModule,
    MatSliderModule,
    NgxSliderModule,
    MatAutocompleteModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatInputModule,
    MatMenuModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
  ],
})
export class PermissionsModule { }
