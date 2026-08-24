import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-motivational-factors-block',
  templateUrl: './motivational-factors-block.component.html',
  styleUrl: './motivational-factors-block.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MotivationalFactorsBlockComponent {
  constructor(public content: ContentService) {}
}
