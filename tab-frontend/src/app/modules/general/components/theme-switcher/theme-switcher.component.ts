import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from 'src/app/services/theme-switcher.service';

@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrl: './theme-switcher.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeSwitcherComponent {
  isDark = false;

  constructor(private themeService: ThemeService) {
    this.isDark = this.themeService.getTheme() === 'dark';
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.isDark = this.themeService.getTheme() === 'dark';
  }
}
