import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-sun-spinner',
  templateUrl: './sun-spinner.component.html',
  styleUrl: './sun-spinner.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SunSpinnerComponent {
  rays = new Array(8);
}
