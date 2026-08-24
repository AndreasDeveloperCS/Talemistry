import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-recruiter-profile',
  templateUrl: './recruiter-profile.component.html',
  styleUrl: './recruiter-profile.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruiterProfileComponent {

}
