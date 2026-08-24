import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'app-theme';

  setTheme(theme: 'light' | 'dark') {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem(this.storageKey, theme);
  }

  getTheme(): 'light' | 'dark' {
    return (localStorage.getItem(this.storageKey) as 'light' | 'dark') || 'dark';
  }

  toggleTheme() {
    const current = this.getTheme();
    this.setTheme(current === 'light' ? 'dark' : 'light');
  }

  initTheme() {
    const saved = localStorage.getItem(this.storageKey);

    if (!saved) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    } else {
      this.setTheme(saved as 'light' | 'dark');
    }
  }
}