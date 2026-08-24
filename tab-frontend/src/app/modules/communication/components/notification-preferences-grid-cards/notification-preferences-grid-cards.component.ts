import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NotificationChannel } from '../../models/notification-channel';
import { CommunicationMean } from 'src/app/modules/interviews/models/communication-mean';

@Component({
  selector: 'app-notification-preferences-grid-cards',
  templateUrl: './notification-preferences-grid-cards.component.html',
  styleUrl: './notification-preferences-grid-cards.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPreferencesGridCardsComponent {
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

  toggleChannel(channel: NotificationChannel): void {
    channel.enabled = !channel.enabled
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
