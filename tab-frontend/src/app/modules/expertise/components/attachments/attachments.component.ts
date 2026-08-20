import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-attachments',
  templateUrl: './attachments.component.html',
  styleUrl: './attachments.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttachmentsComponent {
  confirmWithoutAttachment: boolean = true;

  constructor(public content: ContentService) { }

}
