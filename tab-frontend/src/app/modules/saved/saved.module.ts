import { CommonModule } from "@angular/common";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { environment } from "src/environments/environment";
import { AuthGuardService } from "../authentication/guard/auth-guard.service";
import { MatTabsModule } from "@angular/material/tabs";
import { SavedBlockComponent } from "./components/saved-block/saved-block.component";
import { SavedPositionsComponent } from "./components/saved-positions/saved-positions.component";
import { SavedPositionCardComponent } from "./components/saved-position-card/saved-position-card.component";
import { PositionsModule } from "../positions/positions.module";
import { GeneralModule } from "../general/general.module";

const routes: Routes = [
  {
    path: '',
    component: SavedBlockComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: environment.routes.saved.savedPositions,
        component: SavedPositionsComponent,
        canActivate: [AuthGuardService]
      },
    ]
  },
  { path: '', redirectTo: environment.routes.saved.savedPositions, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    SavedBlockComponent,
    SavedPositionsComponent,
    SavedPositionCardComponent,
  ],
  exports: [
    SavedBlockComponent,
    SavedPositionsComponent,
    SavedPositionCardComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  imports: [
    CommonModule,
    GeneralModule,
    PositionsModule,
    MatTabsModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
  ],
})
export class SavedModule { }
