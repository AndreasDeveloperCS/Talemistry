import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthenticationComponent {

}
