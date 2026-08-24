import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MainIndustryDomainComponent } from './components/main-industry-domain/main-industry-domain.component';
import { GeneralModule } from '../general/general.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatInputModule } from '@angular/material/input';



@NgModule({
  declarations: [
    MainIndustryDomainComponent,
  ],
  exports: [
    MainIndustryDomainComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatOptionModule,
    NgxMatSelectSearchModule,
    MatInputModule,
  ],
  providers: [],
})
export class IndustriesModule { }
