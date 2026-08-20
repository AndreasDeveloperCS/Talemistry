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
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { SocialMediaBlockComponent } from './components/social-media-block/social-media-block.component';
import { SocialMediaFormComponent } from './components/social-media-form/social-media-form.component';
import { SocialMediaListComponent } from './components/social-media-list/social-media-list.component';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { environment } from '../../../environments/environment';
import { GeneralModule } from '../general/general.module';

const routes: Routes = [
    {
        path: environment.routes.adminTab.socialMedia.media,
        component: SocialMediaBlockComponent,
        canActivate: [AuthGuardService],
    },
    { path: '', redirectTo: environment.routes.adminTab.socialMedia.media, pathMatch: 'full' },
];

@NgModule({
    declarations: [
        SocialMediaListComponent,
        SocialMediaFormComponent,
        SocialMediaBlockComponent
    ],
    exports: [
        SocialMediaListComponent,
        SocialMediaFormComponent,
        SocialMediaBlockComponent
    ],
    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],
    imports: [
        CommonModule,
        GeneralModule,
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
        MatTableModule,
        MatSortModule,
        MatExpansionModule,
        MatSliderModule,
        NgxSliderModule,
        MatAutocompleteModule,
        MatPaginatorModule,
        MatTooltipModule,
        MatSlideToggleModule,
        RouterModule.forChild(routes)
    ],
    providers: [
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide: ViewEncapsulation, useValue: ViewEncapsulation.None
        }
    ]
})
export class SocialMediaModule { }