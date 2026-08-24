import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProfileComponent {

}
