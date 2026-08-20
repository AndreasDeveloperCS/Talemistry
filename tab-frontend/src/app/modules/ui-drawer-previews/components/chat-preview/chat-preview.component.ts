import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';
import { SunSpinnerComponent } from 'src/app/modules/general/components/sun-spinner/sun-spinner.component';
import { UiInteractionService } from 'src/app/modules/general/services/ui-interaction.service';
import { ChatMessage, MessageType } from 'src/app/modules/interviews/models/chat-message';
import { ChatMessageSendPayload, IChatMessageResponse } from 'src/app/modules/interviews/models/chat-message-payload';
import { ChatRoom, ChatRoomType } from 'src/app/modules/interviews/models/chat-room';
import { CommunicationMean } from 'src/app/modules/interviews/models/communication-mean';
import { ChatMessageService } from 'src/app/modules/interviews/services/chat-message.service';
import { ChatRoomService } from 'src/app/modules/interviews/services/chat-room.service';
import { NotificationTemplate } from 'src/app/modules/pipeline-board/enums/notification-templates.enum';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-chat-preview',
  templateUrl: './chat-preview.component.html',
  styleUrl: './chat-preview.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, SunSpinnerComponent,],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatPreviewComponent implements OnInit {
  @ViewChild('messagesContainer')
  messagesContainer!: ElementRef<HTMLDivElement>;

  @Input() 
  contactId!: string;

  @Input() 
  selectedPositionId!: string;

  userId: string = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  roomId!: string;
  candidateName: string = '';
  candidatePhotoUrl: string = '';
  messages: IChatMessageResponse[] = [];
  messageText: string = '';
  messagesPageIndex: number = 0;
  messagesPageSize: number = 50;
  preferredMeans: CommunicationMean[] = [];
  selectedCommunicationMeans: CommunicationMean[] = [];

  communicationMeans: CommunicationMean[] = [
    CommunicationMean.sms,
    CommunicationMean.email,
    CommunicationMean.whatsapp,
    CommunicationMean.telegram
  ];

  isLoading: boolean = true;
  isLoadingMoreMessages = false;
  hasMoreMessages = true;

  constructor(
    private cdr: ChangeDetectorRef,
    private chatRoomService: ChatRoomService,
    private chatMessageService: ChatMessageService,
    private uiInteractionService: UiInteractionService,
  ) {}

  ngOnInit(): void {
    this.initializeChat();
  }

  initializeChat(): void {
    this.createDirectChatRoom(this.contactId)
      .pipe(take(1))
      .subscribe((room: ChatRoom) => {
        console.log('Chat room:', room);

        if (!room) {
          return;
        }

        this.roomId = room._id;
        this.loadMessages(this.roomId);
        this.getTalentMessagePreferences(this.contactId);
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  private createDirectChatRoom(contactId: string) {
    const chatRoom: ChatRoom = {
      positionId: this.selectedPositionId || '',
      participants: [
        {
          userId: this.userId,
          joinedAt: new Date()
        },
        {
          userId: contactId,
          joinedAt: new Date()
        }
      ],
      type: ChatRoomType.DIRECT,
      userId: this.userId,
      createdBy: this.userId,
      createdDate: new Date()
    };

    return this.chatRoomService.createAsync(chatRoom, true, false);
  }

  loadMessages(roomId: string, pageIndex: number = this.messagesPageIndex, appendOldMessages: boolean = false): void {
    if (this.isLoadingMoreMessages) {
      return;
    }

    this.isLoadingMoreMessages = true;
    const previousHeight = this.messagesContainer?.nativeElement?.scrollHeight || 0;
    const oldestMsg = this.messages[0];
    const before = oldestMsg?.createdDate ? new Date(oldestMsg.createdDate).toISOString() : undefined;
    const beforeId = oldestMsg?._id ? String(oldestMsg._id) : undefined;

    this.chatMessageService
      .getRecentByRoomId(roomId, this.messagesPageSize, before, beforeId, true)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          const loadedMessages = (response.items || []).reverse();
          const candidateMessage = loadedMessages.find(
            (m: IChatMessageResponse) => m.senderId !== this.userId
          );
          if (candidateMessage) {
            this.candidateName = candidateMessage.senderName || 'Candidate';
            this.candidatePhotoUrl = candidateMessage.senderPhotoUrl || '';
          }
          if (!loadedMessages.length) {
            this.hasMoreMessages = false;
          }
          if (appendOldMessages) {
            this.messages = [...loadedMessages, ...this.messages];
            this.cdr.markForCheck();
            setTimeout(() => {
              const container = this.messagesContainer.nativeElement;
              const newHeight = container.scrollHeight;
              container.scrollTop = newHeight - previousHeight;
            });
          } else {
            this.messages = loadedMessages;
            this.cdr.markForCheck();
            this.scrollToBottom();
          }
          this.isLoadingMoreMessages = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading messages', err);
          this.isLoadingMoreMessages = false;
        }
      });
  }

  onMessagesScroll(): void {
    const container = this.messagesContainer.nativeElement;
    if (container.scrollTop <= 100 && !this.isLoadingMoreMessages && this.hasMoreMessages) {
      this.messagesPageIndex++;
      this.loadMessages(this.roomId, this.messagesPageIndex, true);
    }
  }

  sendMessage(event?: any): void {
    if (event) {
      event.preventDefault();
    }
    if (!this.messageText.trim()) {
      return;
    }

    const message: ChatMessageSendPayload = {
      roomId: this.roomId,
      positionId: this.selectedPositionId || '',
      senderId: this.userId,
      receiverId: this.contactId,
      userId: this.userId,
      createdBy: this.userId,
      createdDate: new Date(),
      content: this.messageText.trim(),
      type: MessageType.TEXT,
      status: {
        deliveredTo: [],
        readBy: []
      },
      templateName: NotificationTemplate.NEW_CHAT_MESSAGE,
      selectedCommunicationMeans: this.selectedCommunicationMeans
    };

    this.chatMessageService
      .createAsync(message, true, false)
      .pipe(take(1))
      .subscribe({
        next: (res: ChatMessage) => {
          if (res) {
            this.messages.push(res);
          }
          this.messageText = '';
          this.scrollToBottom();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error sending message', err);
        }
      });
  }

  private getTalentMessagePreferences(contactId: string): void {
    this.chatMessageService
      .getPreferredCommunicationMeans(contactId, this.chatMessageService.defaultCommunicationMeans)
      .pipe(take(1))
      .subscribe((preferredMeans: CommunicationMean[]) => {
        this.preferredMeans = preferredMeans;
        this.selectedCommunicationMeans = [...preferredMeans];
        this.cdr.markForCheck();
      });
  }

  getIcon(communicationMean: CommunicationMean): string {
    switch (communicationMean) {
      case CommunicationMean.email:
        return 'assets/icons/mail.svg';
      case CommunicationMean.sms:
        return 'assets/icons/sms.svg';
      case CommunicationMean.whatsapp:
        return 'assets/icons/whatsapp.svg';
      case CommunicationMean.telegram:
        return 'assets/icons/telegram.svg';
      default:
        return 'assets/icons/phone-solid.svg';
    }
  }

  toggleCommunicationMean(communicationMean: CommunicationMean): void {
    const exists = this.selectedCommunicationMeans.includes(communicationMean);

    if (exists) {
      this.selectedCommunicationMeans = this.selectedCommunicationMeans.filter(m => m !== communicationMean);
    } else {
      this.selectedCommunicationMeans = [...this.selectedCommunicationMeans, communicationMean];
    }
    this.cdr.markForCheck();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (!this.messagesContainer) {
        return;
      }
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    });
  }

  isNewDate(currentMessage: ChatMessage, previousMessage?: ChatMessage): boolean {
    if (!previousMessage) {
      return true;
    }

    const current = new Date(currentMessage.createdDate).toDateString();
    const previous = new Date(previousMessage.createdDate).toDateString();
    return current !== previous;
  }

  shouldShowAvatar(current: ChatMessage, previous?: ChatMessage): boolean {
    if (!previous) {
      return true;
    }
    return previous.senderId !== current.senderId;
  }

  openCandidate(talentId: any): void {
    this.uiInteractionService.openDrawer({
      type: 'candidate',
      id: talentId,
      payload: {
        photoUrl: this.candidatePhotoUrl,
        name: this.candidateName
      }
    });
  }
}
