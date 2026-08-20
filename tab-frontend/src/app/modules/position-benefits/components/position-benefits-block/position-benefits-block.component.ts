import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-position-benefits-block',
  templateUrl: './position-benefits-block.component.html',
  styleUrl: './position-benefits-block.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionBenefitsBlockComponent {
  constructor(public content: ContentService) {}
}
