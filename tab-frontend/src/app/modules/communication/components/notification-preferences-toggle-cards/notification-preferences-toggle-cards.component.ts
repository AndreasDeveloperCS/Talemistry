import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NotificationChannel } from '../../models/notification-channel';
import { CommunicationMean } from 'src/app/modules/interviews/models/communication-mean';

@Component({
  selector: 'app-notification-preferences-toggle-cards',
  templateUrl: './notification-preferences-toggle-cards.component.html',
  styleUrl: './notification-preferences-toggle-cards.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPreferencesToggleCardsComponent {
  getIcon(communicationMean: CommunicationMean): string {
    switch (communicationMean) {
      case CommunicationMean.phone:
        return 'assets/icons/phone-solid.svg';
      case CommunicationMean.email:
        return 'assets/icons/mail.svg';
      case CommunicationMean.sms:
        return 'assets/icons/sms.svg';
      case CommunicationMean.whatsapp:
        return 'assets/icons/whatsapp.svg';
      case CommunicationMean.viber:
        return 'assets/icons/viber.svg';
      case CommunicationMean.telegram:
        return 'assets/icons/telegram.svg';
      default:
        return 'assets/icons/phone-solid.svg';
    }
  }

  channels: NotificationChannel[] = [
    {
      id: CommunicationMean.email,
      name: "Email",
      icon: "email",
      image: 'assets/icons/mail.svg',
      description: "Receive notifications via email",
      enabled: true,
    },
    {
      id: CommunicationMean.sms,
      name: "SMS",
      icon: "sms",
      image: 'assets/icons/phone-solid.svg',
      description: "Get text message alerts",
      enabled: false,
    },
    {
      id: CommunicationMean.viber,
      name: "Viber",
      icon: "chat",
      image: 'assets/icons/viber.svg',
      description: "Viber messenger notifications",
      enabled: true,
    },
    {
      id: CommunicationMean.whatsapp,
      name: "WhatsApp",
      icon: "chat_bubble",
      image: 'assets/icons/whatsapp.svg',
      description: "WhatsApp message alerts",
      enabled: false,
    },
    {
      id: CommunicationMean.telegram,
      name: "Telegram",
      icon: "send",
      image: 'assets/icons/telegram.svg',
      description: "Telegram bot notifications",
      enabled: true,
    },
  ]

  hasChanges = false
  isSaving = false

  onToggleChange(): void {
    this.hasChanges = true
  }

  savePreferences(): void {
    this.isSaving = true

    // Simulate API call
    setTimeout(() => {
      console.log("Saving preferences:", this.channels)
      this.isSaving = false
      this.hasChanges = false
    }, 1000)
  }

  getEnabledCount(): number {
    return this.channels.filter((ch) => ch.enabled).length
  }
}
