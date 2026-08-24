import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AuthService } from './modules/authentication/services/auth.service';
import { ThemeService } from './services/theme-switcher.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'Talent Acquisition Platform';

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
  ) {
    authService.refreshUserPermissions();
  }

  ngOnInit() {
    this.themeService.initTheme();
  }
}
