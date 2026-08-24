import { Injectable, signal } from "@angular/core"

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private darkMode = signal<boolean>(false)

  constructor() {
    // Check for user preference or saved theme
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      this.darkMode.set(true)
    }
  }

  isDarkMode() {
    return this.darkMode()
  }

  toggleTheme() {
    const newValue = !this.darkMode()
    this.darkMode.set(newValue)
    localStorage.setItem("theme", newValue ? "dark" : "light")
  }
}
