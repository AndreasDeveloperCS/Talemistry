import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Pillar } from '../../models/pillar';
import { PILLARS } from '../../models/pillars.data';

@Component({
  selector: 'app-pillars',
  standalone: false,
  templateUrl: './pillars.component.html',
  styleUrl: './pillars.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PillarsComponent {
  values: Pillar[] = PILLARS

  onExploreMore(value: Pillar): void {
    console.log("Explore more clicked for:", value.title)
  }

  onJoinUs(): void {
    console.log("Join us clicked")
  }

  onLearnMore(): void {
    console.log("Learn more clicked")
  }
}
