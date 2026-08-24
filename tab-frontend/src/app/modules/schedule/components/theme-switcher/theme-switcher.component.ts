import { ChangeDetectionStrategy, Component } from "@angular/core"
import{ ThemeService } from "../../services/theme.service"

@Component({
  selector: "app-theme-switcher",
  templateUrl: "./theme-switcher.component.html",
  styleUrl: "./theme-switcher.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeSwitcherComponent {
  isDropdownOpen = false

  constructor(public themeService: ThemeService) { }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen
  }

  closeDropdown(): void {
    this.isDropdownOpen = false
  }

  setTheme(theme: "light" | "dark" | "system"): void {
    // this.themeService.setTheme(theme)
    this.closeDropdown()
  }
}
