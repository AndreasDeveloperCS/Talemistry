import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { filter, take } from 'rxjs';
import { CommunicationMean } from 'src/app/modules/interviews/models/communication-mean';
import { UserProfileService } from 'src/app/modules/profiles/user-profile/services/user-profile.service';
import { environment } from 'src/environments/environment';
import { NotificationChannel, NotificationChannelId } from '../../models/notification-channel';
import { TelegramConnectionService, TelegramLinkEvent } from '../../services/telegram-connection.service';
import { User } from 'src/app/modules/authentication/models/user';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ContentService } from 'src/app/modules/general/services/content.service';

@Component({
  selector: 'app-notification-preferences-list-view',
  templateUrl: './notification-preferences-list-view.component.html',
  styleUrl: './notification-preferences-list-view.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPreferencesListViewComponent implements OnInit, OnDestroy {
  private telegramWindowRef: Window | null = null;
  private telegramSubscription: any;
  private connectionSubscription: any;
  telegramProgressInfo: string = '';
  CommunicationMean = CommunicationMean;
  isLoading: boolean = true;

  channels: NotificationChannel[] = [
    {
      id: CommunicationMean.email,
      name: "Email Notifications",
      icon: "email",
      image: 'assets/icons/mail.svg',
      description: "Get notified via your registered email address",
      popular: true,
    },
    {
      id: CommunicationMean.sms,
      name: "SMS Messages",
      icon: "sms",
      image: 'assets/icons/phone-solid.svg',
      description: "Receive instant text message alerts on your phone",
    },
    {
      id: CommunicationMean.viber,
      name: "Viber",
      icon: "chat",
      image: 'assets/icons/viber.svg',
      description: "Connect via Viber messenger for quick notifications",
      popular: true,
    },
    {
      id: CommunicationMean.whatsapp,
      name: "WhatsApp",
      icon: "chat_bubble",
      image: 'assets/icons/whatsapp.svg',
      description: "Stay updated through WhatsApp messages",
      popular: true,
    },
    {
      id: CommunicationMean.telegram,
      name: "Telegram Bot",
      icon: "send",
      image: 'assets/icons/telegram.svg',
      description: "Use Telegram bot for automated notifications",
    },
  ];

  constructor(
    private userProfileService: UserProfileService,
    public dialog: MatDialog,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private telegramConnectionService: TelegramConnectionService
  ) { }

  cleanUpTelegramGateWay(): void {
    this.telegramConnectionService.unregisterListener();
    if (this.telegramSubscription) {
      this.telegramSubscription.unsubscribe();
      this.telegramSubscription = null;
    }
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
      this.connectionSubscription = null;
    }
    this.telegramConnectionService.disconnect();
    this.telegramWindowRef?.close();
    this.telegramWindowRef = null;
  }

  ngOnDestroy() {
    this.cleanUpTelegramGateWay()
  }

  ngOnInit() {
    this.applyNotificationPreferences();
  }

  private setupTelegramWebSocketSubscription(): void {
    if (this.telegramSubscription) {
      console.log('⚠️ WebSocket subscription already exists, skipping setup');
      return;
    }

    console.log('📡 Setting up WebSocket subscription (connection will happen on user action)');

    this.telegramSubscription = this.telegramConnectionService.onTelegramLinked
      .subscribe((event: TelegramLinkEvent | null) => {
        console.log('📡 Component: Telegram event data received from service:', event);
        console.log('📊 Component: Event structure check:', {
          hasEvent: !!event,
          hasLinked: event?.linked,
          hasChatId: event?.chatId,
          hasUsername: event?.username,
          hasEnabled: event?.enabled
        });

        if (!event) {
          console.log('⏭️ Component: Skipping null event (initial emission)');
          return; 
        }

        if (event.linked && event.chatId) {
          console.log('✅ Component: Valid Telegram linked event received, processing...');
          this.onTelegramLinked(event);

          console.log('🔌 Component: Unregistering listener after successful link');
          if (this.telegramSubscription) {
            this.telegramSubscription.unsubscribe();
            this.telegramSubscription = null;
          }
          this.telegramConnectionService.unregisterListener();
        } else {
          console.warn('⚠️ Component: Received event but missing required fields. Event:', event);
          console.warn('⚠️ Component: Missing linked?', !event.linked, 'Missing chatId?', !event.chatId);
        }
      });

    console.log('✅ WebSocket subscription established (waiting for user to click Telegram button)');
  }

  applyNotificationPreferences(): void {
    const prefs = this.userProfileService.user.messageNotificationPreferences?.channels;
    console.log('Notification preferences', prefs, this.userProfileService.user);
    const telegramLinked = !!this.userProfileService.user?.telegram?.chatId;

    if (!prefs) {
      return;
    }

    this.channels = this.channels.map(channel => {
      if (channel.id === CommunicationMean.telegram) {
        return {
          ...channel,
          enabled: telegramLinked && !!prefs[CommunicationMean.telegram],
          disabled: !telegramLinked,
        };
      }

      return {
        ...channel,
        enabled: !!prefs[channel.id as NotificationChannelId],
      };
    });
    console.log('Channels', this.channels);
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  onCheckboxChange(channel: NotificationChannel, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (channel.id === CommunicationMean.telegram) {
      event.preventDefault();

      const telegramLinked = !!this.userProfileService.user?.telegram?.chatId;

      if (!telegramLinked) {
        this.connectTelegram();
      } else {
        this.updatePreference(channel, checked);
      }
      return;
    }

    this.updatePreference(channel, checked);
  }

  private updatePreference(channel: NotificationChannel, value: boolean): void {
    channel.enabled = value;
    if (this.userProfileService.user?.messageNotificationPreferences?.channels) {
      this.userProfileService.user.messageNotificationPreferences.channels[channel.id] = value;
    }
  }

  startTelegramPolling(): void {
    const userId = this.userProfileService.user?._id;
    if (!userId) {
      console.error('No user ID available for Telegram registration');
      return;
    }

    this.telegramProgressInfo = 'Waiting for Telegram link...';
    this.cdr.markForCheck();

    // Register to listen for Telegram link events via WebSocket
    this.telegramConnectionService.registerListener(userId);
  }

  private onTelegramLinked(status: TelegramLinkEvent): void {
    console.log('🔔 ========== STEP 6: TELEGRAM LINKED NOTIFICATION RECEIVED ==========');
    console.log('🔗 onTelegramLinked: Processing Telegram linked event from backend:', status);
    console.log('📅 onTelegramLinked: Event timestamp:', new Date().toISOString());
    console.log('📋 onTelegramLinked: Event details:', {
      linked: status.linked,
      chatId: status.chatId,
      username: status.username,
      enabled: status.enabled
    });
    console.log('🪟 onTelegramLinked: Current window state:', {
      exists: !!this.telegramWindowRef,
      closed: this.telegramWindowRef?.closed
    });

    const telegram = this.channels.find(c => c.id === CommunicationMean.telegram);
    if (!telegram) {
      console.error('❌ onTelegramLinked: Telegram channel not found in channels array');
      return;
    }
    console.log('📱 onTelegramLinked: Found telegram channel in state:', {
      enabled: telegram.enabled,
      disabled: telegram.disabled,
      pending: telegram.pending
    });

    // STEP 6.1: Close the Telegram window immediately after binding is completed
    console.log('🔒 onTelegramLinked: STEP 6.1 - Closing Telegram window');
    if (this.telegramWindowRef && !this.telegramWindowRef.closed) {
      try {
        this.telegramWindowRef.close();
        console.log('✅ onTelegramLinked: Telegram window closed after successful binding');
      } catch (err) {
        console.warn('⚠️ onTelegramLinked: Could not close Telegram window:', err);
      }
    } else {
      console.log('ℹ️ onTelegramLinked: Telegram window already closed or not found');
    }
    this.telegramWindowRef = null;
    console.log('🧹 onTelegramLinked: Telegram window reference cleared');

    // STEP 6.2: Update telegram data in the model
    console.log('📝 onTelegramLinked: STEP 6.2 - Updating model with chat_id:', status.chatId);

    if (status?.chatId) {
      if (!this.userProfileService.user) {
        console.error('❌ onTelegramLinked: User model not available');
        return;
      }

      console.log('📊 onTelegramLinked: Current user model state before update:', {
        hasTelegram: !!this.userProfileService.user.telegram,
        currentChatId: this.userProfileService.user.telegram?.chatId
      });

      // Ensure telegram object exists
      if (!this.userProfileService.user.telegram) {
        console.log('🔨 onTelegramLinked: Creating telegram object in user model');
        this.userProfileService.user.telegram = {} as any;
      }

      // Update telegram data with received chatId
      if (this.userProfileService.user.telegram) {
        console.log('🔄 onTelegramLinked: Updating telegram data in user model');
        this.userProfileService.user.telegram.chatId = status.chatId;
        this.userProfileService.user.telegram.username = status.username;
        this.userProfileService.user.telegram.enabled = status.enabled;
      }

      console.log('✅ onTelegramLinked: Updated user telegram data:', this.userProfileService.user.telegram);

      // Update notification preferences
      if (!this.userProfileService.user.messageNotificationPreferences) {
        console.log('🔨 onTelegramLinked: Creating messageNotificationPreferences object');
        this.userProfileService.user.messageNotificationPreferences = { channels: {} as any };
      }
      if (!this.userProfileService.user.messageNotificationPreferences.channels) {
        console.log('🔨 onTelegramLinked: Creating channels object in preferences');
        this.userProfileService.user.messageNotificationPreferences.channels = {} as any;
      }

      this.userProfileService.user.messageNotificationPreferences.channels.telegram = true;
      console.log('✅ onTelegramLinked: Updated notification preferences to enable telegram');
    } else {
      console.error('❌ onTelegramLinked: No chatId in status, cannot update model. Status:', status);
      return;
    }

    // STEP 6.3: Refresh UI and automatically enable checkbox
    console.log('🔄 onTelegramLinked: STEP 6.3 - Applying notification preferences to update UI');
    this.applyNotificationPreferences();

    // Update telegram channel state
    telegram.enabled = true; // Automatically enable checkbox
    telegram.disabled = false; // Make it interactive
    telegram.pending = false; // Clear pending state

    // Update progress message
    this.telegramProgressInfo = 'Telegram successfully linked! ✓';
    console.log('✅ onTelegramLinked: Progress info updated:', this.telegramProgressInfo);

    // Verify the channel state after applying preferences
    const updatedTelegram = this.channels.find(c => c.id === CommunicationMean.telegram);
    console.log('📱 onTelegramLinked: Final telegram channel state:', {
      enabled: updatedTelegram?.enabled,
      disabled: updatedTelegram?.disabled,
      pending: updatedTelegram?.pending,
      chatIdInModel: this.userProfileService.user?.telegram?.chatId
    });

    // Verify complete model state
    console.log('🔍 onTelegramLinked: Final model verification:', {
      userHasTelegram: !!this.userProfileService.user?.telegram,
      chatId: this.userProfileService.user?.telegram?.chatId,
      username: this.userProfileService.user?.telegram?.username,
      enabled: this.userProfileService.user?.telegram?.enabled,
      preferenceEnabled: this.userProfileService.user?.messageNotificationPreferences?.channels?.telegram
    });

    // Force change detection to update the view
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    console.log('🔄 onTelegramLinked: Change detection triggered');

    console.log('✅ ========== TELEGRAM LINKING COMPLETED SUCCESSFULLY ==========');
    console.log('✅ onTelegramLinked: Window closed, model updated, checkbox enabled automatically');
  }

  connectTelegram(): void {
    console.log('🔌 connectTelegram: User clicked Telegram button - starting connection process');

    const telegram = this.channels.find(c => c.id === CommunicationMean.telegram);
    if (telegram) {
      telegram.pending = true;
      telegram.disabled = true; // prevent toggles while linking
      this.cdr.markForCheck();
    }

    const userId = this.userProfileService.user?._id;
    if (!userId) {
      console.error('❌ connectTelegram: No user ID available');
      if (telegram) {
        telegram.pending = false;
        telegram.disabled = false;
      }
      this.cdr.markForCheck();
      return;
    }

    const userIdString = userId.toString();

    // STEP 1: Setup WebSocket subscription (before connecting)
    console.log('📡 connectTelegram: STEP 1 - Setting up WebSocket subscription');
    this.setupTelegramWebSocketSubscription();

    // STEP 2: Initiate WebSocket connection (only happens when user clicks button)
    console.log('🔌 connectTelegram: STEP 2 - Initiating WebSocket connection for userId:', userIdString);
    this.telegramProgressInfo = 'Connecting to notification service...';
    this.cdr.markForCheck();
    this.cdr.detectChanges();

    // Check if already connected BEFORE subscribing
    const isConnected = this.telegramConnectionService.isConnected();
    console.log('📊 connectTelegram: Current connection status:', isConnected);

    if (isConnected) {
      // Already connected - proceed immediately without waiting
      console.log('✅ connectTelegram: STEP 2 - Already connected! Proceeding immediately...');
      // Still call connect to ensure registration
      this.telegramConnectionService.connect(userIdString);
      // Skip to STEP 4
      console.log('🚀 connectTelegram: STEP 4 - Proceeding with token generation and window opening');
      this.proceedWithTelegramLink(userIdString, telegram);
    } else {
      // Not connected yet - need to connect and wait
      console.log('⏳ connectTelegram: STEP 2 - Not connected yet, initiating connection...');

      // Subscribe BEFORE calling connect to avoid race condition
      this.connectionSubscription = this.telegramConnectionService.connected
        .pipe(
          filter(connected => {
            console.log('📡 connectTelegram: Connection status update received:', connected);
            return connected === true;
          }),
          take(1)
        )
        .subscribe(connected => {
          console.log('✅ connectTelegram: STEP 3 COMPLETE - WebSocket connected successfully!');

          // Clean up subscription after successful connection
          if (this.connectionSubscription) {
            this.connectionSubscription.unsubscribe();
            this.connectionSubscription = null;
          }

          // STEP 4: Generate token and open Telegram window AFTER connection is confirmed
          console.log('🚀 connectTelegram: STEP 4 - Proceeding with token generation and window opening');
          this.proceedWithTelegramLink(userIdString, telegram);
        });

      // Now call connect - the subscription above will receive the 'connect' event
      console.log('🔌 connectTelegram: STEP 3 - Calling connect() and waiting for confirmation...');
      this.telegramConnectionService.connect(userIdString);
    }
  }

  private proceedWithTelegramLink(userId: string, telegram: NotificationChannel | undefined): void {
    console.log('📝 proceedWithTelegramLink: STEP 4 - Generating Telegram connect token for userId:', userId);

    this.telegramProgressInfo = 'Generating secure link...';
    this.cdr.markForCheck();

    this.userProfileService.generateTelegramConnectToken().pipe(take(1)).subscribe({
      next: ({ token }) => {
        console.log('✅ proceedWithTelegramLink: STEP 4.1 - Token generated successfully:', token);

        this.telegramProgressInfo = 'Opening Telegram...';
        this.cdr.markForCheck();

        const botUsername = environment.socialLogin.TELEGRAM.BOT_NAME;
        const telegramUrl = `https://t.me/${botUsername}?start=${encodeURIComponent(token)}`;

        console.log('🪟 proceedWithTelegramLink: STEP 4.2 - Opening Telegram window');
        console.log('🔗 proceedWithTelegramLink: Telegram URL:', telegramUrl);

        // Open the Telegram window
        this.telegramWindowRef = window.open(
          telegramUrl,
          'telegramConnect',
          'width=600,height=700'
        );

        // Check if popup was blocked
        if (!this.telegramWindowRef) {
          console.error('❌ proceedWithTelegramLink: Popup blocked by browser');
          this.telegramProgressInfo = 'Popup blocked. Please allow popups for this site.';
          if (telegram) {
            telegram.pending = false;
            telegram.disabled = false;
          }
          this.telegramConnectionService.unregisterListener();
          this.cdr.markForCheck();
          return;
        }

        console.log('✅ proceedWithTelegramLink: STEP 4.3 - Telegram window opened successfully');
        this.telegramProgressInfo = 'Waiting for Telegram authorization...';
        console.log('⏳ proceedWithTelegramLink: STEP 5 - Waiting for user to authorize in Telegram and backend to save chat_id...');
        console.log('📡 proceedWithTelegramLink: WebSocket subscription is active and will receive notification when backend sends chat_id');
        this.cdr.markForCheck();
      },

      error: (err) => {
        console.error('❌ proceedWithTelegramLink: Token generation failed:', err);
        this.telegramProgressInfo = 'Failed to generate link. Please try again.';
        if (telegram) {
          telegram.pending = false;
          telegram.disabled = false;
        }
        this.cdr.markForCheck();
        this.resetTelegramState();
      },
    });
  }


  resetTelegramState(): void {
    // Disconnect WebSocket listener
    this.telegramConnectionService.unregisterListener();

    // Clean up subscriptions
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
      this.connectionSubscription = null;
    }

    // best-effort close if still open
    try { this.telegramWindowRef?.close(); } catch { }
    this.telegramWindowRef = null;

    const telegram = this.channels.find(c => c.id === CommunicationMean.telegram);
    if (!telegram) return;

    telegram.pending = false;
    telegram.disabled = false;
    telegram.enabled = false;

    if (this.userProfileService.user?.messageNotificationPreferences?.channels) {
      this.userProfileService.user.messageNotificationPreferences.channels.telegram = false;
    }

    this.cdr.markForCheck();

    
  }

  savePreferrences() {
    console.log('saveProfile', this.userProfileService.user);
    
    if (this.userProfileService.user.messageNotificationPreferences) {
      this.userProfileService.updateAsync(this.userProfileService.user, true)
        .pipe(take(1)).subscribe({
          next: (user: User) => {
            console.log('Preferrences have been updated', user);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Preferrences have been updated!" }
            });
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error("Error while updating the preferrences!", err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while updating the user!" }
            });
          }
        });
    } else {
      this.dialog.open(WarningsErrorsDialogComponent, {
        data: { message: "Error while updating the preferrences!" }
      });
    }
  }
}
