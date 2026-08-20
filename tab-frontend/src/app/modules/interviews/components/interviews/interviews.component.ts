import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-interviews',
  standalone: false,
  templateUrl: './interviews.component.html',
  styleUrl: './interviews.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewsComponent {

}
