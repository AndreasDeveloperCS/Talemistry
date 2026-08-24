import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contact-us-wrapper',
  templateUrl: './contact-us-wrapper.component.html',
  styleUrl: './contact-us-wrapper.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactUsWrapperComponent {
  constructor(
    private router: Router,
  ) { 
    window.scrollTo(0, 0);
  }

  goBack(): void {
    this.router.navigate(["/main"]);
  }
}
