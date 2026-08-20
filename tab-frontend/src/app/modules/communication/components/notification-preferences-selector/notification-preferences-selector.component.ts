import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-notification-preferences-selector',
  templateUrl: './notification-preferences-selector.component.html',
  styleUrl: './notification-preferences-selector.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPreferencesSelectorComponent {
  selectedVariant: "v1" | "v2" | "v3" = "v1";

  selectVariant(variant: "v1" | "v2" | "v3"): void {
    this.selectedVariant = variant;
  }
}
