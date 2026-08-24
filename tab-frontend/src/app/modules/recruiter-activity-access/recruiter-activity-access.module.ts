import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RecruiterActivityAccessComponent } from './components/recruiter-activity-access/recruiter-activity-access.component';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';

const routes: Routes = [
  {
    path: '',
    component: RecruiterActivityAccessComponent,
    canActivate: [AuthGuardService],
  },
];

@NgModule({
  declarations: [
    RecruiterActivityAccessComponent,
  ],
  exports: [
    RecruiterActivityAccessComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatListModule,
    MatProgressSpinnerModule,
    RouterModule.forChild(routes)
  ],
})
export class RecruiterActivityAccessModule { }
