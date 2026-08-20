import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, defer, finalize, firstValueFrom, map, Observable, of, shareReplay, Subject, Subscription, switchMap, take, takeUntil, tap } from 'rxjs';
import { ROLES } from 'src/app/modules/authentication/models/roles';
import { Filtering, FilterRule, Sorting } from 'src/app/modules/general/services/search-logic.service';
import { environment } from '../../../../../environments/environment';
import { AuthService, convertRoleToRoute } from '../../../authentication/services/auth.service';
import { NotificationTemplate } from '../../../pipeline-board/enums/notification-templates.enum';
import { TalentPipelineProgressService } from '../../../position-management/services/talent-pipeline-progress.service';
import { PositionsService } from '../../../positions/services/positions.service';
import { DirectChatContactLookup, UserProfileService } from '../../../profiles/user-profile/services/user-profile.service';
import { DirectCallMessageMeta, IChatMessageResponse, IChatRoomSummary, IContact, IOpenPosition } from '../../models/chat-message-payload';
import { ChatRoom, ChatRoomType, ParticipantRole } from '../../models/chat-room';
import { CommunicationMean } from '../../models/communication-mean';
import { IEnrichedVideoChatRoom, VideoChatRoom, VideoChatRoomType } from '../../models/video-chat-room';
import { ChatMessageService } from '../../services/chat-message.service';
import { ChatRoomService } from '../../services/chat-room.service';
import { DirectCallInvitation, DirectCallInviteAck, DirectCallType, TextChatService } from '../../services/text-chat.service';
import { VideoChatRoomService } from '../../services/video-chat-room.service';
import { transformChatDate } from '../../utils/chat-date-transformer';

interface ChatContactView extends IContact {
  lastMessageDateRaw?: Date | string;
  roomType?: ChatRoomType;
  participantCount?: number;
}

interface ConversationPopup {
  id: string;
  kind: 'message' | 'call';
  text: string;
  avatar?: string;
  initials: string;
  name?: string;
  roomId: string;
  roomName?: string;
  chatRoomId?: string;
  callType?: DirectCallType;
  counterpartUserId?: string;
  closing?: boolean;
}

interface DirectCallSessionContext {
  roomId: string;
  chatRoomId: string;
  counterpartUserId: string;
  counterpartName?: string;
  callType: DirectCallType;
  role: 'caller' | 'callee';
  startedAt: number;
  answeredAt?: number;
}

interface CommunicationListItem {
  id: string;
  kind: 'direct' | 'room' | 'group';
  title: string;
  subtitle: string;
  searchText: string;
  timestamp: number;
  unreadCount: number;
  initials: string;
  avatarUrl?: string;
  dateLabel?: string;
  directContact?: ChatContactView;
  videoRoom?: IEnrichedVideoChatRoom;
}

interface ConversationHistoryCacheEntry {
  roomId: string;
  messages: IChatMessageResponse[];
  hasMore: boolean;
}

@Component({
  selector: 'app-text-chat',
  standalone: false,
  templateUrl: './text-chat.component.html',
  styleUrl: './text-chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextChatComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('msgList') msgList!: ElementRef<HTMLDivElement>;
  @ViewChildren('msgElement') messageElements!: QueryList<ElementRef>;

  isLoadingOlder = false;
  isFirstMessagesLoad = true;

  private subs: Subscription[] = [];
  protected _onDestroy = new Subject<void>();
  isCollapsed = false;
  isOverlay = false;
  isSidebarDetailsExpanded = true;
  isRoomPassportExpanded = false;
  roomId: string = '';
  currentRoom!: ChatRoom;
  input = '';
  messages: IChatMessageResponse[] = [];
  typingIndicator = new Set<string>();
  isLoading: boolean = true;
  userId = sessionStorage.getItem(`${environment.storage.userId}`);
  contactSearch = '';
  allContactsField: string = "All";
  communicationMeans: CommunicationMean[] = [
    CommunicationMean.sms,
    CommunicationMean.email,
    CommunicationMean.whatsapp,
    CommunicationMean.telegram
  ];
  callNotificationMeans: CommunicationMean[] = [
    CommunicationMean.whatsapp,
    CommunicationMean.telegram,
    CommunicationMean.email,
    CommunicationMean.sms,
  ];
  selectedCommunicationMeans: CommunicationMean[] = [];
  preferredMeans: CommunicationMean[] = [];
  contacts: ChatContactView[] = [];
  newDirectChatIdentifier = '';
  newDirectChatTopic = '';
  isCreatingDirectChat = false;
  positions: IOpenPosition[] = [];
  selectedPositionId: string = '';
  selectedRole: any;
  selectedContact: ChatContactView | null = null;
  selectedVideoRoom: IEnrichedVideoChatRoom | null = null;
  isChatLoading: boolean = true;
  isLoadingRooms = false;
  isLoadingVideoRooms = false;
  isStartingCall = false;
  isMigratingDirectRooms = false;
  videoRooms: IEnrichedVideoChatRoom[] = [];
  videoRoomsPageIndex: number = 0;
  videoRoomsTotalNumber: number = 0;
  conversationBanner: string = '';
  selectedCallNotificationMeans: CommunicationMean[] = [];
  isCallNotificationMenuOpen = false;

  private readonly callNotificationChannelsStorageKey = 'text-chat.call-notify.channels';
  private readonly callNotifyWhatsAppStorageKey = 'text-chat.call-notify.whatsapp';
  private readonly directCallSessionStorageKey = 'text-chat.direct-call.session';
  private readonly conversationHistoryCache = new Map<string, ConversationHistoryCacheEntry>();
  private conversationLoadSequence: number = 0;
  private migratedCanonicalDirectRoomIds = new Set<string>();
  private routeRoomId?: string;

  selectedPageSize: number = 20;
  messagesPageSize: number = 10;
  messagesPageIndex: number = 0;
  hasMoreMessages: boolean = false;
  roomsPageIndex: number = 0;
  messagesSorting: Sorting = {
    property: 'createdDate',
    direction: "DESC"
  };
  roomsSorting: Sorting = {
    property: 'modifiedDate',
    direction: "DESC"
  };
  messagesFiltering: Filtering = [];
  roomsFiltering: Filtering = [];
  messagesTotalNumber: number = 0;
  roomsTotalNumber: number = 0;
  markedMessages: Set<string> = new Set();

  popups: ConversationPopup[] = [];

  get filteredConversationItems(): CommunicationListItem[] {
    const term = this.contactSearch.trim().toLowerCase();
    const items = this.buildConversationItems();
    if (!term) {
      return items;
    }

    return items.filter(item => item.searchText.includes(term));
  }

  get selectedContactInitials(): string {
    return this.getContactInitials(this.selectedContact);
  }

  get selectedConversationInitials(): string {
    if (this.selectedVideoRoom) {
      return this.getRoomInitials(this.selectedVideoRoom);
    }

    if (this.isGroupConversationSelected) {
      return this.getGroupInitials(this.selectedContact?.roomName || this.selectedContact?.contactName);
    }

    return this.selectedContactInitials;
  }

  get selectedConversationAvatarUrl(): string | undefined {
    if (this.selectedVideoRoom) {
      return undefined;
    }

    if (this.isGroupConversationSelected) {
      return undefined;
    }

    return this.selectedContact?.photoUrl;
  }

  get selectedConversationTitle(): string {
    if (this.selectedVideoRoom) {
      return this.selectedVideoRoom.name || 'Video room';
    }

    if (this.isGroupConversationSelected) {
      return this.selectedContact?.roomName || this.selectedContact?.contactName || 'Group chat';
    }

    return this.selectedContact?.roomName || this.selectedContact?.contactName || this.selectedContact?.email || 'Choose a conversation';
  }

  get selectedContactSubtitle(): string {
    return this.describeDirectConversation(this.selectedContact);
  }

  get selectedConversationSubtitle(): string {
    if (this.selectedVideoRoom) {
      const participants = this.selectedVideoRoom.participants?.length || 0;
      return `${participants} participant${participants === 1 ? '' : 's'} ready for video collaboration`;
    }

    if (this.isGroupConversationSelected) {
      const count = this.selectedContact?.participantCount || 0;
      return `${count} participant${count === 1 ? '' : 's'} in group`;
    }

    return this.selectedContactSubtitle;
  }

  get hasSelectedConversation(): boolean {
    return this.isDirectConversationSelected || this.isVideoRoomSelected || this.isGroupConversationSelected;
  }

  get selectedRoomId(): string {
    return String(this.selectedVideoRoom?._id || this.selectedContact?.roomId || this.roomId || '').trim();
  }

  get selectedRoomIdShort(): string {
    return this.toCompactId(this.selectedRoomId);
  }

  get selectedConversationModeLabel(): string {
    if (this.selectedVideoRoom) {
      switch (this.selectedVideoRoom.type) {
        case VideoChatRoomType.GROUP:
          return 'Group room';
        case VideoChatRoomType.STAGE:
          return 'Stage room';
        case VideoChatRoomType.SELF:
          return 'Personal room';
        default:
          return 'Direct call room';
      }
    }

    if (this.isGroupConversationSelected) {
      return 'Group chat';
    }

    return 'Direct dialog';
  }

  get selectedConversationAccessLabel(): string {
    if (this.selectedVideoRoom) {
      return this.selectedVideoRoom.isOpenMeeting
        ? 'External join enabled'
        : 'Selected participants only';
    }

    if (this.isGroupConversationSelected) {
      return `Invite only, ${this.selectedContact?.participantCount || 0} participants`;
    }

    if (this.selectedContact) {
      return 'Invite only, 2 participants';
    }

    return 'Select a room to continue';
  }

  get selectedParticipantCount(): number {
    if (this.selectedVideoRoom) {
      return this.selectedVideoRoom.participants?.length || 0;
    }

    if (this.isGroupConversationSelected) {
      return this.selectedContact?.participantCount || 0;
    }

    return this.selectedContact ? 2 : 0;
  }

  get selectedParticipantSummary(): string {
    const count = this.selectedParticipantCount;
    return `${count} participant${count === 1 ? '' : 's'}`;
  }

  get loadedMessageCount(): number {
    return this.messages.length;
  }

  get hasOlderMessagesToLoad(): boolean {
    return this.hasMoreMessages;
  }

  get messageHistoryStatusLabel(): string {
    if (!this.selectedContact) {
      return '';
    }

    if (this.isChatLoading) {
      return 'Loading conversation history...';
    }

    if (!this.loadedMessageCount) {
      return 'No messages yet';
    }

    if (this.hasOlderMessagesToLoad) {
      return `Scroll up to load earlier history.`;
    }

    return `Showing all messages.`;
  }

  get selectedLabelReadinessLabel(): string {
    return this.selectedVideoRoom ? 'Group lanes ready for labels' : 'Topic lanes ready for labels';
  }

  get isDirectConversationSelected(): boolean {
    return !!this.selectedContact && !this.selectedVideoRoom && !this.isGroupConversationSelected;
  }

  get isGroupConversationSelected(): boolean {
    return !!this.selectedContact?.roomType && this.selectedContact.roomType === ChatRoomType.GROUP && !this.selectedVideoRoom;
  }

  get isVideoRoomSelected(): boolean {
    return !!this.selectedVideoRoom;
  }

  get primaryStatValue(): number | string {
    if (this.selectedVideoRoom) {
      return this.selectedVideoRoom.participants?.length || 0;
    }

    return this.messagesTotalNumber;
  }

  get primaryStatLabel(): string {
    return this.selectedVideoRoom ? 'Participants' : 'Messages';
  }

  get primaryStatIcon(): string {
    return this.selectedVideoRoom ? 'groups' : 'forum';
  }

  get secondaryStatValue(): number | string {
    if (this.selectedVideoRoom) {
      return String(this.selectedVideoRoom._id || '').slice(-6).toUpperCase() || 'ROOM';
    }

    return this.selectedCommunicationMeans.length || 0;
  }

  get secondaryStatLabel(): string {
    return this.selectedVideoRoom ? 'Room ID' : 'Channels';
  }

  get secondaryStatIcon(): string {
    return this.selectedVideoRoom ? 'video_call' : 'handshake';
  }

  constructor(private chat: TextChatService,
    private chatRoomService: ChatRoomService,
    private chatMessageService: ChatMessageService,
    private videoChatRoomService: VideoChatRoomService,
    private talentsPipelineProgressService: TalentPipelineProgressService,
    private positionsService: PositionsService,
    private userProfileService: UserProfileService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) { }

  private buildDirectChatLookupContact(
    contact: Partial<DirectChatContactLookup & ChatContactView> | null | undefined,
    fallbackIdentifier?: string,
  ): ChatContactView | null {
    const contactId = String(contact?.contactId || '').trim();
    if (!contactId) {
      return null;
    }

    return this.mergeContactRecords(undefined, {
      contactId,
      contactName: String(contact?.contactName || contact?.pseudonym || contact?.username || contact?.email || fallbackIdentifier || '').trim() || undefined,
      email: String(contact?.email || '').trim() || undefined,
      phone: String(contact?.phone || '').trim() || undefined,
      username: String(contact?.username || '').trim() || undefined,
      pseudonym: String(contact?.pseudonym || '').trim() || undefined,
      role: String(contact?.role || '').trim() || undefined,
      photoUrl: String(contact?.photoUrl || '').trim() || undefined,
      roomId: String(contact?.roomId || '').trim() || undefined,
      roomName: String(contact?.roomName || '').trim() || undefined,
    });
  }

  private lookupDirectChatContact(identifier: string): Observable<ChatContactView | null> {
    const trimmedIdentifier = String(identifier || '').trim();
    if (!trimmedIdentifier) {
      return of(null);
    }

    return this.userProfileService.lookupDirectChatContact(trimmedIdentifier).pipe(
      take(1),
      map((contact) => this.buildDirectChatLookupContact(contact, trimmedIdentifier)),
      catchError((err) => {
        if (err?.status === 404) {
          this.conversationBanner = 'No participant was found for that username or alias, email, or phone.';
        } else {
          console.error('Error looking up direct chat contact', err);
          this.conversationBanner = 'The direct conversation could not be started right now.';
        }

        this.cdr.markForCheck();
        return of(null);
      })
    );
  }

  private hasContactRedirectInUrl(): boolean {
    return !!this.route.snapshot.queryParamMap.get('contactId')
      || !!this.route.snapshot.queryParamMap.get('identifier');
  }

  private buildRecruitmentRoomUrl(roomId: string, view: 'text-chat' | 'video-chat'): string {
    const normalizedRoomId = String(roomId || '').trim();
    if (!normalizedRoomId) {
      return '';
    }

    return `/recruitment/communication/room/${encodeURIComponent(normalizedRoomId)}/${view}`;
  }

  private navigateToRoomView(roomId: string, view: 'text-chat' | 'video-chat'): void {
    const normalizedRoomId = String(roomId || '').trim();
    if (!normalizedRoomId) {
      return;
    }

    const targetUrl = this.buildRecruitmentRoomUrl(normalizedRoomId, view);
    const currentUrl = this.router.url.split('?')[0];
    if (currentUrl === targetUrl) {
      return;
    }

    void this.router.navigate(['/recruitment/communication/room', normalizedRoomId, view]);
  }

  private buildContactFromChatRoom(room: ChatRoom | null | undefined): ChatContactView | null {
    if (!room?._id || room.type !== ChatRoomType.DIRECT) {
      return null;
    }

    const participants = Array.isArray(room.participants) ? room.participants : [];
    const otherParticipant = participants.find((participant) => String(participant.userId ?? participant.contactId ?? '').trim() !== String(this.userId || '').trim())
      || participants[0];
    const contactId = String(otherParticipant?.contactId ?? otherParticipant?.userId ?? '').trim();

    if (!contactId) {
      return null;
    }

    return this.mergeContactRecords(undefined, {
      contactId,
      contactName: String(otherParticipant?.contactName || room.name || '').trim() || undefined,
      email: String(otherParticipant?.email || '').trim() || undefined,
      role: String(otherParticipant?.role || '').trim() || undefined,
      photoUrl: String(otherParticipant?.photoUrl || '').trim() || undefined,
      roomId: String(room._id || '').trim(),
      roomName: String(room.name || '').trim() || undefined,
    });
  }

  private buildContactFromGroupRoom(room: ChatRoom | null | undefined): ChatContactView | null {
    if (!room?._id || room.type !== ChatRoomType.GROUP) {
      return null;
    }

    const participants = Array.isArray(room.participants) ? room.participants : [];
    const roomId = String(room._id || '').trim();

    return {
      contactId: roomId,
      contactName: String(room.name || 'Group chat').trim(),
      roomId,
      roomName: String(room.name || '').trim() || undefined,
      roomType: ChatRoomType.GROUP,
      participantCount: participants.length,
    } as ChatContactView;
  }

  private restoreVideoRoomFromRoute(roomId: string, logErrors: boolean = true): Observable<null> {
    return this.videoChatRoomService.getByIdAsync(roomId, true).pipe(
      take(1),
      map((videoRoom) => {
        const restoredRoom = videoRoom as IEnrichedVideoChatRoom | null;
        if (restoredRoom?._id) {
          if (!this.findVideoRoomById(roomId)) {
            this.videoRooms = [restoredRoom, ...this.videoRooms];
          }

          this.onSelectVideoRoom(restoredRoom, { syncRoute: false });
        }

        return null;
      }),
      catchError((error) => {
        if (logErrors) {
          console.error('Error restoring route room fallback', error);
        }

        return of(null);
      })
    );
  }

  private restoreConversationFromRoute(roomId: string): Observable<string | null> {
    const normalizedRoomId = String(roomId || '').trim();
    if (!normalizedRoomId) {
      return of(null);
    }

    const directContact = this.contacts.find((contact) => String(contact.roomId || '').trim() === normalizedRoomId);
    if (directContact?.contactId) {
      // If this contact represents a GROUP room, use the group handler
      if (directContact.roomType === ChatRoomType.GROUP) {
        this.onSelectGroupRoom(directContact, { syncRoute: false, loadMessages: false });
        return of(directContact.roomId || null);
      }

      return this.initiateContactChat(directContact, { loadMessages: false });
    }

    const localVideoRoom = this.findVideoRoomById(normalizedRoomId);
    if (localVideoRoom?._id) {
      this.onSelectVideoRoom(localVideoRoom, { syncRoute: false });
      return of(null);
    }

    return this.chatRoomService.getByIdAsync(normalizedRoomId, true).pipe(
      take(1),
      switchMap((room) => {
        // Handle GROUP chat rooms directly — don't treat as direct contact
        if (room?.type === ChatRoomType.GROUP) {
          const groupContact = this.buildContactFromGroupRoom(room);
          if (groupContact) {
            this.onSelectGroupRoom(groupContact, { syncRoute: false, loadMessages: false });
            return of(groupContact.roomId || null);
          }
        }

        const restoredContact = this.buildContactFromChatRoom(room);
        if (restoredContact?.contactId) {
          return this.initiateContactChat(restoredContact, { loadMessages: false });
        }

        return this.restoreVideoRoomFromRoute(normalizedRoomId);
      }),
      catchError(() => {
        return this.restoreVideoRoomFromRoute(normalizedRoomId, false);
      })
    );
  }

  ngOnInit(): void {
    this.selectedCallNotificationMeans = this.readStoredCallNotificationMeans();
    this.checkScreenSize(window.innerWidth);
    this.routeRoomId = String(this.route.snapshot.paramMap.get('id') || '').trim() || undefined;

    this.messagesPageIndex = 0;
    this.hasMoreMessages = false;
    this.messages = [];
    this.markedMessages.clear();
    this.messagesTotalNumber = 0;
    this.roomsTotalNumber = 0;
    this.isFirstMessagesLoad = true;
    this.isLoading = true;
    this.isChatLoading = true;

    const idToken = sessionStorage.getItem(
      `${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`
    ) ?? '';

    const roles = this.authService.decodeJWTToken(idToken).user.role;

    if (roles.includes(ROLES.HR) || roles.includes(ROLES.HM) || roles.includes(ROLES.RC)) {
      this.selectedRole = ParticipantRole.RECRUITER;
    } else if (roles.includes(ROLES.TALENT)) {
      this.selectedRole = ParticipantRole.TALENT;
    } else if (roles.includes(ROLES.SA) || roles.includes(ROLES.ADMIN)) {
      this.selectedRole = ParticipantRole.ADMIN;
    }

    this.route.queryParams.pipe(take(1),
      switchMap(params =>
        this.connectChat(idToken).pipe(
          map(() => params)
        )
      ),
      switchMap(params => {
        if (this.routeRoomId) {
          return this.loadExistingChats().pipe(
            switchMap(() => this.restoreConversationFromRoute(this.routeRoomId!))
          );
        }

        const contactId = params['contactId'];
        const name = params['name'];
        const identifier = params['identifier'];

        if (contactId) {
          const contact = this.buildDirectChatLookupContact({ contactId, contactName: name });
          return contact ? this.initiateContactChat(contact) : of(null);
        }

        if (identifier) {
          return this.lookupDirectChatContact(identifier).pipe(
            switchMap((contact) => {
              const resolvedContact = this.mergeContactRecords(contact, { contactName: name || contact?.contactName } as ChatContactView);
              return resolvedContact?.contactId ? this.initiateContactChat(resolvedContact) : of(null);
            })
          );
        }

        return this.loadExistingChats();
      }),
      switchMap(res => {
        if (this.selectedVideoRoom) {
          return of(null);
        }

        if (res) {
          return this.loadMessages(res);
        }
        return this.roomId ? this.loadMessages(this.roomId) : of(null);
      }),
      catchError(err => {
        console.error('Error loading initial messages', err);
        return of(null);
      }),
      tap(res => {
        if (res) {
          this.messages = res.items?.reverse() || [];
          this.applyMessageState(this.messages);
          this.hasMoreMessages = res.hasMore ?? false;
          this.messagesTotalNumber = this.messages.length;
          this.messagesPageIndex = 1;
        } else {
          this.messages = [];
          this.markedMessages.clear();
          this.hasMoreMessages = false;
          this.messagesTotalNumber = 0;
          this.messagesPageIndex = 0;
        }

        this.isChatLoading = false;
        this.isLoading = false;

        this.cdr.markForCheck();

        if (this.isFirstMessagesLoad && this.messages.length > 0) {
          requestAnimationFrame(() => {
            this.scrollToBottom();
            this.isFirstMessagesLoad = false;
          });
        }
      }),
      takeUntil(this._onDestroy)
    ).subscribe();

    this.route.paramMap
      .pipe(takeUntil(this._onDestroy))
      .subscribe((params) => {
        const nextRoomId = String(params.get('id') || '').trim() || undefined;
        if (nextRoomId === this.routeRoomId) {
          return;
        }

        this.routeRoomId = nextRoomId;
        if (!nextRoomId) {
          return;
        }

        const requestId = ++this.conversationLoadSequence;
        this.restoreConversationFromRoute(nextRoomId).pipe(
          take(1),
          switchMap((resolvedRoomId) => {
            if (!resolvedRoomId || this.selectedVideoRoom) {
              return of(null);
            }

            return this.loadSelectedConversationHistory(resolvedRoomId, requestId);
          }),
          catchError((error) => {
            console.error('Error applying room route change', error);
            this.isChatLoading = false;
            this.isLoading = false;
            return of(null);
          })
        ).subscribe(() => {
          this.cdr.markForCheck();
        });
      });

    this.loadVideoRooms().pipe(takeUntil(this._onDestroy)).subscribe();

    this.chat.onMessages().pipe(takeUntil(this._onDestroy)).subscribe(msg => {
      const directCallMeta = this.getCallInviteMeta(msg);

      if (msg.roomId !== this.roomId && msg.senderId !== this.userId) {
        if (!directCallMeta) {
          this.showNewMessagePopup(msg);
        }
      }
      this.updateContactPreview(msg);

      if (msg.roomId !== this.roomId) {
        return;
      }

      if (this.messages.some(m => m._id === msg._id)) {
        return;
      }

      this.messages.push(msg);
      this.messagesTotalNumber++;
      this.syncConversationHistoryCache(msg.roomId);
      this.cdr.markForCheck();

      setTimeout(() => {
        this.scrollToBottom();
      }, 500);
    });

    this.chat.onMessagesRead().pipe(takeUntil(this._onDestroy)).subscribe(({ userId, roomId, messageIds }) => {
      this.updateMessageStatuses(userId, roomId, messageIds);
    });
  }

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      (entries) => {
        const readIds: string[] = [];

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const msgId = entry.target.getAttribute('data-msg-id');
            if (msgId && !this.markedMessages.has(msgId)) {
              const msg = this.messages.find(m => m._id === msgId);
              if (msg && this.userId && msg.senderId !== this.userId) {
                this.markedMessages.add(msgId);
                msg.status.readBy.push({ userId: this.userId, readAt: new Date() });
                readIds.push(msgId);
              }
            }
          }
        });

        if (readIds.length) {
          this.chat.markMessagesRead(readIds);
        }
      },
      {
        root: this.msgList?.nativeElement,
        threshold: 1.0
      }
    );

    this.messageElements.changes.pipe(takeUntil(this._onDestroy)).subscribe(() => {
      this.messageElements.forEach((el) => observer.observe(el.nativeElement));
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.chat.leaveRoom();
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  updateContactPreview(msg: IChatMessageResponse) {
    const contactIndex = this.contacts.findIndex(c => c.roomId === msg.roomId);

    if (contactIndex === -1) {
      return;
    }

    const contact = this.contacts[contactIndex];

    const updatedContact = {
      ...contact,
      lastReadMessageId: msg._id,
      lastMessageText: this.toConversationPreview(msg),
      lastMessageStatus: 'delivered',
      lastMessageDate: transformChatDate(msg.createdDate),
      unreadCount: msg.senderId === this.userId
        ? contact.unreadCount
        : (contact.unreadCount ?? 0) + 1
    };

    const otherContacts = this.contacts.filter(c => c.roomId !== msg.roomId);
    this.contacts = [updatedContact, ...otherContacts];
    this.cdr.markForCheck();
  }

  updateMessageStatuses(userId: string, roomId: string, messageIds: string[]) {
    const affectedRoomIds = new Set<string>();

    messageIds.forEach(msgId => {
      const msg = this.messages.find(m => m._id === msgId);
      if (!msg) {
        return;
      }

      affectedRoomIds.add(msg.roomId);

      if (!msg.status.readBy.some(r => r.userId === userId)) {
        msg.status.readBy.push({ userId, readAt: new Date() });
      }

      msg.isRead = msg.status.readBy.some(r => r.userId === this.userId);
      if (msg.senderId === this.userId) {
        const otherParticipants = this.currentRoom.participants.filter(p => p.userId.toString() !== this.userId);
        msg.isDelivered = otherParticipants.some(p =>
          msg.status.deliveredTo?.some(d => d.userId.toString() === p.userId.toString())
        );
        msg.isReadByOthers = otherParticipants.some(p =>
          msg.status.readBy.some(r => r.userId.toString() === p.userId.toString())
        );
      }
    });

    if (this.selectedContact) {
      const lastMsg = this.messages[this.messages.length - 1];
      if (lastMsg && lastMsg.userId === this.userId) {
        if (lastMsg.isReadByOthers) {
          this.selectedContact.lastMessageStatus = 'read';
        } else if (lastMsg.isDelivered) {
          this.selectedContact.lastMessageStatus = 'delivered';
        } else {
          this.selectedContact.lastMessageStatus = 'sent';
        }
      } else {
        this.selectedContact.lastMessageStatus = null;
      }

      if (this.userId === userId) {
        this.selectedContact.unreadCount = Math.max(
          0,
          (this.selectedContact.unreadCount ?? 0) - messageIds.length
        );
      }
    }

    this.contacts = this.contacts.map(contact => {

      if (!contact.lastReadMessageId) {
        return contact;
      }

      let lastMsg = this.messages.find(m => m._id === contact.lastReadMessageId);
      if (lastMsg) {
        console.log('Found message in messages array:', lastMsg);
      } else {
        if (messageIds.includes(contact.lastReadMessageId)) {
          lastMsg = {
            _id: contact.lastReadMessageId,
            senderId: messageIds.includes(contact.lastReadMessageId) && userId !== this.userId ? this.userId : undefined,
            status: { readBy: [], deliveredTo: [] },
            isRead: messageIds.includes(contact.lastReadMessageId),
            isDelivered: messageIds.includes(contact.lastReadMessageId) && userId !== this.userId,
            isReadByOthers: messageIds.includes(contact.lastReadMessageId) && userId !== this.userId,
            roomId: contact.roomId
          } as any;
        } else {
          return contact;
        }
      }

      let status: 'sent' | 'delivered' | 'read' | null = null;
      if (lastMsg && lastMsg.senderId === this.userId) {
        if (lastMsg.isRead || lastMsg.isReadByOthers) {
          status = 'read';
        } else if (lastMsg.isDelivered) {
          status = 'delivered';
        } else {
          status = 'sent';
        }
      }

      let unreadCount = contact.unreadCount;
      if (contact.roomId === roomId && this.userId === userId) {
        unreadCount = Math.max(0, (contact.unreadCount ?? 0) - messageIds.length);
      }
      return { ...contact, lastMessageStatus: status, unreadCount };
    });

    this.cdr.markForCheck();

    if (affectedRoomIds.has(String(this.roomId || '').trim())) {
      this.syncConversationHistoryCache(this.roomId);
    }
  }

  showNewMessagePopup(msg: IChatMessageResponse) {
    const popup = {
      id: msg._id,
      kind: 'message' as const,
      text: msg.content,
      avatar: msg.senderPhotoUrl,
      initials: this.getContactInitials({
        contactId: String(msg.senderId || msg._id || ''),
        contactName: msg.senderName || 'Guest',
      }),
      roomId: msg.roomId,
      name: msg.senderName
    };

    this.popups = this.popups || [];
    this.popups.push(popup);

    setTimeout(() => {
      this.closePopup(popup.id);
    }, 4000);

    this.cdr.markForCheck();
  }

  closePopup(id: string) {
    const popup = this.popups.find(p => p.id === id);
    if (!popup) return;

    popup.closing = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.popups = this.popups.filter(p => p.id !== id);
      this.cdr.markForCheck();
    }, 400);
  }

  openChatFromPopup(popup: ConversationPopup) {
    if (popup.kind !== 'message') {
      return;
    }

    const contact = this.contacts.find(c => c.roomId === popup.roomId);
    if (contact) {
      this.onSelectContact(contact);
    } else if (popup.roomId) {
      this.navigateToRoomView(popup.roomId, 'text-chat');
    }
    this.closePopup(popup.id);
  }

  private showIncomingCallPopup(invitation: DirectCallInvitation): void {
    const popupId = `call:${invitation.roomId}:${invitation.callerUserId}:${invitation.callType}`;
    if (this.popups.some((popup) => popup.id === popupId)) {
      return;
    }

    const callerName = String(invitation.callerName || invitation.callerEmail || 'Participant').trim();
    const callLabel = invitation.callType === 'audio' ? 'Audio' : 'Video';

    this.popups = [
      {
        id: popupId,
        kind: 'call',
        text: `${callLabel} call invitation`,
        initials: this.getContactInitials({
          contactId: String(invitation.callerUserId || invitation.roomId || popupId),
          contactName: callerName,
        }),
        name: callerName,
        roomId: invitation.roomId,
        roomName: invitation.roomName,
        chatRoomId: invitation.chatRoomId,
        callType: invitation.callType,
        counterpartUserId: invitation.callerUserId,
      },
      ...this.popups,
    ];

    this.cdr.markForCheck();
  }

  acceptIncomingCall(popup: ConversationPopup): void {
    const callType = popup.callType || 'video';
    this.prepareCallPreferences(callType);

    if (popup.chatRoomId && popup.counterpartUserId) {
      this.persistDirectCallSessionContext({
        roomId: popup.roomId,
        chatRoomId: popup.chatRoomId,
        counterpartUserId: popup.counterpartUserId,
        counterpartName: popup.name,
        callType,
        role: 'callee',
        startedAt: Date.now(),
      });
    }

    if (popup.chatRoomId) {
      const matchingContact = this.contacts.find((contact) => contact.roomId === popup.chatRoomId);
      if (matchingContact) {
        this.selectedContact = matchingContact;
      }
    }

    this.closePopup(popup.id);
    this.navigateToRoomView(popup.roomId, 'video-chat');
  }

  scrollToBottom() {
    if (!this.msgList) {
      return;
    }

    const el = this.msgList.nativeElement;
    el.scrollTop = el.scrollHeight;
  }

  private connectChat(idToken: string): Observable<void> {
    return defer(() => {
      this.chat.connect(idToken);
      return of(void 0);
    });
  }

  private getTalentMessagePreferences(contactId: string) {
    this.chatMessageService
      .getPreferredCommunicationMeans(contactId, this.chatMessageService.defaultCommunicationMeans)
      .pipe(take(1))
      .subscribe(preferredMeans => {
        this.preferredMeans = preferredMeans;
        this.selectedCommunicationMeans = [...preferredMeans];
        this.syncCallNotificationMeansWithPreferences();
        this.cdr.markForCheck();
      });
  }

  onMessagesScroll() {
    if (!this.msgList) {
      return;
    }

    const el = this.msgList.nativeElement;

    if (
      el.scrollTop <= 10 &&
      !this.isLoadingOlder &&
      this.hasMoreMessages
    ) {
      this.loadOlderMessages();
    }
  }

  loadOlderMessages() {

    if (this.isLoadingOlder) return;
    if (!this.roomId || !this.msgList) return;

    const roomId = this.roomId;
    const el = this.msgList.nativeElement;
    const previousHeight = el.scrollHeight;

    // Cursor: oldest currently loaded message
    const oldestMsg = this.messages[0];
    const before = oldestMsg?.createdDate
      ? new Date(oldestMsg.createdDate).toISOString()
      : undefined;
    const beforeId = oldestMsg?._id ? String(oldestMsg._id) : undefined;

    this.isLoadingOlder = true;

    this.chatMessageService
      .getRecentByRoomId(roomId, this.messagesPageSize, before, beforeId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (roomId !== this.roomId) {
            this.isLoadingOlder = false;
            return;
          }

          if (!res?.items?.length) {
            this.hasMoreMessages = false;
            this.isLoadingOlder = false;
            this.cdr.markForCheck();
            return;
          }

          this.applyMessageState(res.items);
          this.messages = [...res.items.reverse(), ...this.messages];
          this.hasMoreMessages = res.hasMore;
          this.messagesTotalNumber = this.messages.length;
          this.syncConversationHistoryCache(roomId);
          this.cdr.detectChanges();

          requestAnimationFrame(() => {
            const newHeight = el.scrollHeight;
            el.scrollTop = newHeight - previousHeight;
            this.isLoadingOlder = false;
          });
        },
        error: (err) => {
          console.error('Error loading older messages', err);
          this.isLoadingOlder = false;
          this.cdr.markForCheck();
        }
      });
  }

  private applyLoadedMessages(res: any): void {
    if (res) {
      this.messages = res.items?.reverse() || [];
      const lastMsg = this.messages[this.messages.length - 1];
      if (this.selectedContact && lastMsg) {
        const truncatedText = this.toConversationPreview(lastMsg);

        if (truncatedText !== this.selectedContact.lastMessageText) {
          this.selectedContact.lastMessageText = truncatedText;
          this.selectedContact.lastMessageDate = transformChatDate(lastMsg.createdDate);
          this.selectedContact.lastReadMessageId = lastMsg._id;
          this.selectedContact.lastMessageStatus = lastMsg.senderId === this.selectedContact.contactId
            ? lastMsg.status
            : null;
        }
      }

      this.applyMessageState(this.messages);
      this.hasMoreMessages = res.hasMore ?? false;
      this.messagesTotalNumber = this.messages.length;
      this.messagesPageIndex = 1;
      this.syncConversationHistoryCache();
    } else {
      this.messages = [];
      this.markedMessages.clear();
      this.hasMoreMessages = false;
      this.messagesTotalNumber = 0;
      this.messagesPageIndex = 0;
      const normalizedRoomId = String(this.roomId || '').trim();
      if (normalizedRoomId) {
        this.conversationHistoryCache.delete(normalizedRoomId);
      }
    }

    this.isChatLoading = false;
    this.isLoading = false;
    this.cdr.markForCheck();

    if (this.isFirstMessagesLoad && this.messages.length) {
      requestAnimationFrame(() => {
        this.scrollToBottom();
        this.isFirstMessagesLoad = false;
      });
    }
  }

  private resetMessageHistoryState(): void {
    this.messages = [];
    this.messagesTotalNumber = 0;
    this.messagesPageIndex = 0;
    this.hasMoreMessages = false;
    this.isFirstMessagesLoad = true;
    this.isLoadingOlder = false;
    this.markedMessages.clear();
  }

  private getConversationHistoryCache(roomId: string): ConversationHistoryCacheEntry | undefined {
    const normalizedRoomId = String(roomId || '').trim();
    if (!normalizedRoomId) {
      return undefined;
    }

    return this.conversationHistoryCache.get(normalizedRoomId);
  }

  private applyCachedConversationState(roomId: string): boolean {
    const cached = this.getConversationHistoryCache(roomId);
    if (!cached) {
      return false;
    }

    this.messages = [...cached.messages];
    this.hasMoreMessages = cached.hasMore;
    this.messagesTotalNumber = cached.messages.length;
    this.messagesPageIndex = 1;
    this.isFirstMessagesLoad = false;
    this.isLoadingOlder = false;
    this.markedMessages.clear();
    return true;
  }

  private syncConversationHistoryCache(roomId: string = this.roomId): void {
    const normalizedRoomId = String(roomId || '').trim();
    if (!normalizedRoomId) {
      return;
    }

    this.conversationHistoryCache.set(normalizedRoomId, {
      roomId: normalizedRoomId,
      messages: [...this.messages],
      hasMore: this.hasMoreMessages,
    });
  }

  private loadSelectedConversationHistory(roomId: string, requestId: number, options: { preferCached?: boolean } = {}): Observable<any> {
    const usingCachedState = options.preferCached !== false && this.applyCachedConversationState(roomId);

    if (!usingCachedState) {
      this.isChatLoading = true;
      this.resetMessageHistoryState();
    } else {
      this.isChatLoading = false;
    }

    this.cdr.markForCheck();

    return this.loadMessages(roomId, 0).pipe(
      tap((res) => {
        if (requestId !== this.conversationLoadSequence || roomId !== this.roomId) {
          return;
        }

        this.applyLoadedMessages(res);
      }),
      catchError((err) => {
        if (requestId === this.conversationLoadSequence && roomId === this.roomId) {
          console.error('Error loading selected conversation history', err);
          // If we already showed cached data, keep it visible instead of clearing.
          if (!usingCachedState) {
            this.messages = [];
            this.hasMoreMessages = false;
          }
          this.isChatLoading = false;
          this.isLoading = false;
          this.cdr.markForCheck();
        }

        return of(null);
      })
    );
  }

  private initiateContactChat(contact: ChatContactView | null, options: { loadMessages?: boolean } = {}): Observable<string | null> {
    if (!contact?.contactId) {
      this.selectedContact = null;
      this.cdr.markForCheck();
      return of(null);
    }

    const requestId = ++this.conversationLoadSequence;

    this.selectedVideoRoom = null;
    this.conversationBanner = '';
    this.isCallNotificationMenuOpen = false;
    this.selectedContact = this.mergeContactRecords(this.selectedContact, contact);

    const anticipatedRoomId = String(contact.roomId || this.findLocalDirectRoomIdForContact(contact) || '').trim();
    const appliedCachedConversation = anticipatedRoomId ? this.applyCachedConversationState(anticipatedRoomId) : false;

    if (!appliedCachedConversation) {
      this.resetMessageHistoryState();
      this.isChatLoading = true;
    } else {
      this.isChatLoading = false;
    }

    const selectedContactId = this.selectedContact?.contactId;
    if (selectedContactId) this.getTalentMessagePreferences(selectedContactId);

    // When we already know the roomId, fire the message fetch immediately in parallel
    // with room resolution so both HTTP requests overlap.
    const earlyFetch$ = (options.loadMessages && anticipatedRoomId)
      ? this.chatMessageService.getRecentByRoomId(anticipatedRoomId, this.messagesPageSize).pipe(
        take(1),
        shareReplay(1),
      )
      : null;

    // Trigger the early HTTP request now (shareReplay keeps the result for later consumption)
    const earlyFetchSub = earlyFetch$?.subscribe();

    return this.changeRoomId({ skipMessageReset: !!appliedCachedConversation }).pipe(
      switchMap((roomId) => {
        if (!options.loadMessages || !roomId) {
          earlyFetchSub?.unsubscribe();
          return of({ roomId, res: null });
        }

        // If the early fetch matches the resolved roomId, use it directly
        if (earlyFetch$ && roomId === anticipatedRoomId) {
          return earlyFetch$.pipe(
            tap((res) => {
              if (requestId === this.conversationLoadSequence && roomId === this.roomId) {
                this.applyLoadedMessages(res);
              }
            }),
            map((res) => ({ roomId, res })),
            catchError((err) => {
              console.error('Error in early message fetch', err);
              this.isChatLoading = false;
              this.cdr.markForCheck();
              return of({ roomId, res: null });
            }),
          );
        }

        // Fallback: roomId changed from anticipated, fetch fresh
        earlyFetchSub?.unsubscribe();
        return this.loadSelectedConversationHistory(roomId, requestId, { preferCached: true }).pipe(
          map((res) => ({ roomId, res }))
        );
      }),
      tap(() => {
        console.log('Messages loaded for redirected contact');
        this.cdr.markForCheck();
      }),
      tap(() => {
        if (requestId === this.conversationLoadSequence && !this.isCollapsed && this.isOverlay) {
          this.collapsePanel();
        }
      }),
      tap(({ roomId }) => {
        if (roomId) {
          this.navigateToRoomView(roomId, 'text-chat');
        }
      }),
      map(({ roomId }) => roomId),
      catchError(err => {
        console.error('Error loading messages for redirected contact', err);
        earlyFetchSub?.unsubscribe();
        this.isChatLoading = false;
        this.cdr.markForCheck();
        return of(null);
      })
    );
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize(event.target.innerWidth);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isCallNotificationMenuOpen) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('.call-notification-menu-shell')) {
      return;
    }

    this.isCallNotificationMenuOpen = false;
    this.cdr.markForCheck();
  }

  checkScreenSize(width: number) {
    if (width < 960) {
      this.isCollapsed = true;
      this.isOverlay = true;
    } else {
      this.isCollapsed = false;
      this.isOverlay = false;
    }
  }

  expandPanel() {
    this.isCollapsed = false;
  }

  collapsePanel() {
    this.isCollapsed = true;
  }

  onPositionChange(positionId: any) {
    let load$: Observable<any>;

    if (positionId === this.allContactsField) {
      load$ = this.loadAllTalents();
    } else {
      load$ = this.loadTalentsByPositionId(positionId);
    }

    load$.pipe(takeUntil(this._onDestroy)).subscribe({
      next: () => {
        console.log('Contacts and messages updated for position', positionId);
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Error updating contacts/messages for position', err);
        this.cdr.markForCheck();
      }
    });
  }

  onSelectContact(contact?: IContact | null) {
    this.selectedVideoRoom = null;
    this.conversationBanner = '';
    this.isCallNotificationMenuOpen = false;

    if (!contact?.contactId) {
      this.selectedContact = null;
      this.preferredMeans = [];
      this.isChatLoading = false;
      this.messages = [];
      this.markedMessages.clear();
      this.cdr.markForCheck();
      return;
    }

    this.initiateContactChat(contact as ChatContactView, { loadMessages: true }).pipe(take(1)).subscribe();
  }

  onSelectVideoRoom(room?: IEnrichedVideoChatRoom | null, options: { syncRoute?: boolean } = {}): void {
    this.conversationLoadSequence++;
    this.selectedVideoRoom = room || null;
    this.selectedContact = null;
    this.isChatLoading = false;
    this.resetMessageHistoryState();
    this.conversationBanner = room
      ? 'Start an audio or video call to alert room participants, or join the room directly.'
      : '';
    this.cdr.markForCheck();

    if (!this.isCollapsed && this.isOverlay) {
      this.collapsePanel();
    }

    if (room?._id && options.syncRoute !== false) {
      this.navigateToRoomView(String(room._id), 'text-chat');
    }
  }

  onSelectGroupRoom(contact: ChatContactView, options: { syncRoute?: boolean, loadMessages?: boolean } = {}): void {
    const roomId = String(contact.roomId || '').trim();
    if (!roomId) {
      return;
    }

    const requestId = ++this.conversationLoadSequence;
    this.selectedVideoRoom = null;
    this.selectedContact = contact;
    this.conversationBanner = '';
    this.isCallNotificationMenuOpen = false;

    const appliedCachedConversation = this.applyCachedConversationState(roomId);

    if (!appliedCachedConversation) {
      this.resetMessageHistoryState();
      this.isChatLoading = true;
    } else {
      this.isChatLoading = false;
    }

    this.cdr.markForCheck();

    // For GROUP rooms, we already know the room ID — just fetch the room and load messages directly.
    // No need to resolve via getByParticipantIdAsync or create a new room.
    this.chatRoomService.getByIdAsync(roomId, true).pipe(
      take(1),
      tap((room) => {
        if (room?._id && requestId === this.conversationLoadSequence) {
          this.roomId = room._id;
          this.currentRoom = room;
          this.chat.leaveRoom();
          this.chat.joinRoom(this.roomId);
          this.isFirstMessagesLoad = true;
        }
      }),
      switchMap((room) => {
        if (!room?._id || requestId !== this.conversationLoadSequence) {
          this.isChatLoading = false;
          this.cdr.markForCheck();
          return of(null);
        }

        if (options.loadMessages === false) {
          this.isChatLoading = false;
          this.cdr.markForCheck();
          return of(room._id);
        }

        return this.loadSelectedConversationHistory(room._id, requestId, { preferCached: !!appliedCachedConversation }).pipe(
          map(() => room._id)
        );
      }),
      tap((resolvedRoomId) => {
        if (resolvedRoomId && requestId === this.conversationLoadSequence) {
          if (!this.isCollapsed && this.isOverlay) {
            this.collapsePanel();
          }
          if (options.syncRoute !== false) {
            this.navigateToRoomView(resolvedRoomId, 'text-chat');
          }
        }

        this.cdr.markForCheck();
      }),
      catchError((err) => {
        console.error('Error loading group room', err);
        this.isChatLoading = false;
        this.cdr.markForCheck();
        return of(null);
      })
    ).subscribe();
  }

  onSelectConversation(item: CommunicationListItem): void {
    if (item.kind === 'room' && item.videoRoom) {
      this.onSelectVideoRoom(item.videoRoom);
      return;
    }

    if (item.kind === 'group' && item.directContact?.roomId) {
      this.onSelectGroupRoom(item.directContact);
      return;
    }

    this.onSelectContact(item.directContact ?? null);
  }

  isConversationSelected(item: CommunicationListItem): boolean {
    if (item.kind === 'room') {
      return this.selectedVideoRoom?._id === item.videoRoom?._id;
    }

    if (item.kind === 'group') {
      return !this.selectedVideoRoom && this.roomId === item.directContact?.roomId;
    }

    return !!this.selectedContact && this.getContactConversationKey(this.selectedContact) === this.getContactConversationKey(item.directContact);
  }

  send() {
    const text = this.input.trim();
    if (!text) return;

    const receiverId = this.selectedContact?.contactId;
    if (!receiverId) {
      return;
    }

    if (!this.roomId) {
      console.warn('Cannot send message: no room selected');
      return;
    }

    this.chat.sendMessage(
      text,
      receiverId,
      this.selectedCommunicationMeans,
      NotificationTemplate.NEW_CHAT_MESSAGE
    );

    this.input = '';
  }

  onInputChanged() {
    this.chat.setTyping(!!this.input);
  }

  loadPositions(): Observable<any> {
    if (!this.userId) return of(null);
    return this.positionsService.getByUserIdAsync(this.userId).pipe(
      take(1),
      tap(res => {
        this.positions = res;
        this.cdr.markForCheck();
      }),
      catchError(err => {
        console.error('Error loading positions', err);
        this.cdr.markForCheck();
        return of([]);
      })
    );
  }

  loadAllTalents(): Observable<any> {
    if (!this.userId) {
      return of(null);
    }

    return this.talentsPipelineProgressService.getTalentsByUserId(this.userId, true).pipe(
      take(1),
      tap(contacts => {
        this.contacts = (contacts || []).filter((c: any): c is IContact => !!c && !!c.contactId);

        this.cdr.markForCheck();
      }),
      switchMap(() => {
        if (this.contacts.length > 0) {
          this.cdr.markForCheck();

          if (this.hasContactRedirectInUrl() && !this.selectedContact) {
            return of(null);
          }

          return this.changeRoomId();
        } else {
          this.isLoading = false;
          this.isChatLoading = false;
          this.cdr.markForCheck();
          return of(null);
        }
      }),
      catchError(err => {
        console.error('Error loading all talents', err);
        this.isLoading = false;
        this.cdr.markForCheck();
        return of(null);
      })
    );
  }

  loadTalentsByPositionId(positionId: string): Observable<any> {
    return this.talentsPipelineProgressService.getContactsByPositionId(positionId, true).pipe(
      take(1),
      tap(contacts => {
        this.contacts = (contacts || []).filter((c: any): c is IContact => !!c && !!c.contactId);

        // if (!this.hasContactRedirectInUrl() && !this.selectedContact && this.contacts.length > 0) {
        //   this.selectedContact = this.contacts[0];
        //   const selectedContactId = this.selectedContact?.contactId;
        //   if (selectedContactId) this.getTalentMessagePreferences(selectedContactId);
        // }

        this.cdr.markForCheck();
      }),
      switchMap(() => {
        if (this.contacts.length > 0) {
          this.cdr.markForCheck();

          if (this.hasContactRedirectInUrl() && !this.selectedContact) {
            return of(null);
          }

          return this.changeRoomId();
        } else {
          this.isLoading = false;
          this.cdr.markForCheck();
          return of(null);
        }
      }),
      catchError(err => {
        console.error('Error loading talents by position', err);
        this.isLoading = false;
        this.cdr.markForCheck();
        return of(null);
      })
    );
  }

  onRoomsScroll(event: Event): void {
    if (this.isLoadingRooms || this.isLoadingVideoRooms) {
      return;
    }

    const element = event.target as HTMLElement;

    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;

    if (atBottom) {
      this.loadExistingChats().pipe(take(1)).subscribe();
      this.loadVideoRooms().pipe(take(1)).subscribe();
    }
  }

  loadVideoRooms(): Observable<any> {
    if (this.videoRoomsTotalNumber > 0 && this.videoRoomsTotalNumber <= this.videoRooms.length) {
      return of(null);
    }

    this.isLoadingVideoRooms = true;

    return this.videoChatRoomService
      .getAllAsync(this.selectedPageSize, this.videoRoomsPageIndex, this.roomsSorting, [], true, false)
      .pipe(
        take(1),
        tap(res => {
          if (res?.items?.length) {
            this.videoRoomsTotalNumber = res.totalItems;
            this.videoRoomsPageIndex++;
            const knownIds = new Set(this.videoRooms.map(room => String(room._id)));
            const nextRooms = (res.items as IEnrichedVideoChatRoom[]).filter(room => !knownIds.has(String(room._id)));
            this.videoRooms = this.deduplicateVideoRoomsByPair([...this.videoRooms, ...nextRooms]);
            this.maybeMigrateLegacyDirectVideoRooms();
          }

          this.isLoadingVideoRooms = false;
          this.cdr.markForCheck();
        }),
        catchError(err => {
          console.error('Error getting video rooms', err);
          this.isLoadingVideoRooms = false;
          this.cdr.markForCheck();
          return of(null);
        })
      );
  }

  loadExistingChats(): Observable<any> {
    if (!this.userId) {
      return of(null);
    }

    if (this.roomsTotalNumber > 0 && this.roomsTotalNumber <= this.contacts.length) {
      return of(null);
    }

    this.isLoadingRooms = true;

    this.roomsFiltering = [];

    const mainFilter = {
      property: 'participants.userId',
      rule: FilterRule.EQUALS,
      value: this.userId
    };

    this.roomsFiltering.push(mainFilter);

    return this.chatRoomService
      .getAllAsync(this.selectedPageSize, this.roomsPageIndex, this.roomsSorting, this.roomsFiltering, true, false).pipe(
        take(1),
        tap(res => {
          if (res && res.totalItems > 0) {
            this.roomsTotalNumber = res.totalItems;
            this.roomsPageIndex++;
            this.isLoadingRooms = false;
            const newContacts = res.items.map(room => {
              const isGroup = room.type === ChatRoomType.GROUP;
              const other = room.participants.find(p => String(p.userId ?? p.contactId ?? '') !== this.userId);

              // For GROUP rooms, use the first participant as contactId anchor
              // but preserve room name and type so the UI renders correctly.
              const contactId = isGroup
                ? String(room._id || '').trim()   // use room id as stable key for groups
                : other?.contactId;

              return {
                contactId,
                contactName: isGroup ? (room.name || 'Group chat') : other?.contactName,
                email: isGroup ? undefined : other?.email,
                role: isGroup ? undefined : other?.role,
                photoUrl: isGroup ? undefined : other?.photoUrl,
                roomId: room?._id,
                roomName: room?.name,
                roomType: room?.type,
                participantCount: room.participants?.length || 0,
                lastReadMessageId: room?.lastReadMessageId,
                lastMessageText: `${room.lastMessageText?.slice(0, 30)}...`,
                lastMessageDateRaw: room.lastMessageDate,
                lastMessageDate: transformChatDate(room.lastMessageDate),
                lastMessageStatus: room?.lastMessageStatus,
                unreadCount: room.unreadCount
              } as ChatContactView;
            }).filter(c => !!c && !!c.contactId);

            this.contacts = this.mergeContacts(this.contacts, newContacts);
            this.maybeMigrateLegacyDirectVideoRooms();

            if (this.selectedContact?.contactId) {
              const mergedSelectedContact = this.contacts.find(contact => this.getContactConversationKey(contact) === this.getContactConversationKey(this.selectedContact));
              if (mergedSelectedContact) {
                this.selectedContact = this.mergeContactRecords(this.selectedContact, mergedSelectedContact);
              }
            }

            this.cdr.markForCheck();
          } else {
            this.isLoading = false;
            this.isLoadingRooms = false;
            this.isChatLoading = false;
            this.messages = [];
            this.markedMessages.clear();
            this.cdr.markForCheck();
          }
        }),
        switchMap(() => {

          if (this.roomsPageIndex > 1) {
            return of(null);
          }

          if (this.contacts.length === 0) {
            return of(null);
          }

          if (this.hasContactRedirectInUrl() && !this.selectedContact) {
            return of(null);
          }

          return this.changeRoomId();

        }),
        catchError(err => {
          console.error('Error getting chat rooms', err);
          this.cdr.markForCheck();
          return of(null);
        })
      );
  }

  loadMessages(roomId: string, pageIndex: number = this.messagesPageIndex): Observable<any> {
    return this.chatMessageService
      .getRecentByRoomId(roomId, this.messagesPageSize);
  }

  private normalizeIdentity(value: unknown): string {
    return String(value || '').trim().toLowerCase();
  }

  private getContactIdentityTokens(contact: Partial<ChatContactView> | null | undefined): string[] {
    if (!contact) {
      return [];
    }

    const tokens = [
      this.normalizeIdentity(contact.contactId),
      this.normalizeIdentity(contact.email),
      this.normalizeIdentity(contact.username),
      this.normalizeIdentity(contact.pseudonym),
      this.normalizeIdentity(contact.phone),
    ].filter(Boolean);

    return Array.from(new Set(tokens));
  }

  private areSameContactIdentity(left: Partial<ChatContactView> | null | undefined, right: Partial<ChatContactView> | null | undefined): boolean {
    const leftTokens = this.getContactIdentityTokens(left);
    const rightTokens = new Set(this.getContactIdentityTokens(right));
    return leftTokens.some((token) => rightTokens.has(token));
  }

  private findLocalDirectRoomIdForContact(contact: ChatContactView): string {
    const directRoomId = String(contact.roomId || '').trim();
    if (directRoomId) {
      return directRoomId;
    }

    const localMatch = this.contacts.find((entry) => this.areSameContactIdentity(entry, contact) && !!String(entry.roomId || '').trim());
    return String(localMatch?.roomId || '').trim();
  }

  private findDirectRoomSummaryForContact(roomSummaries: IChatRoomSummary[], contact: ChatContactView): IChatRoomSummary | null {
    const myTokens = new Set([
      this.normalizeIdentity(this.userId),
      this.normalizeIdentity(this.resolveCurrentUserEmail()),
    ].filter(Boolean));
    const contactTokens = new Set(this.getContactIdentityTokens(contact));
    if (!contactTokens.size) {
      return null;
    }

    for (const room of roomSummaries || []) {
      if (room?.type !== ChatRoomType.DIRECT) {
        continue;
      }

      const participants = Array.isArray(room.participants) ? room.participants : [];
      if (participants.length !== 2) {
        continue;
      }

      const participantTokenLists = participants.map((participant) => this.getContactIdentityTokens(participant as ChatContactView));
      const hasMe = participantTokenLists.some((tokens) => tokens.some((token) => myTokens.has(token)));
      if (!hasMe) {
        continue;
      }

      const hasCounterpart = participantTokenLists.some((tokens) => tokens.some((token) => contactTokens.has(token)));
      if (!hasCounterpart) {
        continue;
      }

      return room;
    }

    return null;
  }

  private createDirectChatRoom(contactId: string): Observable<ChatRoom | null> {
    const chatRoom: ChatRoom = {
      positionId: this.selectedPositionId === this.allContactsField ? '' : this.selectedPositionId,
      participants: [
        { userId: this.userId, joinedAt: new Date() },
        { userId: contactId, joinedAt: new Date() }
      ],
      type: ChatRoomType.DIRECT,
      userId: this.userId,
      createdBy: this.userId,
      createdDate: new Date()
    };

    return this.chatRoomService.createAsync(chatRoom, true, false).pipe(
      take(1),
      map((room) => room || null),
      catchError((err) => {
        console.error('Error creating chat room', err);
        return of(null);
      })
    );
  }

  private resolveDirectChatRoom(contact: ChatContactView): Observable<ChatRoom | null> {
    const contactId = String(contact.contactId || '').trim();
    if (!contactId) {
      return of(null);
    }

    const localRoomId = this.findLocalDirectRoomIdForContact(contact);
    if (localRoomId) {
      return this.chatRoomService.getByIdAsync(localRoomId, true).pipe(
        take(1),
        map((room) => room || null),
        catchError(() => this.createDirectChatRoom(contactId))
      );
    }

    if (!this.userId) {
      return this.createDirectChatRoom(contactId);
    }

    return this.chatRoomService.getByParticipantIdAsync(this.userId, true).pipe(
      take(1),
      switchMap((rooms) => {
        const matchedRoom = this.findDirectRoomSummaryForContact(rooms || [], contact);
        if (!matchedRoom?._id) {
          return this.createDirectChatRoom(contactId);
        }

        return this.chatRoomService.getByIdAsync(matchedRoom._id, true).pipe(
          take(1),
          map((room) => room || null),
          catchError(() => this.createDirectChatRoom(contactId))
        );
      }),
      catchError((err) => {
        console.error('Error resolving existing chat room', err);
        return this.createDirectChatRoom(contactId);
      })
    );
  }

  changeRoomId(options: { skipMessageReset?: boolean } = {}): Observable<string | null> {

    if (!this.selectedContact?.contactId) {
      this.isChatLoading = false;
      this.cdr.markForCheck();
      return of(null);
    }

    // GROUP rooms are handled by onSelectGroupRoom — skip direct resolution
    if (this.selectedContact.roomType === ChatRoomType.GROUP) {
      this.isChatLoading = false;
      this.cdr.markForCheck();
      return of(null);
    }

    if (!options.skipMessageReset) {
      this.isChatLoading = true;
      this.messages = [];
      this.markedMessages.clear();
    }

    const selectedContactId = String(this.selectedContact.contactId || '').trim();
    if (!selectedContactId) {
      this.isChatLoading = false;
      this.cdr.markForCheck();
      return of(null);
    }

    const contactExists = this.contacts.some(c => c.contactId === selectedContactId);
    if (!contactExists) {
      this.contacts = [this.selectedContact, ...this.contacts];
    }

    return this.resolveDirectChatRoom(this.selectedContact).pipe(
      take(1),
      map(res => {

        if (!res?._id) {
          return null;
        }

        this.roomId = res._id;
        this.currentRoom = res;
        this.selectedContact = this.mergeContactRecords(this.selectedContact, {
          contactId: selectedContactId,
          roomId: res._id,
          roomName: String(res.name || '').trim() || undefined,
        });
        this.contacts = this.mergeContacts(this.contacts, [this.selectedContact]);

        this.chat.leaveRoom();
        this.chat.joinRoom(this.roomId);

        this.isFirstMessagesLoad = true;

        this.cdr.markForCheck();

        return this.roomId;
      }),
      catchError(err => {
        console.error('Error changing chat room', err);
        this.isChatLoading = false;
        this.cdr.markForCheck();
        return of(null);
      })
    );
  }

  private buildConversationItems(): CommunicationListItem[] {
    const directItems = this.contacts.map((contact) => {
      const isGroup = contact.roomType === ChatRoomType.GROUP;
      const title = isGroup
        ? String(contact.roomName || contact.contactName || 'Group chat').trim()
        : String(contact.contactName || contact.pseudonym || contact.username || contact.email || 'Direct chat').trim();
      const subtitle = isGroup
        ? String(contact.lastMessageText || `${contact.participantCount || 0} participants`).trim()
        : String(contact.lastMessageText || contact.pseudonym || contact.role || contact.username || contact.email || 'Available for direct chat').trim();
      return {
        id: isGroup ? `group-${contact.roomId}` : `direct-${contact.contactId}`,
        kind: (isGroup ? 'group' : 'direct') as 'direct' | 'group',
        title,
        subtitle,
        searchText: [
          title,
          subtitle,
          contact.email,
          contact.phone,
          contact.username,
          contact.pseudonym,
          contact.role,
          contact.contactId,
          contact.roomId,
          contact.roomName,
        ].filter(Boolean).join(' ').toLowerCase(),
        timestamp: this.toTimestamp(contact.lastMessageDateRaw || contact.lastMessageDate),
        unreadCount: Number(contact.unreadCount || 0),
        initials: isGroup ? this.getGroupInitials(contact.roomName || contact.contactName) : this.getContactInitials(contact),
        avatarUrl: isGroup ? undefined : contact.photoUrl,
        dateLabel: String(contact.lastMessageDate || '').trim(),
        directContact: contact,
      };
    });

    const roomItems = this.videoRooms.map((room) => {
      const participants = room.participants?.length || 0;
      const roomIdLabel = String(room._id || '').slice(-6).toUpperCase();
      const subtitle = `${participants} participant${participants === 1 ? '' : 's'}${roomIdLabel ? ` (${roomIdLabel})` : ''}`;
      return {
        id: `room-${room._id}`,
        kind: 'room' as const,
        title: String(room.name || 'Video room').trim(),
        subtitle,
        searchText: [
          room.name,
          room.type,
          room._id,
          ...(room.participants || []).map(participant => participant.email),
          ...(room.participants || []).map(participant => participant.name),
        ].filter(Boolean).join(' ').toLowerCase(),
        timestamp: this.toTimestamp(room.modifiedDate || room.createdDate || room.createdBy),
        unreadCount: 0,
        initials: this.getRoomInitials(room),
        dateLabel: room.type === VideoChatRoomType.GROUP ? 'Room' : 'Direct call room',
        videoRoom: room,
      };
    });

    return [...directItems, ...roomItems]
      .sort((left, right) => right.timestamp - left.timestamp || left.title.localeCompare(right.title));
  }

  private toTimestamp(value: unknown): number {
    if (value instanceof Date) {
      return value.getTime();
    }

    const asDate = new Date(String(value || ''));
    const timestamp = asDate.getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private applyMessageState(messages: IChatMessageResponse[]): void {
    for (const message of messages || []) {
      const readByMe = message.status.readBy.some((entry: any) => entry.userId.toString() === this.userId);
      message.isRead = readByMe;

      if (readByMe) {
        this.markedMessages.add(message._id);
      }

      if (message.senderId?.toString() === this.userId) {
        const otherParticipants = this.currentRoom?.participants?.filter((participant: any) => participant.userId.toString() !== this.userId) || [];
        message.isDelivered = otherParticipants.some((participant: any) =>
          message.status.deliveredTo.some((delivery: any) => delivery.userId.toString() === participant.userId.toString())
        );
        message.isReadByOthers = otherParticipants.some((participant: any) =>
          message.status.readBy.some((reader: any) => reader.userId.toString() === participant.userId.toString())
        );
      }
    }
  }

  private toConversationPreview(message: IChatMessageResponse): string {
    const callInviteMeta = this.getCallInviteMeta(message);
    if (callInviteMeta) {
      return this.getCallInviteLabel(message);
    }

    return `${String(message.content || '').slice(0, 30)}...`;
  }

  private getCallInviteMeta(message: IChatMessageResponse | null | undefined): DirectCallMessageMeta | null {
    if (!message?.meta || message.type !== 'system') {
      return null;
    }

    const meta = message.meta as Partial<DirectCallMessageMeta>;
    const supportedKinds = new Set<DirectCallMessageMeta['kind']>([
      'direct-call-invite',
      'direct-call-answered',
      'direct-call-ended',
      'direct-call-missed',
      'direct-call-missed-email',
      'call-started',
    ]);

    if (!supportedKinds.has(meta.kind as DirectCallMessageMeta['kind']) || !meta.roomId || !meta.callType || !meta.callerUserId) {
      return null;
    }

    return {
      kind: meta.kind as DirectCallMessageMeta['kind'],
      roomId: String(meta.roomId).trim(),
      chatRoomId: String(meta.chatRoomId || '').trim() || undefined,
      roomName: String(meta.roomName || '').trim() || undefined,
      callType: meta.callType === 'audio' ? 'audio' : 'video',
      callerUserId: String(meta.callerUserId).trim(),
      callerName: String(meta.callerName || '').trim() || undefined,
      callerEmail: String(meta.callerEmail || '').trim() || undefined,
      sentAt: Number(meta.sentAt || Date.now()),
      actorUserId: String(meta.actorUserId || '').trim() || undefined,
      actorName: String(meta.actorName || '').trim() || undefined,
      answeredAt: meta.answeredAt ? Number(meta.answeredAt) : undefined,
      endedAt: meta.endedAt ? Number(meta.endedAt) : undefined,
    };
  }

  isCallInviteMessage(message: IChatMessageResponse | null | undefined): boolean {
    return !!this.getCallInviteMeta(message);
  }

  getCallInviteLabel(message: IChatMessageResponse): string {
    const meta = this.getCallInviteMeta(message);
    if (!meta) {
      return 'Call invitation';
    }

    const callLabel = meta.callType === 'audio' ? 'Audio' : 'Video';
    switch (meta.kind) {
      case 'call-started':
        return `${callLabel} call started`;
      case 'direct-call-answered':
        return `${callLabel} joined the call`;
      case 'direct-call-ended':
        return `${callLabel} call ended`;
      case 'direct-call-missed':
        return `${callLabel} call missed`;
      case 'direct-call-missed-email':
        return `${callLabel} missed-call email sent`;
      default:
        return `${callLabel} call invitation`;
    }
  }

  getCallInviteDescription(message: IChatMessageResponse): string {
    const meta = this.getCallInviteMeta(message);
    if (!meta) {
      return '';
    }

    const caller = meta.actorName || meta.callerName || meta.callerEmail || 'Participant';
    switch (meta.kind) {
      case 'call-started':
        return `${caller} started a ${meta.callType} call.`;
      case 'direct-call-answered':
        return `${caller} joined the ${meta.callType} call.`;
      case 'direct-call-ended':
        return `${caller} ended the ${meta.callType} call.`;
      case 'direct-call-missed':
        return `${caller} ended the ${meta.callType} call before anyone answered.`;
      case 'direct-call-missed-email':
        return `A missed-call follow-up email was sent for the ${meta.callType} call.`;
      default:
        return `${caller} started a ${meta.callType} call.`;
    }
  }

  isJoinableCallMessage(message: IChatMessageResponse): boolean {
    const meta = this.getCallInviteMeta(message);
    return !!meta && (meta.kind === 'direct-call-invite' || meta.kind === 'direct-call-answered' || meta.kind === 'call-started');
  }

  joinCallFromMessage(message: IChatMessageResponse): void {
    const meta = this.getCallInviteMeta(message);
    if (!meta?.roomId) {
      return;
    }

    if (meta.chatRoomId && message.senderId !== this.userId && meta.kind === 'direct-call-invite') {
      this.persistDirectCallSessionContext({
        roomId: meta.roomId,
        chatRoomId: meta.chatRoomId,
        counterpartUserId: meta.callerUserId,
        counterpartName: meta.callerName,
        callType: meta.callType,
        role: 'callee',
        startedAt: Date.now(),
      });
    }

    this.prepareCallPreferences(meta.callType);
    this.navigateToRoomView(meta.roomId, 'video-chat');
  }

  toggleCallNotificationMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isCallNotificationMenuOpen = !this.isCallNotificationMenuOpen;
    this.cdr.markForCheck();
  }

  isCallNotificationChannelSelected(channel: CommunicationMean): boolean {
    return this.selectedCallNotificationMeans.includes(channel);
  }

  isCallNotificationChannelUnavailable(channel: CommunicationMean): boolean {
    return !this.preferredMeans.includes(channel);
  }

  getCallNotificationChannelHint(channel: CommunicationMean): string {
    if (!this.preferredMeans.includes(channel)) {
      return 'This contact has not enabled this notification channel.';
    }

    return `Notify via ${this.getCommunicationMeanLabel(channel)}`;
  }

  toggleCallNotificationChannel(channel: CommunicationMean, event?: MouseEvent): void {
    event?.stopPropagation();

    if (this.isCallNotificationChannelUnavailable(channel)) {
      return;
    }

    const nextSelection = this.isCallNotificationChannelSelected(channel)
      ? this.selectedCallNotificationMeans.filter((entry) => entry !== channel)
      : [...this.selectedCallNotificationMeans, channel];

    this.selectedCallNotificationMeans = this.normalizeCallNotificationMeans(nextSelection);
    this.persistCallNotificationMeans();
    this.cdr.markForCheck();
  }

  startCodingSession(): void {
    if (!this.selectedContact?.contactId) {
      return;
    }
    const roles = this.authService.getRoles();
    this.router.navigate([convertRoleToRoute(roles), environment.routes.liveCoding, 'interview', this.roomId]);
  }

  getCallNotificationSummary(): string {
    const enabledCount = this.selectedCallNotificationMeans.length;

    if (!enabledCount) {
      return 'External alerts off';
    }

    if (enabledCount === 1) {
      return this.getCommunicationMeanLabel(this.selectedCallNotificationMeans[0]);
    }

    if (enabledCount === 2) {
      return this.selectedCallNotificationMeans
        .map((channel) => this.getCommunicationMeanLabel(channel))
        .join(' + ');
    }

    return `${enabledCount} channels`;
  }

  getCommunicationMeanLabel(channel: CommunicationMean): string {
    switch (channel) {
      case CommunicationMean.sms:
        return 'SMS';
      case CommunicationMean.email:
        return 'Email';
      case CommunicationMean.whatsapp:
        return 'WhatsApp';
      case CommunicationMean.telegram:
        return 'Telegram';
      case CommunicationMean.viber:
        return 'Viber';
      default:
        return String(channel || '').trim() || 'Channel';
    }
  }

  private mergeContactRecords(current: ChatContactView | undefined | null, incoming: ChatContactView | undefined | null): ChatContactView {
    const base = current || {} as ChatContactView;
    const next = incoming || {} as ChatContactView;

    return {
      ...base,
      ...next,
      contactId: String(next.contactId || base.contactId || '').trim(),
      contactName: String(next.contactName || base.contactName || '').trim() || undefined,
      pseudonym: String(next.pseudonym || base.pseudonym || '').trim() || undefined,
      username: String(next.username || base.username || '').trim() || undefined,
      email: String(next.email || base.email || '').trim() || undefined,
      phone: String(next.phone || base.phone || '').trim() || undefined,
      role: String(next.role || base.role || '').trim() || undefined,
      photoUrl: String(next.photoUrl || base.photoUrl || '').trim() || undefined,
      roomId: String(next.roomId || base.roomId || '').trim() || undefined,
      roomName: String(next.roomName || base.roomName || '').trim() || undefined,
      lastReadMessageId: String(next.lastReadMessageId || base.lastReadMessageId || '').trim() || undefined,
      lastMessageText: next.lastMessageText ?? base.lastMessageText,
      lastMessageDate: next.lastMessageDate ?? base.lastMessageDate,
      lastMessageDateRaw: next.lastMessageDateRaw ?? base.lastMessageDateRaw,
      lastMessageStatus: next.lastMessageStatus ?? base.lastMessageStatus,
      unreadCount: typeof next.unreadCount === 'number' ? next.unreadCount : base.unreadCount,
    };
  }

  private getContactMergeKey(contact: ChatContactView | null | undefined): string {
    const tokens = this.getContactIdentityTokens(contact);
    if (tokens.length > 0) {
      return tokens[0];
    }

    return this.normalizeIdentity(contact?.roomId);
  }

  private mergeContacts(existingContacts: ChatContactView[], incomingContacts: ChatContactView[]): ChatContactView[] {
    const mergedById = new Map<string, ChatContactView>();

    for (const contact of existingContacts) {
      const mergeKey = this.getContactMergeKey(contact);
      if (!mergeKey) {
        continue;
      }

      mergedById.set(mergeKey, this.mergeContactRecords(undefined, contact));
    }

    for (const contact of incomingContacts) {
      const mergeKey = this.getContactMergeKey(contact);
      if (!mergeKey) {
        continue;
      }

      mergedById.set(mergeKey, this.mergeContactRecords(mergedById.get(mergeKey), contact));
    }

    return Array.from(mergedById.values());
  }

  private resolveCallContact(contact: ChatContactView | null = this.selectedContact): ChatContactView | null {
    if (!contact?.contactId) {
      return null;
    }

    const knownContact = this.contacts.find((entry) => this.areSameContactIdentity(entry, contact))
      || (this.areSameContactIdentity(this.selectedContact, contact) ? this.selectedContact : null);

    return this.mergeContactRecords(knownContact, contact);
  }

  private getContactConversationKey(contact: ChatContactView | IContact | null | undefined): string {
    if (!contact) {
      return '';
    }

    return String(contact.roomId || contact.contactId || contact.email || contact.username || contact.pseudonym || '').trim().toLowerCase();
  }

  private getDirectVideoRoomPairKey(room: IEnrichedVideoChatRoom | VideoChatRoom | null | undefined): string {
    if (!room) {
      return '';
    }

    if (room.type !== VideoChatRoomType.DIRECT) {
      return `room:${String(room._id || '').trim()}`;
    }

    const participants = (room.participants || [])
      .map((participant: any) => this.normalizeIdentity(participant?.email || participant?.userId))
      .filter(Boolean)
      .sort();

    if (participants.length < 2) {
      return `room:${String(room._id || '').trim()}`;
    }

    return `direct:${participants.join('|')}`;
  }

  private deduplicateVideoRoomsByPair(rooms: IEnrichedVideoChatRoom[]): IEnrichedVideoChatRoom[] {
    const canonicalByPair = this.buildCanonicalDirectRoomIdByPairMap();
    const byKey = new Map<string, IEnrichedVideoChatRoom>();

    for (const room of rooms) {
      const key = this.getDirectVideoRoomPairKey(room);
      if (!key) {
        continue;
      }

      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, room);
        continue;
      }

      const canonicalRoomId = canonicalByPair.get(key);
      if (canonicalRoomId) {
        const existingId = String(existing._id || '').trim();
        const candidateId = String(room._id || '').trim();

        if (existingId === canonicalRoomId) {
          continue;
        }

        if (candidateId === canonicalRoomId) {
          byKey.set(key, room);
          continue;
        }
      }

      const existingTs = this.toTimestamp(existing.modifiedDate || existing.createdDate);
      const candidateTs = this.toTimestamp(room.modifiedDate || room.createdDate);
      if (candidateTs >= existingTs) {
        byKey.set(key, room);
      }
    }

    return Array.from(byKey.values()).sort(
      (left, right) => this.toTimestamp(right.modifiedDate || right.createdDate) - this.toTimestamp(left.modifiedDate || left.createdDate)
    );
  }

  private getDirectPairKeyByEmails(leftEmail: string, rightEmail: string): string {
    const emails = [
      String(leftEmail || '').trim().toLowerCase(),
      String(rightEmail || '').trim().toLowerCase(),
    ].filter(Boolean).sort();

    return emails.length === 2 ? `direct:${emails.join('|')}` : '';
  }

  private buildCanonicalDirectRoomIdByPairMap(): Map<string, string> {
    const currentUserEmail = this.resolveCurrentUserEmail();
    const canonicalByPair = new Map<string, string>();

    if (!currentUserEmail) {
      return canonicalByPair;
    }

    for (const contact of this.contacts || []) {
      const counterpartEmail = String(contact?.email || '').trim().toLowerCase();
      const canonicalRoomId = String(contact?.roomId || '').trim();
      if (!counterpartEmail || !canonicalRoomId) {
        continue;
      }

      const pairKey = this.getDirectPairKeyByEmails(currentUserEmail, counterpartEmail);
      if (!pairKey) {
        continue;
      }

      canonicalByPair.set(pairKey, canonicalRoomId);
    }

    return canonicalByPair;
  }

  private maybeMigrateLegacyDirectVideoRooms(): void {
    if (this.isMigratingDirectRooms || !this.contacts.length || !this.videoRooms.length) {
      return;
    }

    const currentUserEmail = this.resolveCurrentUserEmail();
    if (!currentUserEmail) {
      return;
    }

    const migrationCandidates = this.contacts
      .map((contact) => {
        const canonicalRoomId = String(contact?.roomId || '').trim();
        const counterpartEmail = String(contact?.email || '').trim().toLowerCase();
        if (!canonicalRoomId || !counterpartEmail) {
          return null;
        }

        if (this.migratedCanonicalDirectRoomIds.has(canonicalRoomId)) {
          return null;
        }

        const pairKey = this.getDirectPairKeyByEmails(currentUserEmail, counterpartEmail);
        if (!pairKey) {
          return null;
        }

        const matchingRooms = this.videoRooms.filter((room) => this.getDirectVideoRoomPairKey(room) === pairKey);
        const hasCanonical = matchingRooms.some((room) => String(room?._id || '').trim() === canonicalRoomId);
        if (hasCanonical || matchingRooms.length === 0) {
          return null;
        }

        const seedRoom = matchingRooms[0];
        return { contact, canonicalRoomId, seedRoom };
      })
      .filter((candidate): candidate is { contact: ChatContactView; canonicalRoomId: string; seedRoom: IEnrichedVideoChatRoom } => !!candidate);

    if (!migrationCandidates.length) {
      return;
    }

    this.isMigratingDirectRooms = true;

    Promise.all(
      migrationCandidates.map(async ({ contact, canonicalRoomId, seedRoom }) => {
        const counterpartEmail = String(contact.email || '').trim();
        const payload: VideoChatRoom = {
          _id: canonicalRoomId,
          name: String(seedRoom?.name || `${contact.contactName || 'Direct'} call`).trim(),
          type: VideoChatRoomType.DIRECT,
          isVerified: true,
          participants: [
            { email: currentUserEmail } as any,
            { email: counterpartEmail } as any,
          ],
          userId: this.userId,
          createdBy: this.userId,
          createdDate: new Date(),
        };

        try {
          const created = await firstValueFrom(this.videoChatRoomService.createAsync(payload, true, false).pipe(take(1)));
          if (created?._id) {
            this.migratedCanonicalDirectRoomIds.add(canonicalRoomId);
            this.videoRooms = this.deduplicateVideoRoomsByPair([
              created as IEnrichedVideoChatRoom,
              ...this.videoRooms,
            ]);
          }
        } catch (error) {
          console.error('Error migrating legacy direct video room', { canonicalRoomId, error });
        }
      })
    ).finally(() => {
      this.isMigratingDirectRooms = false;
      this.videoRooms = this.deduplicateVideoRoomsByPair(this.videoRooms);
      this.cdr.markForCheck();
    });
  }

  private describeDirectConversation(contact: ChatContactView | null | undefined): string {
    if (!contact) {
      return 'Choose a conversation to begin.';
    }

    if (contact.roomName) {
      return contact.roomName;
    }

    return contact.pseudonym || contact.role || contact.email || contact.phone || contact.username || 'Direct conversation';
  }

  startConversationByIdentifier(mode: 'text' | 'audio' | 'video'): void {
    const identifier = String(this.newDirectChatIdentifier || '').trim();
    if (!identifier || this.isCreatingDirectChat) {
      return;
    }

    this.isCreatingDirectChat = true;
    this.conversationBanner = '';

    this.lookupDirectChatContact(identifier).pipe(
      switchMap((contact) => {
        if (!contact?.contactId) {
          return of(null);
        }

        return this.initiateContactChat(contact, { loadMessages: true }).pipe(
          tap((roomId) => {
            if (roomId && mode !== 'text') {
              this.startDirectCall(mode, this.selectedContact);
            }
          })
        );
      }),
      finalize(() => {
        this.isCreatingDirectChat = false;
        this.cdr.markForCheck();
      }),
      take(1)
    ).subscribe((roomId) => {
      if (roomId) {
        this.newDirectChatIdentifier = '';
      }
    });
  }

  private findExistingDirectVideoRoom(contact: ChatContactView, currentUserEmail: string): IEnrichedVideoChatRoom | undefined {
    const targetEmail = String(contact.email || '').trim().toLowerCase();
    if (!targetEmail) {
      return undefined;
    }

    return this.videoRooms.find(room => {
      if (room.type !== VideoChatRoomType.DIRECT) {
        return false;
      }

      const emails = (room.participants || [])
        .map(participant => String(participant.email || '').trim().toLowerCase())
        .filter(Boolean);

      return emails.includes(currentUserEmail.toLowerCase()) && emails.includes(targetEmail);
    });
  }

  private findVideoRoomById(roomId: string): IEnrichedVideoChatRoom | undefined {
    const normalizedId = String(roomId || '').trim();
    if (!normalizedId) {
      return undefined;
    }

    return this.videoRooms.find((room) => String(room?._id || '').trim() === normalizedId);
  }

  private resolveCurrentUserEmail(): string {
    const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${this.userId}`)
      ?? sessionStorage.getItem(`${environment.storage.token}`)
      ?? '';

    if (!idToken) {
      return '';
    }

    try {
      return String(this.authService.decodeJWTToken(idToken).user.email || '').trim();
    } catch {
      return '';
    }
  }

  trackByConversationId(_index: number, item: CommunicationListItem): string {
    return item.id;
  }

  getConversationRoomId(item: CommunicationListItem): string {
    return String(item.videoRoom?._id || item.directContact?.roomId || '').trim();
  }

  getConversationRoomIdShort(item: CommunicationListItem): string {
    return this.toCompactId(this.getConversationRoomId(item));
  }

  getConversationParticipantCount(item: CommunicationListItem): number {
    if (item.kind === 'room') {
      return item.videoRoom?.participants?.length || 0;
    }

    if (item.kind === 'group') {
      return item.directContact?.participantCount || 0;
    }

    return item.directContact ? 2 : 0;
  }

  getConversationModeLabel(item: CommunicationListItem): string {
    if (item.kind === 'room') {
      switch (item.videoRoom?.type) {
        case VideoChatRoomType.GROUP:
          return 'Group';
        case VideoChatRoomType.STAGE:
          return 'Stage';
        case VideoChatRoomType.SELF:
          return 'Self';
        default:
          return 'Direct room';
      }
    }

    if (item.kind === 'group') {
      return 'Group';
    }

    return 'Direct';
  }

  getConversationAccessLabel(item: CommunicationListItem): string {
    if (item.kind === 'room') {
      return item.videoRoom?.isOpenMeeting ? 'External join' : 'Selected list';
    }

    if (item.kind === 'group') {
      return 'Invite only';
    }

    return 'Invite only';
  }

  private prepareCallPreferences(callType: DirectCallType): void {
    try {
      sessionStorage.setItem('rtc.audioEnabled', '1');
      sessionStorage.setItem('rtc.videoEnabled', callType === 'audio' ? '0' : '1');
    } catch {
      // best effort
    }
  }

  private readStoredBoolean(storageKey: string, fallback: boolean): boolean {
    try {
      const value = sessionStorage.getItem(storageKey);
      if (value === null) {
        return fallback;
      }

      return value === '1' || value === 'true';
    } catch {
      return fallback;
    }
  }

  private readStoredCallNotificationMeans(): CommunicationMean[] {
    try {
      const stored = sessionStorage.getItem(this.callNotificationChannelsStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return this.normalizeCallNotificationMeans(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      // fall back to legacy storage
    }

    const legacyWhatsAppPreference = this.readStoredBoolean(this.callNotifyWhatsAppStorageKey, false);
    return legacyWhatsAppPreference ? [CommunicationMean.whatsapp] : [];
  }

  private persistCallNotificationMeans(): void {
    try {
      sessionStorage.setItem(this.callNotificationChannelsStorageKey, JSON.stringify(this.selectedCallNotificationMeans));
      sessionStorage.setItem(this.callNotifyWhatsAppStorageKey, this.selectedCallNotificationMeans.includes(CommunicationMean.whatsapp) ? '1' : '0');
    } catch {
      // best effort
    }
  }

  private normalizeCallNotificationMeans(value: CommunicationMean[]): CommunicationMean[] {
    const allowed = new Set<CommunicationMean>(this.callNotificationMeans);
    const unique = new Set<CommunicationMean>();

    for (const channel of value) {
      if (allowed.has(channel)) {
        unique.add(channel);
      }
    }

    return Array.from(unique);
  }

  private syncCallNotificationMeansWithPreferences(): void {
    const availableChannels = new Set(this.preferredMeans.filter((channel) => this.callNotificationMeans.includes(channel)));
    this.selectedCallNotificationMeans = this.selectedCallNotificationMeans.filter((channel) => availableChannels.has(channel));
    this.persistCallNotificationMeans();
  }

  private formatDirectCallInviteSummary(
    ack: DirectCallInviteAck,
    selectedChannels: CommunicationMean[],
  ): string {
    const segments: string[] = [];
    const liveSegment = ack.delivered === false
      ? 'Live chat invite not delivered because the participant is offline'
      : 'Live chat invite delivered';

    segments.push(liveSegment);

    if (!selectedChannels.length) {
      segments.push('external alerts off');
      return `${segments.join('; ')}.`;
    }

    const results = Array.isArray(ack.notificationResults) ? ack.notificationResults : [];
    const successChannels = results.filter((entry) => entry.success).map((entry) => this.getCommunicationMeanLabel(entry.channel as CommunicationMean));
    const failedChannels = results.filter((entry) => !entry.success && !entry.skipped).map((entry) => this.getCommunicationMeanLabel(entry.channel as CommunicationMean));
    const skippedChannels = results
      .filter((entry) => !entry.success && entry.skipped)
      .map((entry) => `${this.getCommunicationMeanLabel(entry.channel as CommunicationMean)}${entry.reason ? ` (${entry.reason})` : ''}`);

    if (successChannels.length) {
      segments.push(`sent via ${successChannels.join(', ')}`);
    }

    if (failedChannels.length) {
      segments.push(`failed via ${failedChannels.join(', ')}`);
    }

    if (skippedChannels.length) {
      segments.push(`skipped ${skippedChannels.join(', ')}`);
    }

    const reportedChannels = new Set(results.map((entry) => entry.channel));
    const missingChannels = selectedChannels
      .filter((channel) => !reportedChannels.has(channel as any))
      .map((channel) => this.getCommunicationMeanLabel(channel));

    if (missingChannels.length) {
      segments.push(`no status for ${missingChannels.join(', ')}`);
    }

    return `${segments.join('; ')}.`;
  }

  private formatRoomCallInviteSummary(ack: DirectCallInviteAck, room: IEnrichedVideoChatRoom): string {
    const notifiedParticipantCount = Number(ack.notifiedParticipantCount || 0);
    const deliveredToOnlineCount = Number(ack.deliveredToOnlineCount || 0);
    const skippedParticipantCount = Number(ack.skippedParticipantCount || 0);
    const roomName = String(room?.name || 'Meeting').trim();
    const segments: string[] = [];

    if (!notifiedParticipantCount && !skippedParticipantCount) {
      return `${roomName} is ready. No other participants were available to notify.`;
    }

    if (notifiedParticipantCount) {
      segments.push(`alerted ${notifiedParticipantCount} participant${notifiedParticipantCount === 1 ? '' : 's'}`);
    }

    if (deliveredToOnlineCount) {
      segments.push(`${deliveredToOnlineCount} online now`);
    }

    if (skippedParticipantCount) {
      segments.push(`${skippedParticipantCount} without live account mapping`);
    }

    return `${roomName} is ready${segments.length ? `; ${segments.join('; ')}` : ''}.`;
  }

  private persistDirectCallSessionContext(context: DirectCallSessionContext): void {
    try {
      sessionStorage.setItem(this.directCallSessionStorageKey, JSON.stringify(context));
    } catch {
      // best effort
    }
  }

  private async recordDirectCallHistoryEvent(meta: DirectCallMessageMeta, content: string): Promise<void> {
    const chatRoomId = String(meta.chatRoomId || '').trim();
    const receiverId = String(meta.callerUserId || meta.actorUserId || '').trim();

    if (!chatRoomId || !receiverId) {
      return;
    }

    try {
      await firstValueFrom(this.chatMessageService.createAsync({
        roomId: chatRoomId,
        receiverId,
        content,
        type: 'system',
        meta,
        skipExternalNotification: true,
      } as any, true, false).pipe(take(1)));
    } catch (error) {
      console.error('Error recording direct call history event', error);
    }
  }

  private async notifyDirectCall(room: IEnrichedVideoChatRoom | VideoChatRoom, contact: ChatContactView, callType: DirectCallType): Promise<void> {
    const roomId = String(room?._id || '').trim();
    const targetUserId = String(contact.contactId || '').trim();

    if (!roomId || !targetUserId) {
      return;
    }

    try {
      const selectedChannels = this.selectedCallNotificationMeans.filter((channel) => !this.isCallNotificationChannelUnavailable(channel));
      const ack = await this.chat.sendDirectCallInvite({
        roomId,
        chatRoomId: contact.roomId,
        targetUserId,
        roomName: String(room.name || `${contact.contactName || 'Direct'} call`).trim(),
        callType,
        selectedCommunicationMeans: selectedChannels,
      });

      if (!ack?.ok) {
        this.conversationBanner = 'The call started, but the live invite notification could not be sent.';
      } else {
        this.conversationBanner = this.formatDirectCallInviteSummary(ack, selectedChannels);
      }
    } catch (error) {
      console.error('Error sending direct call invite', error);
      this.conversationBanner = 'The call started, but the live invite notification could not be sent.';
    }
  }

  private queueDirectCallNotification(room: IEnrichedVideoChatRoom | VideoChatRoom, contact: ChatContactView, callType: DirectCallType): void {
    const roomId = String(room?._id || '').trim();
    const targetUserId = String(contact.contactId || '').trim();

    if (!roomId || !targetUserId) {
      return;
    }

    const selectedChannels = this.selectedCallNotificationMeans.filter((channel) => !this.isCallNotificationChannelUnavailable(channel));

    void this.chat.sendDirectCallInvite({
      roomId,
      chatRoomId: contact.roomId,
      targetUserId,
      roomName: String(room.name || `${contact.contactName || 'Direct'} call`).trim(),
      callType,
      selectedCommunicationMeans: selectedChannels,
    }).catch((error) => {
      console.error('Error sending direct call invite', error);
    });
  }

  private queueRoomCallNotification(room: IEnrichedVideoChatRoom, callType: DirectCallType): void {
    const roomId = String(room?._id || '').trim();
    if (!roomId) {
      return;
    }

    void this.chat.sendRoomCallInvite({
      roomId,
      roomName: String(room?.name || '').trim() || undefined,
      callType,
    }).catch((error) => {
      console.error('Error sending room call invite', error);
    });
  }

  private openDirectCall(room: IEnrichedVideoChatRoom | VideoChatRoom, callType: DirectCallType): void {
    const roomId = String(room?._id || '').trim();
    if (!roomId) {
      return;
    }

    const chatRoomId = String(this.selectedContact?.roomId || '').trim();
    const counterpartUserId = String(this.selectedContact?.contactId || '').trim();
    if (chatRoomId && counterpartUserId) {
      this.persistDirectCallSessionContext({
        roomId,
        chatRoomId,
        counterpartUserId,
        counterpartName: this.selectedContact?.contactName,
        callType,
        role: 'caller',
        startedAt: Date.now(),
      });
    }

    this.prepareCallPreferences(callType);
    this.navigateToRoomView(roomId, 'video-chat');
  }

  startAudioCallForContact(contact: ChatContactView | null = this.selectedContact): void {
    this.startDirectCall('audio', contact);
  }

  startVideoCallForContact(contact: ChatContactView | null = this.selectedContact): void {
    this.startDirectCall('video', contact);
  }

  startAudioCallForRoom(room: IEnrichedVideoChatRoom | null = this.selectedVideoRoom): void {
    this.startRoomCall('audio', room);
  }

  startVideoCallForRoom(room: IEnrichedVideoChatRoom | null = this.selectedVideoRoom): void {
    this.startRoomCall('video', room);
  }

  private startDirectCall(callType: DirectCallType, contact: ChatContactView | null = this.selectedContact): void {
    const resolvedContact = this.resolveCallContact(contact);
    if (!resolvedContact?.contactId) {
      return;
    }

    const currentUserEmail = this.resolveCurrentUserEmail();
    const targetEmail = String(resolvedContact.email || '').trim();

    if (!currentUserEmail || !targetEmail) {
      this.conversationBanner = 'This direct chat is still missing participant email data, so the call cannot be prepared yet.';
      this.cdr.markForCheck();
      return;
    }

    this.selectedContact = this.mergeContactRecords(this.selectedContact, resolvedContact);

    const directChatRoomId = String(resolvedContact.roomId || '').trim();
    if (!directChatRoomId) {
      this.resolveDirectChatRoom(resolvedContact).pipe(take(1)).subscribe({
        next: (chatRoom) => {
          if (!chatRoom?._id) {
            this.conversationBanner = 'The direct chat room could not be resolved, so the call cannot start yet.';
            this.cdr.markForCheck();
            return;
          }

          this.selectedContact = this.mergeContactRecords(this.selectedContact, {
            ...resolvedContact,
            roomId: chatRoom._id,
            roomName: String(chatRoom.name || '').trim() || undefined,
          } as ChatContactView);

          this.startDirectCall(callType, this.selectedContact);
        },
        error: (err) => {
          console.error('Error resolving direct chat room for call', err);
          this.conversationBanner = `The ${callType} call could not be started right now.`;
          this.cdr.markForCheck();
        },
      });
      return;
    }

    // Search for existing room by participants (not by chat room ID)
    const existingRoom = this.findExistingDirectVideoRoom(resolvedContact, currentUserEmail);
    if (existingRoom?._id) {
      this.isStartingCall = true;
      this.conversationBanner = '';
      this.openDirectCall(existingRoom, callType);
      this.queueDirectCallNotification(existingRoom, resolvedContact, callType);
      this.isStartingCall = false;
      this.cdr.markForCheck();
      return;
    }

    this.isStartingCall = true;
    this.conversationBanner = '';

    // Don't set _id - let MongoDB generate unique ID to avoid duplicate key errors
    const videoChatRoom: VideoChatRoom = {
      name: `${resolvedContact.contactName || 'Direct'} call`,
      type: VideoChatRoomType.DIRECT,
      isVerified: true,
      participants: [
        { email: currentUserEmail } as any,
        { email: targetEmail } as any,
      ],
      userId: this.userId,
      createdBy: this.userId,
      createdDate: new Date(),
    };

    this.videoChatRoomService.createAsync(videoChatRoom, true, false).pipe(take(1)).subscribe({
      next: (room) => {
        if (!room?._id) {
          this.isStartingCall = false;
          this.conversationBanner = 'The call room could not be created. Please try again.';
          this.cdr.markForCheck();
          return;
        }

        this.videoRooms = [room as IEnrichedVideoChatRoom, ...this.videoRooms.filter(existing => existing._id !== room._id)];
        this.openDirectCall(room, callType);
        this.queueDirectCallNotification(room, resolvedContact, callType);
        this.isStartingCall = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error creating direct video room', err);
        this.isStartingCall = false;
        this.conversationBanner = `The ${callType} call could not be started right now.`;
        this.cdr.markForCheck();
      }
    });
  }

  private startRoomCall(callType: DirectCallType, room: IEnrichedVideoChatRoom | null = this.selectedVideoRoom): void {
    const roomId = String(room?._id || '').trim();
    if (!roomId || this.isStartingCall) {
      return;
    }

    this.isStartingCall = true;
    this.conversationBanner = '';
    this.prepareCallPreferences(callType);
    this.navigateToRoomView(roomId, 'video-chat');
    this.queueRoomCallNotification(room!, callType);
    this.isStartingCall = false;
    this.cdr.markForCheck();
  }

  joinVideoRoom(room: IEnrichedVideoChatRoom | null = this.selectedVideoRoom): void {
    if (!room?._id) {
      return;
    }

    this.navigateToRoomView(String(room._id), 'video-chat');
  }

  copyRoomId(room: IEnrichedVideoChatRoom | null = this.selectedVideoRoom): void {
    const roomId = String(room?._id || '').trim();
    if (!roomId || !navigator?.clipboard?.writeText) {
      return;
    }

    navigator.clipboard.writeText(roomId).then(() => {
      this.conversationBanner = 'Room ID copied. Share it to bring others straight into the call.';
      this.cdr.markForCheck();
    }).catch(() => {
      this.conversationBanner = 'Room ID could not be copied from this browser context.';
      this.cdr.markForCheck();
    });
  }

  copySelectedConversationRoomId(): void {
    const roomId = this.selectedRoomId;
    if (!roomId || !navigator?.clipboard?.writeText) {
      return;
    }

    navigator.clipboard.writeText(roomId).then(() => {
      this.conversationBanner = 'Room ID copied. Share it to bring the right participants into the same thread.';
      this.cdr.markForCheck();
    }).catch(() => {
      this.conversationBanner = 'Room ID could not be copied from this browser context.';
      this.cdr.markForCheck();
    });
  }

  trackByIdx(i: number) { return i; }

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
      case CommunicationMean.onlineMeeting:
        return 'assets/icons/meeting.svg';
      case CommunicationMean.personalMeeting:
        return 'assets/icons/personal-meeting.svg';
      default:
        return 'assets/icons/phone-solid.svg';
    }
  }

  isDisabled(channel: CommunicationMean): boolean {
    return !this.preferredMeans.includes(channel);
  }

  toggleIcon(communicationMean: CommunicationMean): void {
    if (this.isDisabled(communicationMean)) {
      return;
    }

    const index = this.selectedCommunicationMeans.indexOf(communicationMean);

    if (index >= 0) {
      this.selectedCommunicationMeans.splice(index, 1);
    } else {
      this.selectedCommunicationMeans.push(communicationMean);
    }
  }

  trackByContactId(index: number, item: IContact): string {
    return item?.contactId || String(index);
  }

  getContactInitials(contact?: IContact | null): string {
    if (!contact) {
      return 'EV';
    }

    const source = String(contact.contactName || contact.pseudonym || contact.username || contact.email || contact.contactId || 'EV').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  }

  getRoomInitials(room?: IEnrichedVideoChatRoom | null): string {
    const source = String(room?.name || room?._id || 'VR').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  }

  getGroupInitials(name?: string | null): string {
    const source = String(name || 'GC').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  }

  getContactSubtitle(contact?: IContact | null): string {
    if (!contact) {
      return 'No contact selected';
    }

    return contact.pseudonym || contact.role || contact.email || contact.phone || contact.username || 'Available for direct chat';
  }

  getVideoRoomParticipantLabel(participant?: { name?: any; email?: any } | null): string {
    return String(participant?.name || participant?.email || 'Participant').trim();
  }

  transformLastMessageText(message: string | undefined): string {
    return message ? `${message.slice(0, 30)}...` : 'No messages...';
  }

  openProfile(talentId: string | undefined, event: Event): void {
    event.stopPropagation();
    if (talentId) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree([
          environment.routes.talentTab.publicProfile,
          talentId,
        ])
      );
      window.open(url, '_blank');
    }
  }

  formatMessageContent(content: string): SafeHtml {
    if (!content) {
      return '';
    }

    const withLineBreaks = content.replace(/\n/g, '<br>');

    return this.sanitizer.bypassSecurityTrustHtml(withLineBreaks);
  }

  private toCompactId(value: string): string {
    const normalized = String(value || '').trim();
    if (!normalized) {
      return 'Pending';
    }

    if (normalized.length <= 12) {
      return normalized.toUpperCase();
    }

    return `${normalized.slice(0, 6).toUpperCase()}-${normalized.slice(-4).toUpperCase()}`;
  }

  deleteRoom(messageId: string) {
    this.chatRoomService.deleteAsync(messageId, true, false).pipe(take(1)).subscribe({
      next: (res) => {
        if (res) {
          console.log('Chat Room was successfully deleted', res);
          this.isChatLoading = false;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error deleting message', err);
        this.cdr.markForCheck();
      }
    });
  }

  deleteMessage(messageId: string) {
    this.chatMessageService.deleteAsync(messageId, true, false).pipe(take(1)).subscribe({
      next: (res) => {
        if (res) {
          console.log('Message was successfully deleted', res);
          this.isChatLoading = false;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error deleting message', err);
        this.cdr.markForCheck();
      }
    });
  }
}