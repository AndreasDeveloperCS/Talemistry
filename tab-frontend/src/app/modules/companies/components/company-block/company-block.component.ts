import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FUNCTIONALBLOCK } from '../../../permissions/models/functional-block-enum';
import { ContentService } from '../../../general/services/content.service';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';

@Component({
  selector: 'app-company-block',
  templateUrl: './company-block.component.html',
  styleUrl: './company-block.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyBlockComponent {
  
}
