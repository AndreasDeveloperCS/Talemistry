import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecruitingPipelineComponent } from './components/recruiting-pipeline/recruiting-pipeline.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { GeneralModule } from '../general/general.module';
import { PositionPipelineComponent } from './components/position-pipeline/position-pipeline.component';

@NgModule({
  declarations: [
    RecruitingPipelineComponent,
    PositionPipelineComponent
  ],
  exports: [
    RecruitingPipelineComponent,
    PositionPipelineComponent
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
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi())
  ],
})
export class PositionPipelinesModule { }
