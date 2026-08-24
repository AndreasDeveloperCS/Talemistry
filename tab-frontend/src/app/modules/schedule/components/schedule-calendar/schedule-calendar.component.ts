import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScheduleService } from '../../services/schedule-services';

@Component({
  selector: 'app-schedule-calendar',
  standalone: false,
  templateUrl: './schedule-calendar.component.html',
  styleUrl: './schedule-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleCalendarComponent {

}
