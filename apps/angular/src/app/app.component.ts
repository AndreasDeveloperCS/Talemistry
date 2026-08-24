import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { ShellComponent } from './shared/shell.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ShellComponent],
  template: `
    <tal-shell>
      <router-outlet />
    </tal-shell>
  `,
})
export class AppComponent {}
