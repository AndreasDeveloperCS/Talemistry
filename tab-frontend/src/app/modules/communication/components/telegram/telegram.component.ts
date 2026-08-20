import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-telegram',
  templateUrl: './telegram.component.html',
  styleUrl: './telegram.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelegramComponent {

}
