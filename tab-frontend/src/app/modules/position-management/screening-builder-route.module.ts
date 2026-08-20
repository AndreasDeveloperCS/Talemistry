import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { PositionManagementModule } from './position-management.module';
import { ScreeningBuilderComponent } from './components/screening-builder/screening-builder.component';

const routes: Routes = [
  {
    path: ':positionId',
    component: ScreeningBuilderComponent,
    canActivate: [AuthGuardService],
  },
];

@NgModule({
  imports: [
    PositionManagementModule,
    RouterModule.forChild(routes),
  ],
})
export class ScreeningBuilderRouteModule { }