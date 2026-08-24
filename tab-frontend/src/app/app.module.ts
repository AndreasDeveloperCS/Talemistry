import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { FooterComponent } from './components/navigation/footer/footer.component';
import { HeaderComponent } from './components/navigation/header/header.component';
import { IncomingCallNotifierComponent } from './components/incoming-call-notifier/incoming-call-notifier.component';
import { VideoCallDockComponent } from './components/video-call-dock/video-call-dock.component';
import { RouteReuseStrategy, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { AppRoutingModule } from './app.routes';
import { LoginFieldComponent } from './components/navigation/login-field/login-field.component';
import { AppRouteReuseStrategy } from './strategies/app-route-reuse.strategy';
import { SanitizerUrlPipe } from './modules/general/pipes/sanitizer-url.pipe';
import { ThemeSwitcherComponent } from './modules/general/components/theme-switcher/theme-switcher.component';
import { UiDrawerComponent } from './modules/general/components/ui-drawer/ui-drawer.component';

@NgModule({
  declarations: [
    AppComponent,
    FooterComponent,
    HeaderComponent,
    LoginFieldComponent,
    IncomingCallNotifierComponent,
    VideoCallDockComponent
  ],
  bootstrap: [AppComponent],
  imports: [
    CommonModule,
    BrowserModule,
    MatIconModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    AppRoutingModule,
    SanitizerUrlPipe,
    ThemeSwitcherComponent,
    UiDrawerComponent
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: RouteReuseStrategy,
      useClass: AppRouteReuseStrategy,
    },
  ]
})
export class AppModule { }