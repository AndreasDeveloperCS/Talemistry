import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MeetingPlatfrom } from 'src/app/modules/meetings/models/meeting';
import { MeetingTemplate } from '../../models/meeting-template';

@Component({
  selector: 'app-meeting-template-card',
  templateUrl: './meeting-template-card.component.html',
  styleUrl: './meeting-template-card.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingTemplateCardComponent {
  @Input()
  template!: MeetingTemplate;

  @Output() delete = new EventEmitter<string>();

  ngOnInit(): void {
    console.log('MeetingTemplateCardComponent initialized with template:', this.template);
   }

  getPlatformName(value: number): string {
    return MeetingPlatfrom[value];
  }

  onDeleteClick(): void {
    this.delete.emit(this.template._id);
  }
}
