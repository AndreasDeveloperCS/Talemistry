import { NgModule, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CitiesComponent } from './components/cities/cities.component';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CountriesComponent } from './components/countries/countries.component';



@NgModule({
  declarations: [
    CitiesComponent,
    CountriesComponent,
  ],
  exports: [
    CitiesComponent,
    CountriesComponent,
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    FormsModule, 
    ReactiveFormsModule
  ],
  providers: [
    { 
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None 
    }
  ]
})
export class LocationModule { }
