import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScheduleDefaultSettingsService } from '../../services/schedule-default-settings.service';
import { ContentService } from '../../../general/services/content.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-schedule-time-frames-settings',
  templateUrl: './schedule-time-frames-settings.component.html',
  styleUrl: './schedule-time-frames-settings.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleTimeFramesSettingsComponent {
  activeTab = "timeSlots";
  userId: any;

  constructor(
    private scheduleSettingService: ScheduleDefaultSettingsService,
    public content: ContentService,
  ) {
    this.userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  }

  getScheduleLink(): string {
    return this.scheduleSettingService.getScheduleLink();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.getScheduleLink());
  }

  copyIFrameToClipboard(): void {
    navigator.clipboard.writeText(`<iframe src="${this.getScheduleLink()}" width="100%" height="600" frameborder="0"></iframe>`);
  }
}
