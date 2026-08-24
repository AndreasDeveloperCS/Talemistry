import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-interviewer-profile',
  templateUrl: './interviewer-profile.component.html',
  styleUrl: './interviewer-profile.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewerProfileComponent {

}
