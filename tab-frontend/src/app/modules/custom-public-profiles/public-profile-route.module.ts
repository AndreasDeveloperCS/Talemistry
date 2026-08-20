import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomPublicProfilesModule } from './custom-public-profiles.module';
import { PublicProfileViewComponent } from './components/public-profile-view/public-profile-view.component';

const routes: Routes = [
  {
    path: ':userId',
    component: PublicProfileViewComponent,
  },
];

@NgModule({
  imports: [
    CustomPublicProfilesModule,
    RouterModule.forChild(routes),
  ],
})
export class PublicProfileRouteModule { }