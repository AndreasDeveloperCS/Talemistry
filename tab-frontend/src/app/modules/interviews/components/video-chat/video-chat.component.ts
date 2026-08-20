
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { firstValueFrom, ReplaySubject, Subscription, take } from 'rxjs';
import { RoomPresenceParticipant, RTCAdvancedService, RemotePeerStream } from '../../services/RTC-advanced.service';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoChatRoomService } from '../../services/video-chat-room.service';
import { VideoChatRoom } from '../../models/video-chat-room';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { ChatService } from '../../services/chat.service';
import { ChatMessagePayload, DirectCallMessageMeta, IChatMessageResponse } from '../../models/chat-message-payload';
import { ChatMessageService } from '../../services/chat-message.service';
import { VideoCallDockService } from '../../services/video-call-dock.service';
import { FilterRule, Filtering, Sorting } from 'src/app/modules/general/services/search-logic.service';

interface PeerStream {
  peerId: string;
  stream: MediaStream;
  isScreen: boolean;
  isLocal: boolean;
  socketId?: string;
  displayName?: string;
  isSpeaking?: boolean;
  audioLevel?: number;
  isMuted?: boolean;
}

interface AudioAnalyzerBinding {
  analyzer: AnalyserNode;
  source: MediaStreamAudioSourceNode;
  streamId: string;
}

interface ClientErrorEntry {
  id: number;
  ts: number;
  source: 'console.error' | 'window.error' | 'unhandledrejection';
  message: string;
  stack?: string;
  count: number;
}

interface HiddenTabLayoutState {
  isMinimized: boolean;
  layoutMode: 'grid' | 'ribbon' | 'overlay';
  screenShareMode: 'separate' | 'overlay' | 'fullscreen';
  focusedStreamId?: string;
  pinnedParticipants: string[];
}

interface InCallTextChatMessage {
  id: string;
  text: string;
  senderLabel: string;
  senderUserId?: string;
  mine: boolean;
  sentAt: number;
  type?: string;
}

interface DirectCallSessionContext {
  roomId: string;
  chatRoomId: string;
  counterpartUserId: string;
  counterpartName?: string;
  callType: 'audio' | 'video';
  role: 'caller' | 'callee';
  startedAt: number;
  answeredAt?: number;
  joinHistoryRecordedAt?: number;
}

interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

@Component({
  standalone: false,
  selector: 'app-video-chat',
  templateUrl: './video-chat.component.html',
  styleUrl: './video-chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoChatComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('localVideo', { static: false }) localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('localScreen', { static: false }) localScreenRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('inCallChatScroll', { static: false }) inCallChatScrollRef?: ElementRef<HTMLDivElement>;
  @ViewChild('inCallChatComposer', { static: false }) inCallChatComposerRef?: ElementRef<HTMLTextAreaElement>;

  private sub?: Subscription;
  private localStreamSub?: Subscription;
  private participantsSub?: Subscription;
  private roomPresenceSub?: Subscription;
  private peerMediaStateSub?: Subscription;
  private routeParamSub?: Subscription;
  private authorizedRoomSub?: Subscription;
  private textChatMessageSub?: Subscription;
  private textChatTypingSub?: Subscription;
  private dockEndCallSub?: Subscription;
  room?: VideoChatRoom;
  private routeRoomId?: string;
  private readonly authorizedRoomId$ = new ReplaySubject<string>(1);
  private authorizedRoomLoadSequence = 0;
  private roomSwitchSequence = 0;
  private activeJoinedRoomId?: string;
  private rtcSubscriptionsInitialized = false;
  isPreparingPreview = true;
  isJoiningRoom = false;
  currentUserEmail: string = '';
  currentUserDisplayName: string = '';
  audioOn = true;
  // Speakers start ON so users can hear others immediately.
  // If autoplay is blocked, users can manually enable speakers.
  speakersOn = true;
  videoOn = true;
  sharingScreen = false;
  isAudioOnlyMode = false; // Track if we're in audio-only mode
  allStreams: PeerStream[] = [];
  layoutMode: 'grid' | 'ribbon' | 'overlay' = 'grid';
  mainStream?: PeerStream;
  secondaryStreams: PeerStream[] = [];

  // Separate ribbons for screens and participants
  screenShares: PeerStream[] = [];
  participantStreams: PeerStream[] = [];
  pinnedParticipants: Set<string> = new Set(); // Track pinned participant IDs
  screenShareMode: 'separate' | 'overlay' | 'fullscreen' = 'separate'; // Screen share display mode

  // When screen sharing is active, we behave like Google Meet:
  // one focused tile in the center + a filmstrip of other tiles.
  private focusedStreamId?: string;
  private hadScreenShare = false;

  // Picture-in-Picture: if a screen-share is popped out, we should
  // use the in-app space for other participants instead of showing
  // the browser's "This video is playing in Picture-in-Picture" message.
  private pipStreamId?: string;
  private pipSyncTimer?: number;
  private hiddenTabLayoutState?: HiddenTabLayoutState;
  private autoBackgroundPipPeerId?: string;
  private floatingOverlayWindow?: Window | null;
  private floatingOverlayPeerId?: string;
  floatingMiniPlayerMessage = '';
  private floatingMiniPlayerMessageTimer?: number;

  private readonly onDocumentPictureInPictureChange = () => this.syncPipStateFromDocument();
  private readonly onFloatingOverlayWindowClosed = () => {
    this.floatingOverlayWindow = undefined;
    this.floatingOverlayPeerId = undefined;
    this.cdr.markForCheck();
  };
  private readonly directCallSessionStorageKey = 'text-chat.direct-call.session';
  private directCallSession?: DirectCallSessionContext;
  private directCallJoinHistoryInFlight = false;
  availableAudioInputDevices: MediaDeviceOption[] = [];
  availableVideoInputDevices: MediaDeviceOption[] = [];
  selectedAudioInputDeviceId = '';
  selectedVideoInputDeviceId = '';

  localCameraStream?: MediaStream;
  localPreviewStream?: MediaStream;
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  profileId = '';
  notParticipant: boolean = true;
  errorMessage: string = '';
  isMinimized: boolean = false;
  isTextChatOpen: boolean = false;
  isTextChatMinimized: boolean = false;
  textChatDraft: string = '';
  textChatMessages: InCallTextChatMessage[] = [];
  textChatUnreadCount: number = 0;
  textChatConnected: boolean = false;
  textChatPeerTyping: boolean = false;
  isMobileViewport: boolean = false;
  textChatHistoryTotal: number = 0;
  textChatHistoryPageIndex: number = 0;
  readonly textChatHistoryPageSize: number = 10;
  isTextChatHistoryLoading: boolean = false;
  isTextChatLoadingOlder: boolean = false;
  private textChatHistoryRequestSeq: number = 0;
  private textChatDismissedWhileSolo: boolean = false;

  // Audio context for speaking detection
  private audioContext?: AudioContext;
  private audioAnalyzers = new Map<string, AudioAnalyzerBinding>();
  private speakingDetectionInterval?: any;

  // Debounce applying RTC quality policies
  private qualityPolicyTimer?: any;
  private rtcInitStarted = false;
  private rtcInitCompleted = false;

  // Autoplay policies can block unmuted remote playback until a user gesture.
  // We start remote media muted so video renders immediately, then unmute after first interaction.
  private playbackUnlocked = false;

  // Stable listener references (so removeEventListener works)
  private readonly onVisibilityChange = () => this.handleVisibilityChange();
  private readonly onPageHide = () => this.handleWindowCloseLikeEvent('pagehide');
  private readonly onBeforeUnload = () => this.handleWindowCloseLikeEvent('beforeunload');
  private readonly onWindowResize = () => this.handleWindowResize();
  private readonly onKeyboardShortcut = (event: KeyboardEvent) => this.handleKeyboardShortcut(event);

  // In-call device switcher
  showDeviceSwitcher = false;

  // Sidebar visibility
  sidebarVisible = true;

  // Participant info
  participantCount = 0;
  roomPresenceEntries: RoomPresenceParticipant[] = [];
  maxVisibleParticipants = 49; // Optimize for large calls
  iceWarningMessage: string = '';

  // Debug overlay for troubleshooting RTC issues in production.
  // Enable via `?rtcDebug=1` or `sessionStorage.setItem('rtcDebug','1')`.
  rtcDebugEnabled = false;
  rtcDebugParticipantIdsCount = 0;
  rtcDebugParticipantIdsLabel = '';
  rtcDebugRemoteStreamsCount = 0;
  rtcDebugRemoteStreamsLabel = '';

  private rtcDebugLastLogLine = '';

  // Mobile-friendly error popups (captures console errors and unhandled errors).
  clientErrors: ClientErrorEntry[] = [];
  clientErrorsVisible = false;
  private clientErrorIdSeq = 1;
  private originalConsoleError?: (...args: any[]) => void;
  private readonly onWindowError = (event: ErrorEvent) => this.captureWindowError(event);
  private readonly onUnhandledRejection = (event: PromiseRejectionEvent) => this.captureUnhandledRejection(event);

  get roomDisplayName(): string {
    return String(this.room?.name || 'Video room').trim();
  }

  get roomSubtitle(): string {
    if (this.screenShares.length > 0) {
      return `${this.screenShares.length} screen share${this.screenShares.length === 1 ? '' : 's'} active`;
    }

    return `${this.participantCount} participant${this.participantCount === 1 ? '' : 's'} connected`;
  }

  get textChatStatusText(): string {
    if (!this.activeJoinedRoomId) {
      return 'Text chat becomes available after you join the room.';
    }

    if (this.isTextChatHistoryLoading && this.textChatMessages.length === 0) {
      return 'Loading conversation history...';
    }

    if (!this.textChatConnected && this.textChatMessages.length === 0) {
      return 'Connecting chat...';
    }

    if (this.textChatPeerTyping) {
      return 'Someone is typing...';
    }

    if (this.isTextChatLoadingOlder) {
      return 'Loading earlier messages...';
    }

    const loaded = this.textChatMessages.length;
    const total = Math.max(loaded, this.textChatHistoryTotal);

    if (!total) {
      return 'No messages in this room yet.';
    }

    if (loaded < total) {
      return `Showing ${loaded} of ${total} messages. Scroll up for earlier history.`;
    }

    return `${total} message${total === 1 ? '' : 's'} in this room`;
  }

  get shouldAutoDockTextChat(): boolean {
    return !!this.activeJoinedRoomId && !this.isMobileViewport && this.connectedRoomParticipantsCount <= 1;
  }

  get showDockedTextChat(): boolean {
    if (this.isMobileViewport) {
      return false;
    }

    if (this.shouldAutoDockTextChat && !this.textChatDismissedWhileSolo) {
      return true;
    }

    return this.isTextChatOpen && !this.isTextChatMinimized;
  }

  get showMinimizedTextChatRail(): boolean {
    return this.isTextChatOpen && this.isTextChatMinimized && !this.isMobileViewport;
  }

  get showMobileTextChatDrawer(): boolean {
    return this.isTextChatOpen && this.isMobileViewport;
  }

  get isTextChatVisible(): boolean {
    return this.showDockedTextChat || this.showMobileTextChatDrawer;
  }

  get canLoadOlderTextChatMessages(): boolean {
    return this.textChatMessages.length < this.textChatHistoryTotal;
  }

  get textChatToggleTitle(): string {
    if (this.isTextChatVisible) {
      return 'Close text chat';
    }

    if (this.showMinimizedTextChatRail) {
      return 'Restore text chat';
    }

    return 'Open text chat';
  }

  get layoutLabel(): string {
    switch (this.effectiveLayoutMode) {
      case 'grid':
        return 'Grid layout';
      case 'ribbon':
        return 'Ribbon layout';
      case 'overlay':
        return 'Overlay layout';
      case 'present':
        return 'Presentation layout';
      default:
        return 'Adaptive layout';
    }
  }

  get visiblePeopleStreams(): PeerStream[] {
    return this.participantStreams.filter(stream => !stream.isScreen);
  }

  get connectedRoomParticipantsCount(): number {
    if (this.roomPresenceEntries.length === 0) {
      return this.participantCount;
    }

    return this.roomPresenceEntries.filter((participant) => participant.inRoom).length;
  }

  get visibleGridParticipantCount(): number {
    return (this.participantStreams ?? []).filter((stream) => !this.isPipStream(stream.peerId)).length;
  }

  get useBalancedGrid(): boolean {
    const count = this.visibleGridParticipantCount;
    return count >= 6 && count <= 8;
  }

  get useCompactGrid(): boolean {
    const count = this.visibleGridParticipantCount;
    return count >= 9 && count <= 12;
  }

  get useDenseSidebar(): boolean {
    return Math.max(this.roomPresenceEntries.length, this.connectedRoomParticipantsCount) >= 6;
  }

  get useSpeakerPriorityGrid(): boolean {
    const count = this.visibleGridParticipantCount;
    return this.effectiveLayoutMode === 'grid' && this.pinnedParticipants.size === 0 && count >= 6 && count <= 12;
  }

  get featuredGridSpeakerId(): string | undefined {
    if (!this.useSpeakerPriorityGrid) {
      return undefined;
    }

    const remoteSpeaking = this.participantStreams.find((stream) => !this.isPipStream(stream.peerId)
      && !stream.isLocal
      && !!stream.isSpeaking
      && !stream.isMuted);

    if (remoteSpeaking) {
      return remoteSpeaking.peerId;
    }

    const anySpeaking = this.participantStreams.find((stream) => !this.isPipStream(stream.peerId)
      && !!stream.isSpeaking
      && !stream.isMuted);

    return anySpeaking?.peerId;
  }

  get gridParticipantStreams(): PeerStream[] {
    const streams = [...this.participantStreams];
    const featuredId = this.featuredGridSpeakerId;

    if (!featuredId) {
      return streams;
    }

    const featuredIndex = streams.findIndex((stream) => stream.peerId === featuredId);
    if (featuredIndex <= 0) {
      return streams;
    }

    const [featured] = streams.splice(featuredIndex, 1);
    streams.unshift(featured);
    return streams;
  }

  isFeaturedGridSpeaker(peerId: string): boolean {
    return this.featuredGridSpeakerId === peerId;
  }

  get showPreJoinPreview(): boolean {
    return !this.notParticipant && !!this.room && !this.activeJoinedRoomId;
  }

  get canJoinRoom(): boolean {
    return !this.isPreparingPreview && !this.isJoiningRoom && !!this.room && !!this.routeRoomId;
  }

  get joinActionLabel(): string {
    return this.isJoiningRoom ? 'Joining...' : 'Join now';
  }

  get preJoinModeLabel(): string {
    return this.directCallSession?.callType === 'audio' ? 'Audio call' : 'Video call';
  }

  get preJoinCameraStatusLabel(): string {
    if (this.isAudioOnlyMode) {
      return 'Unavailable';
    }

    return this.videoOn ? 'On' : 'Off';
  }

  get hasAudioInputChoices(): boolean {
    return this.availableAudioInputDevices.length > 1;
  }

  get hasVideoInputChoices(): boolean {
    return this.availableVideoInputDevices.length > 1;
  }

  trackByPeerStreamId(_index: number, item: PeerStream): string {
    return item.peerId;
  }

  trackByRoomPresenceParticipant(_index: number, item: RoomPresenceParticipant): string {
    return item.participantKey;
  }

  trackByTextChatMessageId(_index: number, item: InCallTextChatMessage): string {
    return item.id;
  }

  private parseTruth(value: string | null | undefined): boolean {
    if (!value) return false;
    const v = String(value).trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes' || v === 'on';
  }

  private initRtcDebugFlag(): void {
    try {
      const fromQuery = this.route.snapshot.queryParamMap.get('rtcDebug');
      const fromSession = sessionStorage.getItem('rtcDebug');
      this.rtcDebugEnabled = this.parseTruth(fromQuery) || this.parseTruth(fromSession);
    } catch {
      this.rtcDebugEnabled = false;
    }
  }

  private maybeLogRtcDebug(source: string): void {
    if (!this.rtcDebugEnabled) return;
    const line = `RTC Debug [${source}] participantCount=${this.participantCount} peers=${this.rtcDebugParticipantIdsCount} remoteStreams=${this.rtcDebugRemoteStreamsCount} tiles=${this.allStreams.length} (cams=${this.participantStreams.length} screens=${this.screenShares.length})`;
    if (line === this.rtcDebugLastLogLine) return;
    this.rtcDebugLastLogLine = line;
    console.log(line, {
      peers: this.rtcDebugParticipantIdsLabel,
      remoteStreams: this.rtcDebugRemoteStreamsLabel,
    });
  }

  private updateRtcDebugFromParticipants(ids: string[] | undefined | null): void {
    if (!this.rtcDebugEnabled) return;

    const safe = (ids ?? []).filter(Boolean);
    this.rtcDebugParticipantIdsCount = safe.length;
    this.rtcDebugParticipantIdsLabel = safe
      .slice(0, 12)
      .map((id) => String(id).slice(0, 6))
      .join(', ');

    this.maybeLogRtcDebug('participants');
  }

  private updateRtcDebugFromRemoteStreams(remoteStreams: RemotePeerStream[] | undefined | null): void {
    if (!this.rtcDebugEnabled) return;

    const safe = remoteStreams ?? [];
    this.rtcDebugRemoteStreamsCount = safe.length;
    this.rtcDebugRemoteStreamsLabel = safe
      .slice(0, 12)
      .map((s) => `${String(s.peerId).slice(0, 6)}:${String(s.streamId).slice(0, 4)}${s.isScreen ? '[S]' : ''}`)
      .join(', ');

    this.maybeLogRtcDebug('streams');
  }

  constructor(
    private rtcAdvanced: RTCAdvancedService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef<HTMLElement>,
    public route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private videoChatRoomService: VideoChatRoomService,
    private chatService: ChatService,
    private directChatMessageService: ChatMessageService,
    private videoCallDock: VideoCallDockService,
  ) { }

  private readDirectCallSessionContext(): DirectCallSessionContext | undefined {
    try {
      const raw = sessionStorage.getItem(this.directCallSessionStorageKey);
      if (!raw) {
        return undefined;
      }

      const parsed = JSON.parse(raw) as DirectCallSessionContext;
      if (!parsed?.roomId || !parsed?.chatRoomId || !parsed?.counterpartUserId) {
        return undefined;
      }

      return parsed;
    } catch {
      return undefined;
    }
  }

  private readDirectCallSessionFromRoute(roomId: string): DirectCallSessionContext | undefined {
    const normalizedRoomId = String(roomId || '').trim();
    if (!normalizedRoomId) {
      return undefined;
    }

    try {
      const query = this.route.snapshot.queryParamMap;
      const chatRoomId = String(query.get('chatRoomId') || '').trim();
      const counterpartUserId = String(query.get('counterpartUserId') || '').trim();
      const callTypeParam = String(query.get('callType') || '').trim().toLowerCase();
      const roleParam = String(query.get('directCallRole') || '').trim().toLowerCase();

      if (!chatRoomId || !counterpartUserId || (callTypeParam !== 'audio' && callTypeParam !== 'video')) {
        return undefined;
      }

      if (roleParam !== 'caller' && roleParam !== 'callee') {
        return undefined;
      }

      return {
        roomId: normalizedRoomId,
        chatRoomId,
        counterpartUserId,
        counterpartName: String(query.get('counterpartName') || '').trim() || undefined,
        callType: callTypeParam,
        role: roleParam,
        startedAt: Date.now(),
      };
    } catch {
      return undefined;
    }
  }

  private applyDirectCallPreferences(callType: 'audio' | 'video'): void {
    try {
      sessionStorage.setItem('rtc.audioEnabled', '1');
      sessionStorage.setItem('rtc.videoEnabled', callType === 'audio' ? '0' : '1');
    } catch {
      // best effort
    }
  }

  private hydrateDirectCallSession(roomId: string): void {
    const storedContext = this.readDirectCallSessionContext();
    if (storedContext?.roomId === roomId) {
      this.directCallSession = storedContext;
      this.applyDirectCallPreferences(storedContext.callType);
      return;
    }

    const routeContext = this.readDirectCallSessionFromRoute(roomId);
    if (routeContext) {
      this.directCallSession = routeContext;
      this.applyDirectCallPreferences(routeContext.callType);
      this.persistDirectCallSessionContext();
      return;
    }

    this.directCallSession = undefined;
  }

  private persistDirectCallSessionContext(): void {
    if (!this.directCallSession) {
      return;
    }

    try {
      sessionStorage.setItem(this.directCallSessionStorageKey, JSON.stringify(this.directCallSession));
    } catch {
      // best effort
    }
  }

  private clearDirectCallSessionContext(): void {
    this.directCallSession = undefined;
    try {
      sessionStorage.removeItem(this.directCallSessionStorageKey);
    } catch {
      // best effort
    }
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

  private buildReturnToCallUrl(): string {
    const roomId = String(this.routeRoomId ?? this.room?._id ?? this.activeJoinedRoomId ?? '').trim();
    if (!roomId) {
      return '';
    }

    const baseUrl = this.buildRecruitmentRoomUrl(roomId, 'video-chat');
    const token = String(this.route.snapshot.queryParamMap.get('token') || (this.room as any)?.joinToken || '').trim();
    if (!token) {
      return baseUrl;
    }

    return `${baseUrl}?token=${encodeURIComponent(token)}`;
  }

  private syncVideoCallDockState(): void {
    const roomId = String(this.activeJoinedRoomId ?? this.routeRoomId ?? this.room?._id ?? '').trim();
    const returnUrl = this.buildReturnToCallUrl();

    if (!roomId || !this.activeJoinedRoomId || !returnUrl) {
      this.videoCallDock.clear();
      return;
    }

    this.videoCallDock.activate({
      roomId,
      roomName: this.roomDisplayName,
      participantCount: Math.max(1, Number(this.participantCount || 1)),
      returnUrl,
      audioEnabled: this.audioOn,
      videoEnabled: this.videoOn,
      speakersEnabled: this.speakersOn,
      isAudioOnlyMode: this.isAudioOnlyMode,
    });
  }

  private async navigateBackToChatDialog(): Promise<void> {
    const roomId = String(this.routeRoomId ?? this.room?._id ?? this.directCallSession?.roomId ?? '').trim();
    if (roomId) {
      await this.router.navigate(['/recruitment/communication/room', roomId, 'text-chat']);
      return;
    }

    await this.router.navigate(['/recruitment/communication/text-chat']);
  }

  private async recordDirectCallTerminalHistory(kind: 'direct-call-ended' | 'direct-call-missed'): Promise<void> {
    await this.persistDirectCallTerminalHistory(kind, this.directCallSession);
  }

  private async persistDirectCallTerminalHistory(
    kind: 'direct-call-ended' | 'direct-call-missed',
    context: DirectCallSessionContext | undefined,
  ): Promise<void> {
    if (!context || context.role !== 'caller') {
      this.clearDirectCallSessionContext();
      return;
    }

    const timestamp = Date.now();
    const content = kind === 'direct-call-missed'
      ? `${context.callType === 'audio' ? 'Audio' : 'Video'} call missed`
      : `${context.callType === 'audio' ? 'Audio' : 'Video'} call ended`;
    const meta: DirectCallMessageMeta = {
      kind,
      roomId: context.roomId,
      chatRoomId: context.chatRoomId,
      roomName: this.room?.name,
      callType: context.callType,
      callerUserId: String(this.userId || '').trim(),
      callerName: this.currentUserDisplayName || this.currentUserEmail || 'Participant',
      sentAt: timestamp,
      actorUserId: String(this.userId || '').trim(),
      actorName: this.currentUserDisplayName || this.currentUserEmail || 'Participant',
      endedAt: timestamp,
      answeredAt: context.answeredAt,
    };

    try {
      await firstValueFrom(this.directChatMessageService.createAsync({
        roomId: context.chatRoomId,
        receiverId: context.counterpartUserId,
        content,
        type: 'system',
        meta,
        skipExternalNotification: true,
      } as any, true, false).pipe(take(1)));
    } catch (error) {
      console.error('Failed to persist direct call history event', error);
    } finally {
      this.clearDirectCallSessionContext();
    }
  }

  private async recordDirectCallJoinHistory(): Promise<void> {
    const context = this.directCallSession;
    if (!context || context.role !== 'callee' || context.joinHistoryRecordedAt) {
      return;
    }

    const answeredAt = Number(context.answeredAt || Date.now());
    const actorName = String(this.currentUserDisplayName || this.currentUserEmail || 'Participant').trim() || 'Participant';
    const content = `${context.callType === 'audio' ? 'Audio' : 'Video'} joined the call`;
    const meta: DirectCallMessageMeta = {
      kind: 'direct-call-answered',
      roomId: context.roomId,
      chatRoomId: context.chatRoomId,
      roomName: this.room?.name,
      callType: context.callType,
      callerUserId: context.counterpartUserId,
      callerName: context.counterpartName,
      sentAt: answeredAt,
      actorUserId: String(this.userId || '').trim(),
      actorName,
      answeredAt,
    };

    try {
      await firstValueFrom(this.directChatMessageService.createAsync({
        roomId: context.chatRoomId,
        receiverId: context.counterpartUserId,
        content,
        type: 'system',
        meta,
        skipExternalNotification: true,
      } as any, true, false).pipe(take(1)));

      if (this.directCallSession) {
        this.directCallSession.joinHistoryRecordedAt = answeredAt;
        this.persistDirectCallSessionContext();
      }
    } catch (error) {
      console.error('Failed to persist direct call join history event', error);
    }
  }

  private shouldCaptureClientErrors(): boolean {
    return this.rtcDebugEnabled || !environment.production;
  }

  private getSignalingToken(): string {
    // Prefer authenticated session token when available.
    try {
      const byUserId = sessionStorage.getItem(`${environment.storage.prefixToken}${this.userId}`);
      const direct = sessionStorage.getItem(`${environment.storage.token}`);
      const sessionToken = String(byUserId || direct || '').trim();
      if (sessionToken) return sessionToken;
    } catch {
      // ignore
    }

    // Fallback: tokenized room join link (public join).
    const tokenFromUrl = (this.route.snapshot.queryParamMap.get('token') ?? '').trim();
    return tokenFromUrl;
  }

  // Helper methods for template
  hasScreenShare(): boolean {
    return this.allStreams.some(s => s.isScreen);
  }

  get pipScreenShareActive(): boolean {
    const pip = this.pipStreamId ? this.allStreams.find(s => s.peerId === this.pipStreamId) : undefined;
    return !!pip?.isScreen;
  }

  get isSoloView(): boolean {
    // "Solo" means there is only one visible tile in the app.
    // Exclude PiP streams because those elements remain in DOM but must not affect layout.
    const visibleScreens = (this.screenShares ?? []).filter(s => !this.isPipStream(s.peerId));
    const visibleParticipants = (this.participantStreams ?? []).filter(s => !this.isPipStream(s.peerId));
    return visibleScreens.length + visibleParticipants.length === 1;
  }

  isPipStream(peerId: string): boolean {
    return this.pipStreamId === peerId;
  }

  private syncPipStateFromDocument(): void {
    try {
      const pipEl = (document as any)?.pictureInPictureElement as HTMLVideoElement | null | undefined;
      const peerId = String(pipEl?.getAttribute?.('data-peer-id') ?? '').trim();
      const next = peerId || undefined;

      // Avoid triggering layout churn if nothing changed.
      if (next === this.pipStreamId) return;

      this.pipStreamId = next;

      // If focus is currently PiP, clear it.
      if (this.focusedStreamId && this.focusedStreamId === this.pipStreamId) {
        this.focusedStreamId = undefined;
      }

      // When PiP becomes active, automatically pick a replacement main tile.
      // Prefer remote screen shares ("not current participant"), otherwise first remote camera.
      if (this.pipStreamId) {
        this.autoSelectMainWhenPipActive();
      }

      this.recomputeLayoutStreams();
      this.scheduleQualityPolicyUpdate();
      this.cdr.markForCheck();
    } catch {
      // best-effort
    }
  }

  private autoSelectMainWhenPipActive(): void {
    // Respect explicit user intent.
    if (this.pinnedParticipants.size > 0) return;

    // If the user already focused something that isn't PiP, keep it.
    if (this.focusedStreamId && this.focusedStreamId !== this.pipStreamId) return;

    const isPipPeer = (peerId: string) => this.isPipStream(peerId);

    // Prefer a remote screen share if available.
    const remoteScreen = (this.screenShares ?? []).find(s => !s.isLocal && !isPipPeer(s.peerId));
    if (remoteScreen) {
      this.focusedStreamId = remoteScreen.peerId;
      return;
    }

    // Otherwise prefer the first remote participant camera.
    const remoteParticipant = (this.participantStreams ?? []).find(s => !s.isLocal && !isPipPeer(s.peerId));
    if (remoteParticipant) {
      this.focusedStreamId = remoteParticipant.peerId;
      return;
    }

    // Fallback: any non-PiP participant.
    const anyParticipant = (this.participantStreams ?? []).find(s => !isPipPeer(s.peerId));
    this.focusedStreamId = anyParticipant?.peerId;
  }

  get effectiveLayoutMode(): 'grid' | 'ribbon' | 'overlay' | 'present' {
    // Auto-switch to a Meet-like "presentation" mode when any screen share exists.
    // If the screen share is in Picture-in-Picture, only force "present" if there is
    // another non-PiP screen share we can show in-app.
    const hasNonPipScreen = (this.screenShares ?? []).some(s => !this.isPipStream(s.peerId));
    if (this.hasScreenShare() && (!this.pipScreenShareActive || hasNonPipScreen)) return 'present';

    // If the user pinned someone, always show a main stage + filmstrip.
    // This makes "pin" behave like Google Meet (pinned tile becomes the main view).
    if (this.pinnedParticipants.size > 0) {
      return this.layoutMode === 'overlay' ? 'overlay' : 'ribbon';
    }

    // For exactly 2 participants (you + one remote) and no screen share,
    // default to a 2-up layout (grid) instead of stage+filmstrip.
    if ((this.participantStreams?.length ?? 0) === 2) {
      return 'grid';
    }

    return this.layoutMode;
  }

  onEnterPictureInPicture(peerId: string) {
    this.pipStreamId = peerId;
    // Some browsers update document.pictureInPictureElement slightly later.
    // Sync + recompute ensures we immediately replace the placeholder.
    queueMicrotask(() => this.syncPipStateFromDocument());
    this.autoSelectMainWhenPipActive();
    this.recomputeLayoutStreams();
    this.scheduleQualityPolicyUpdate();
    this.cdr.markForCheck();
  }

  onLeavePictureInPicture(peerId: string) {
    if (this.pipStreamId === peerId) {
      this.pipStreamId = undefined;
    }
    queueMicrotask(() => this.syncPipStateFromDocument());
    this.recomputeLayoutStreams();
    this.scheduleQualityPolicyUpdate();
    this.cdr.markForCheck();
  }

  private captureHiddenTabLayoutState(): void {
    this.hiddenTabLayoutState = {
      isMinimized: this.isMinimized,
      layoutMode: this.layoutMode,
      screenShareMode: this.screenShareMode,
      focusedStreamId: this.focusedStreamId,
      pinnedParticipants: [...this.pinnedParticipants.values()],
    };
  }

  private restoreHiddenTabLayoutState(): void {
    const state = this.hiddenTabLayoutState;
    this.hiddenTabLayoutState = undefined;
    if (!state) return;

    this.isMinimized = state.isMinimized;
    this.layoutMode = state.layoutMode;
    this.screenShareMode = state.screenShareMode;
    this.focusedStreamId = state.focusedStreamId;
    this.pinnedParticipants = new Set(state.pinnedParticipants);
    this.recomputeLayoutStreams();
    this.scheduleQualityPolicyUpdate();
  }

  private pickBackgroundPipPeerId(): string | undefined {
    const currentMain = this.mainStream;
    if (currentMain && !currentMain.isLocal) {
      return currentMain.peerId;
    }

    const remoteScreen = (this.screenShares ?? []).find((stream) => !stream.isLocal);
    if (remoteScreen) {
      return remoteScreen.peerId;
    }

    const remoteParticipant = (this.participantStreams ?? []).find((stream) => !stream.isLocal);
    if (remoteParticipant) {
      return remoteParticipant.peerId;
    }

    return currentMain?.peerId ?? this.participantStreams[0]?.peerId;
  }

  private findVideoElementByPeerId(peerId: string): HTMLVideoElement | undefined {
    try {
      const host = this.elementRef?.nativeElement as HTMLElement | undefined;
      if (!host || !peerId) return undefined;

      const videos = Array.from(host.querySelectorAll('video[data-peer-id]')) as HTMLVideoElement[];
      return videos.find((video) => String(video.getAttribute('data-peer-id') ?? '').trim() === peerId);
    } catch {
      return undefined;
    }
  }

  private async requestPictureInPictureForPeer(peerId: string): Promise<boolean> {
    try {
      const doc = document as any;
      if (!doc?.pictureInPictureEnabled) return false;
      if (doc.pictureInPictureElement) return false;

      const video = this.findVideoElementByPeerId(peerId);
      if (!video || typeof (video as any).requestPictureInPicture !== 'function') return false;

      try { await video.play(); } catch { }
      await (video as any).requestPictureInPicture();
      return true;
    } catch {
      return false;
    }
  }

  private setFloatingMiniPlayerMessage(message: string, timeoutMs: number = 3500): void {
    this.floatingMiniPlayerMessage = message;
    if (this.floatingMiniPlayerMessageTimer) {
      clearTimeout(this.floatingMiniPlayerMessageTimer);
      this.floatingMiniPlayerMessageTimer = undefined;
    }

    if (message) {
      this.floatingMiniPlayerMessageTimer = window.setTimeout(() => {
        this.floatingMiniPlayerMessage = '';
        this.floatingMiniPlayerMessageTimer = undefined;
        this.cdr.markForCheck();
      }, timeoutMs);
    }

    this.cdr.markForCheck();
  }

  private getDocumentPictureInPictureApi(): any {
    try {
      return (window as any)?.documentPictureInPicture;
    } catch {
      return undefined;
    }
  }

  private get isFloatingOverlayActive(): boolean {
    return !!this.floatingOverlayWindow && !this.floatingOverlayWindow.closed;
  }

  private async renderFloatingOverlayWindow(peerId: string): Promise<boolean> {
    const pipWindow = this.floatingOverlayWindow;
    const stream = this.allStreams.find(item => item.peerId === peerId);
    if (!pipWindow || pipWindow.closed || !stream) {
      return false;
    }

    this.floatingOverlayPeerId = stream.peerId;

    const doc = pipWindow.document;
    doc.title = `${this.roomDisplayName} overlay`;
    doc.body.innerHTML = '';

    const style = doc.createElement('style');
    style.textContent = `
      :root { color-scheme: dark; }
      body {
        margin: 0;
        background: linear-gradient(160deg, #03141d 0%, #08212d 100%);
        color: #efffff;
        font-family: "Urbanist", "Segoe UI", sans-serif;
      }
      .overlay-shell {
        height: 100vh;
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 10px;
        padding: 12px;
        box-sizing: border-box;
      }
      .overlay-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .overlay-title {
        min-width: 0;
      }
      .overlay-title strong,
      .overlay-title span {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .overlay-title strong {
        font-size: 14px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7bf6df;
      }
      .overlay-title span {
        margin-top: 4px;
        font-size: 18px;
        font-weight: 700;
        color: #f4ffff;
      }
      .overlay-video {
        width: 100%;
        height: 100%;
        border-radius: 16px;
        object-fit: cover;
        background: #01080d;
        box-shadow: 0 18px 36px rgba(0, 0, 0, 0.28);
      }
      .overlay-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .overlay-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 999px;
        background: rgba(123, 246, 223, 0.12);
        border: 1px solid rgba(123, 246, 223, 0.18);
        color: #d8fbf6;
        font-size: 12px;
      }
      .overlay-return {
        border: none;
        border-radius: 999px;
        padding: 10px 16px;
        background: linear-gradient(135deg, #ff9f40 0%, #ff8a1f 100%);
        color: #041118;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
    `;

    const shell = doc.createElement('div');
    shell.className = 'overlay-shell';

    const header = doc.createElement('div');
    header.className = 'overlay-head';

    const title = doc.createElement('div');
    title.className = 'overlay-title';
    const eyebrow = doc.createElement('strong');
    eyebrow.textContent = 'Call overlay';
    const heading = doc.createElement('span');
    heading.textContent = this.roomDisplayName;
    title.append(eyebrow, heading);

    const returnButton = doc.createElement('button');
    returnButton.className = 'overlay-return';
    returnButton.textContent = 'Return to call';
    returnButton.addEventListener('click', () => {
      try {
        window.focus();
      } catch {
        // best-effort
      }

      const roomId = String(this.routeRoomId ?? this.room?._id ?? '').trim();
      if (roomId) {
        this.navigateToRoomView(roomId, 'video-chat');
      }

      this.closeFloatingOverlayWindow();
    });

    header.append(title, returnButton);

    const video = doc.createElement('video');
    video.className = 'overlay-video';
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream.stream;

    const meta = doc.createElement('div');
    meta.className = 'overlay-meta';

    const chip = doc.createElement('div');
    chip.className = 'overlay-chip';
    chip.textContent = `${stream.displayName || 'Participant'}${stream.isScreen ? ' • Screen share' : ' • Live video'}`;

    const note = doc.createElement('div');
    note.className = 'overlay-chip';
    note.textContent = 'Audio continues in the call tab';

    meta.append(chip, note);

    shell.append(header, video, meta);
    doc.head.innerHTML = '';
    doc.head.appendChild(style);
    doc.body.appendChild(shell);

    try { await video.play(); } catch { }

    return true;
  }

  private async openFloatingOverlayWindow(peerId: string): Promise<boolean> {
    const api = this.getDocumentPictureInPictureApi();
    if (!api?.requestWindow) {
      return false;
    }

    try {
      if (!this.floatingOverlayWindow || this.floatingOverlayWindow.closed) {
        this.floatingOverlayWindow = await api.requestWindow({
          width: 420,
          height: 320,
        });
        const overlayWindow = this.floatingOverlayWindow;
        overlayWindow?.addEventListener('pagehide', this.onFloatingOverlayWindowClosed, { once: true });
      }

      const rendered = await this.renderFloatingOverlayWindow(peerId);
      if (!rendered) {
        this.closeFloatingOverlayWindow();
      }

      this.cdr.markForCheck();
      return rendered;
    } catch {
      this.closeFloatingOverlayWindow();
      return false;
    }
  }

  private closeFloatingOverlayWindow(): void {
    const pipWindow = this.floatingOverlayWindow;
    this.floatingOverlayWindow = undefined;
    this.floatingOverlayPeerId = undefined;

    if (pipWindow && !pipWindow.closed) {
      try {
        pipWindow.close();
      } catch {
        // best-effort
      }
    }

    this.cdr.markForCheck();
  }

  private syncFloatingOverlayWindow(): void {
    if (!this.isFloatingOverlayActive) {
      return;
    }

    const nextPeerId = this.floatingOverlayPeerId && this.allStreams.some(stream => stream.peerId === this.floatingOverlayPeerId)
      ? this.floatingOverlayPeerId
      : this.pickBackgroundPipPeerId();

    if (!nextPeerId) {
      this.closeFloatingOverlayWindow();
      return;
    }

    void this.renderFloatingOverlayWindow(nextPeerId);
  }

  get canUseFloatingMiniPlayer(): boolean {
    try {
      // Only require a stream to be available. PiP API checks happen at click
      // time inside toggleFloatingMiniPlayer() which shows a user-friendly
      // message when the browser blocks PiP.
      return !!this.pickBackgroundPipPeerId();
    } catch {
      return false;
    }
  }

  get isFloatingMiniPlayerActive(): boolean {
    return this.isFloatingOverlayActive || !!this.pipStreamId;
  }

  get floatingMiniPlayerIcon(): string {
    return this.isFloatingMiniPlayerActive ? 'picture_in_picture_alt_off' : 'picture_in_picture_alt';
  }

  get floatingMiniPlayerTitle(): string {
    if (!this.canUseFloatingMiniPlayer) {
      return 'Floating mini-player unavailable until a video tile is ready';
    }

    return this.isFloatingMiniPlayerActive ? 'Close floating mini-player' : 'Open floating mini-player';
  }

  private async exitPictureInPictureIfOpen(): Promise<void> {
    try {
      const doc = document as any;
      if (doc?.pictureInPictureElement && typeof doc.exitPictureInPicture === 'function') {
        await doc.exitPictureInPicture();
      }
    } catch {
      // best-effort
    }
  }

  private async exitAutoBackgroundPictureInPicture(): Promise<void> {
    if (!this.autoBackgroundPipPeerId) return;

    try {
      const doc = document as any;
      const current = doc?.pictureInPictureElement as HTMLVideoElement | null | undefined;
      const currentPeerId = String(current?.getAttribute?.('data-peer-id') ?? '').trim();

      if (current && currentPeerId === this.autoBackgroundPipPeerId && typeof doc.exitPictureInPicture === 'function') {
        await this.exitPictureInPictureIfOpen();
      }
    } catch {
      // best-effort
    } finally {
      this.autoBackgroundPipPeerId = undefined;
    }
  }

  async toggleFloatingMiniPlayer(): Promise<void> {
    if (!this.canUseFloatingMiniPlayer) {
      this.setFloatingMiniPlayerMessage('Floating mini-player is not available yet in this browser or for the current call view.');
      return;
    }

    this.unlockPlayback();

    if (this.isFloatingMiniPlayerActive) {
      this.autoBackgroundPipPeerId = undefined;
      this.closeFloatingOverlayWindow();
      await this.exitPictureInPictureIfOpen();
      this.setFloatingMiniPlayerMessage('Floating mini-player closed.');
      queueMicrotask(() => this.syncPipStateFromDocument());
      return;
    }

    const peerId = this.pickBackgroundPipPeerId();
    if (!peerId) {
      this.setFloatingMiniPlayerMessage('No active video is available to move into the floating mini-player yet.');
      return;
    }

    const overlayOpened = await this.openFloatingOverlayWindow(peerId);
    if (overlayOpened) {
      await this.exitPictureInPictureIfOpen();
      this.autoBackgroundPipPeerId = undefined;
      this.setFloatingMiniPlayerMessage('Floating overlay enabled. Use Return to call in the overlay window to jump back.');
      return;
    }

    const entered = await this.requestPictureInPictureForPeer(peerId);
    if (!entered) {
      this.setFloatingMiniPlayerMessage('Browser blocked the floating mini-player. Click the call once and try again, or allow Picture-in-Picture in the browser.');
      return;
    }

    this.autoBackgroundPipPeerId = undefined;
    this.setFloatingMiniPlayerMessage('Floating mini-player enabled. Audio stays on the high-quality call stream.');
    queueMicrotask(() => this.syncPipStateFromDocument());
  }

  private async keepCallActiveWhileHidden(): Promise<void> {
    if (!this.activeJoinedRoomId) return;
    if (!this.hiddenTabLayoutState) {
      this.captureHiddenTabLayoutState();
    }

    this.isMinimized = true;
    this.syncVideoCallDockState();

    if (this.playbackUnlocked && this.speakersOn) {
      queueMicrotask(() => this.tryPlayAllMediaElements());
    }

    try {
      const doc = document as any;
      if (doc?.pictureInPictureElement) {
        return;
      }
    } catch {
      // best-effort
    }

    const peerId = this.pickBackgroundPipPeerId();
    if (!peerId) {
      this.setFloatingMiniPlayerMessage('Call stayed active and compacted to the dock while this tab is in the background.');
      return;
    }

    const overlayOpened = await this.openFloatingOverlayWindow(peerId);
    if (overlayOpened) {
      this.autoBackgroundPipPeerId = undefined;
      this.setFloatingMiniPlayerMessage('Call kept active in a floating window while this tab is in the background.');
      return;
    }

    const entered = await this.requestPictureInPictureForPeer(peerId);
    if (entered) {
      this.autoBackgroundPipPeerId = peerId;
      this.setFloatingMiniPlayerMessage('Call kept active in Picture-in-Picture while this tab is in the background.');
      return;
    }

    this.setFloatingMiniPlayerMessage('Call stayed active and compacted to the dock while this tab is in the background.');
  }

  private async restoreCallLayoutAfterHiddenTab(): Promise<void> {
    this.closeFloatingOverlayWindow();
    await this.exitAutoBackgroundPictureInPicture();
    this.restoreHiddenTabLayoutState();
    this.syncVideoCallDockState();

    if (this.playbackUnlocked && this.speakersOn) {
      queueMicrotask(() => this.tryPlayAllMediaElements());
    }

    this.cdr.markForCheck();
  }

  isMutedForPlayback(peerStream: PeerStream): boolean {
    // Always mute local elements (prevents local echo). Speakers toggle mutes remotes.
    if (peerStream.isLocal) return true;

    // If a peer has both a camera stream AND a screen-share stream with audio,
    // muting the screen tile prevents double-audio playback.
    if (peerStream.isScreen && this.shouldMuteScreenShareAudio(peerStream)) return true;

    // Keep remote elements muted until the user interacts with the call UI.
    return !this.playbackUnlocked || !this.speakersOn;
  }

  isVideoElementMuted(_peerStream: PeerStream): boolean {
    // Meet-style: keep ALL video elements muted (local echo protection + allow muted autoplay).
    // Audio playback is handled by dedicated <audio> elements.
    return true;
  }

  private shouldMuteScreenShareAudio(peerStream: PeerStream): boolean {
    if (!peerStream.isScreen) return false;
    const socketId = peerStream.socketId;
    if (!socketId) return false;

    const hasScreenAudio = (peerStream.stream.getAudioTracks() ?? []).length > 0;
    if (!hasScreenAudio) return false;

    const hasParticipantAudio = this.allStreams.some(s =>
      !s.isLocal && !s.isScreen && s.socketId === socketId && (s.stream.getAudioTracks() ?? []).length > 0
    );

    return hasParticipantAudio;
  }

  private scheduleQualityPolicyUpdate(): void {
    if (this.qualityPolicyTimer) {
      clearTimeout(this.qualityPolicyTimer);
      this.qualityPolicyTimer = undefined;
    }

    this.qualityPolicyTimer = setTimeout(() => {
      this.qualityPolicyTimer = undefined;
      this.applyQualityPolicyNow();
    }, 150);
  }

  private applyQualityPolicyNow(): void {
    // ── DOWNLOAD PRIORITY SCHEME (what we ask peers to send us) ──────────────────
    // Download priority mirrors upload: audio > pinned-screen > pinned-camera > others.
    //
    //  • Audio   : ALWAYS requested 'high' from every peer (voice must be intelligible).
    //  • Screen  : 'high' if the screen is pinned/focused (primary), otherwise 'low'.
    //  • Video   : 'high' for the pinned/focused participant's camera, 'low' for others.
    //
    // In a bandwidth-constrained situation the peer will degrade its camera first
    // (low priority), keep screen share at medium, and protect audio.
    //
    // ── UPLOAD PRIORITY SCHEME (what we set on our own senders) ─────────────────
    // Already declared at transceiver creation (audio=high, screen=medium, camera=low).
    // applyOutbound*Profile() reinforces the priority + bitrate caps per peer.

    const remoteSocketIds = new Set(
      this.allStreams
        .filter(s => !s.isLocal && !!s.socketId)
        .map(s => s.socketId as string)
    );

    if (remoteSocketIds.size === 0) return;

    const resolvePrimaryStream = (): PeerStream | undefined => {
      const byPeerId = (peerId?: string) => (peerId ? this.allStreams.find(s => s.peerId === peerId) : undefined);

      const focused = byPeerId(this.focusedStreamId);
      if (focused && focused.socketId && !focused.isLocal) return focused;

      if (this.pinnedParticipants.size > 0) {
        for (const pinnedId of this.pinnedParticipants.values()) {
          const pinned = byPeerId(pinnedId);
          if (pinned && pinned.socketId && !pinned.isLocal) return pinned;
        }
      }

      if (remoteSocketIds.size === 1) {
        const only = [...remoteSocketIds][0];
        const match = this.allStreams.find(s => !s.isLocal && s.socketId === only && !s.isScreen);
        if (match) return match;
      }

      if (this.mainStream && !this.mainStream.isLocal && this.mainStream.socketId) return this.mainStream;
      return undefined;
    };

    const primary = resolvePrimaryStream();
    const primarySocketId = primary?.socketId;
    const primaryIsScreen = !!primary?.isScreen;

    // Determine whether any peer is sharing a screen we're watching.
    const hasAnyScreenShare = this.screenShares.some(s => !s.isLocal);

    for (const remoteId of remoteSocketIds) {
      const isPrimary = remoteId === primarySocketId;

      // ── Upload (what WE send to this peer) ──
      const cameraVideo: 'high' | 'low' = isPrimary && !primaryIsScreen ? 'high' : 'low';
      const screenVideo: 'high' | 'low' = isPrimary && primaryIsScreen ? 'high' : 'low';
      // Audio: always high for primary; keep at low for others to save bandwidth.
      const audioUpload: 'high' | 'low' = 'high'; // We always upload good audio to everyone.

      this.rtcAdvanced.setPeerVideoProfile(remoteId, cameraVideo);
      this.rtcAdvanced.setPeerScreenVideoProfile(remoteId, screenVideo);
      this.rtcAdvanced.setPeerAudioProfile(remoteId, audioUpload);

      // ── Download requests (what we ask this peer to send US) ──
      // Audio: always high — voice must be prioritised regardless of congestion.
      // Screen: high only if this peer is the focused/pinned screen sharer.
      // Camera: high for the primary/pinned participant, low for background participants.
      const isPeerSharingScreen = hasAnyScreenShare && this.screenShares.some(
        s => !s.isLocal && s.socketId === remoteId
      );
      const downloadCameraVideo: 'high' | 'low' = isPrimary && !primaryIsScreen ? 'high' : 'low';
      const downloadScreenVideo: 'high' | 'low' = isPrimary && primaryIsScreen && isPeerSharingScreen ? 'high' : 'low';
      const downloadAudio: 'high' | 'low' = 'high'; // always

      this.rtcAdvanced.requestPeerMediaProfile(remoteId, {
        cameraVideo: downloadCameraVideo,
        screenVideo: downloadScreenVideo,
        audio: downloadAudio,
      });
    }
  }

  unlockPlayback() {
    if (this.playbackUnlocked) return;
    this.playbackUnlocked = true;
    this.cdr.markForCheck();

    // iOS/Safari often requires an explicit play() triggered by a user gesture.
    queueMicrotask(() => this.tryPlayAllMediaElements());
  }

  private tryPlayAllMediaElements(): void {
    try {
      const host = this.elementRef?.nativeElement as HTMLElement | undefined;
      if (!host) return;

      const elements = Array.from(host.querySelectorAll('video, audio')) as HTMLMediaElement[];
      for (const el of elements) {
        if (!el.paused) continue;
        el.play?.().catch(() => undefined);
      }
    } catch {
      // best-effort
    }
  }

  private clearAuthSessionStorage(): void {
    try {
      sessionStorage.removeItem(`${environment.storage.currentUser}`);
      const userId = sessionStorage.getItem(`${environment.storage.userId}`);
      if (userId) {
        sessionStorage.removeItem(`${environment.storage.prefixToken}${userId}`);
        sessionStorage.removeItem(`${environment.storage.prefixToken}${userId}_refresh`);
      }
      sessionStorage.removeItem(`${environment.storage.userId}`);
      sessionStorage.removeItem(`${environment.storage.token}`);
      sessionStorage.removeItem(`${environment.storage.refreshToken}`);
    } catch {
      // best-effort
    }
  }

  switchAccountInPublicRoom(): void {
    const tokenFromUrl = (this.route.snapshot.queryParamMap.get('token') ?? '').trim();
    const tokenFromRoom = String((this.room as any)?.joinToken ?? '').trim();
    const token = tokenFromUrl || tokenFromRoom;

    if (!token) {
      alert('This room does not appear to be public (no join token found).');
      return;
    }

    const confirmed = confirm('Switch account for this public room?\n\nThis will disconnect the call, clear your current login from this tab, and reload the room join link.');
    if (!confirmed) return;

    try {
      this.stopCurrentCallSession({ preserveSubscriptions: true });
    } catch {
      // ignore
    }

    this.clearAuthSessionStorage();

    const basePath = this.router.url.split('?')[0]
      || `/recruitment/communication/room/${encodeURIComponent(String(this.routeRoomId ?? this.room?._id ?? ''))}/video-chat`;
    window.location.href = `${window.location.origin}${basePath}?token=${encodeURIComponent(token)}`;
  }

  private buildJoinLink(): string {
    const token = String((this.room as any)?.joinToken ?? '').trim();
    const roomId = String(this.routeRoomId ?? this.room?._id ?? '').trim();
    if (!token || !roomId) return '';

    // Keep current route but force token param.
    const basePath = this.router.url.split('?')[0] || `/recruitment/communication/room/${encodeURIComponent(roomId)}/video-chat`;
    return `${window.location.origin}${basePath}?token=${encodeURIComponent(token)}`;
  }

  async copyJoinLink() {
    const link = this.buildJoinLink();
    if (!link) {
      alert('Join link is not available yet.');
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      alert('Join link copied to clipboard');
    } catch {
      // Fallback for browsers without clipboard permissions.
      prompt('Copy join link:', link);
    }
  }

  isAudioOnly(stream: MediaStream): boolean {
    const videoTracks = stream.getVideoTracks();
    // No video tracks or all video tracks are effectively inactive.
    // For remote tracks, `enabled` is usually true even when sender stopped.
    return (
      videoTracks.length === 0
      || videoTracks.every(track => !track.enabled || track.readyState !== 'live' || (track as any).muted === true)
    );
  }

  hasAudio(stream: MediaStream): boolean {
    return (stream?.getAudioTracks?.() ?? []).length > 0;
  }

  getParticipantName(peerStream: PeerStream): string {
    if (peerStream.isLocal) return 'You';
    if (peerStream.isScreen) return peerStream.displayName || 'Screen Share';

    if (peerStream.displayName) return peerStream.displayName;

    // Friendly fallback for guest/token joins where we don't know a real name.
    // Prefer the stable participant key baked into peerId (remote-<userId>) over socket ids.
    const raw = String(peerStream.peerId || '').replace(/^remote-screen-/, '').replace(/^remote-/, '');
    const stable = raw || String(peerStream.socketId || '');
    return `Guest ${stable.substring(0, 20)}`;
  }

  getParticipantAvatarLabel(peerStream: PeerStream): string {
    const compactName = this.getParticipantName(peerStream).replace(/\s+/g, ' ').trim();
    if (!compactName) {
      return '??';
    }

    const parts = compactName.split(' ').filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }

  getRoomPresenceDisplayName(participant: RoomPresenceParticipant): string {
    if (participant.isSelf) {
      return 'You';
    }

    const displayName = String(participant.displayName ?? '').trim();
    if (displayName) {
      return displayName;
    }

    const email = String(participant.email ?? '').trim();
    if (email) {
      return email;
    }

    return 'Guest participant';
  }

  getRoomPresenceStatusLabel(participant: RoomPresenceParticipant): string {
    const parts: string[] = [];

    if (participant.inRoom) {
      parts.push(participant.isSelf ? 'In this room' : 'Connected to room');
    } else if (participant.online) {
      parts.push('Online');
    } else {
      parts.push('Offline');
    }

    if (participant.inRoom && !participant.audioEnabled) {
      parts.push('Mic off');
    }

    if (participant.inRoom && !participant.videoEnabled) {
      parts.push('Camera off');
    }

    return parts.join(' • ');
  }

  getRoomPresenceIcon(participant: RoomPresenceParticipant): string {
    if (participant.inRoom) {
      return 'radio_button_checked';
    }

    if (participant.online) {
      return 'schedule';
    }

    return 'person_off';
  }

  getRoomPresenceAvatarLabel(participant: RoomPresenceParticipant): string {
    const name = this.getRoomPresenceDisplayName(participant);
    const compact = name.replace(/\s+/g, ' ').trim();
    return compact.slice(0, 2).toUpperCase();
  }

  isRoomPresenceMuted(participant: RoomPresenceParticipant): boolean {
    return participant.inRoom && !participant.audioEnabled;
  }

  focusStream(peerId: string) {
    // In presentation mode, allow quick switching without pinning.
    this.focusedStreamId = peerId;
    this.recomputeLayoutStreams();
    this.scheduleQualityPolicyUpdate();
    this.cdr.markForCheck();
  }

  get visibleParticipantCount(): number {
    return Math.min(this.participantCount, this.maxVisibleParticipants);
  }

  togglePinParticipant(peerId: string) {
    if (this.pinnedParticipants.has(peerId)) {
      this.pinnedParticipants.delete(peerId);
      if (this.focusedStreamId === peerId) {
        this.focusedStreamId = undefined;
      }
    } else {
      this.pinnedParticipants.add(peerId);
      this.focusedStreamId = peerId;
    }
    this.recomputeLayoutStreams();
    this.scheduleQualityPolicyUpdate();
    this.cdr.markForCheck();
  }

  isPinned(peerId: string): boolean {
    return this.pinnedParticipants.has(peerId);
  }

  cycleScreenShareMode() {
    const modes: Array<'separate' | 'overlay' | 'fullscreen'> = ['separate', 'overlay', 'fullscreen'];
    const currentIndex = modes.indexOf(this.screenShareMode);
    this.screenShareMode = modes[(currentIndex + 1) % modes.length];
    this.cdr.markForCheck();
  }

  get screenShareModeIcon(): string {
    switch (this.screenShareMode) {
      case 'separate': return 'view_sidebar';
      case 'overlay': return 'picture_in_picture_alt';
      case 'fullscreen': return 'fullscreen';
    }
  }

  ngOnInit() {
    this.videoCallDock.clear();
    this.routeRoomId = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.handleWindowResize();
    this.initializeTextChatSubscriptions();

    this.initRtcDebugFlag();

    const identity = this.resolveCurrentUserIdentity();
    this.currentUserEmail = identity.email;
    this.currentUserDisplayName = identity.displayName;
    // Prefer a stable userId from token/session for signaling de-duplication.
    // Fallback remains the storage userId already set on the component.
    if (identity.userId) {
      this.userId = identity.userId;
    }
    if (identity.profileId) {
      this.profileId = identity.profileId;
    }
    console.log('Current user email', this.currentUserEmail);

    if (!this.dockEndCallSub) {
      this.dockEndCallSub = this.videoCallDock.endCallRequests$.subscribe(() => {
        if (!this.activeJoinedRoomId) {
          return;
        }

        void this.endCall();
      });
    }

    this.routeParamSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const previousRoomId = this.routeRoomId;
      this.routeRoomId = id ?? undefined;

      if (id && this.rtcInitCompleted && previousRoomId && previousRoomId !== id) {
        this.roomSwitchSequence += 1;
        this.stopCurrentCallSession({ preserveSubscriptions: true });
      }

      if (id) {
        // Always attempt to load the room.
        // Token-based join should work even if we fail to derive currentUserEmail.
        this.loadRoom(id);
      }
      this.cdr.markForCheck();
    });

    // Listen for visibility changes (tab switching)
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    // Some browsers/UI entry points into PiP don't reliably fire the element-level
    // enter/leave events. Keep PiP state in sync from the document as well.
    try {
      document.addEventListener('enterpictureinpicture', this.onDocumentPictureInPictureChange as any, true);
      document.addEventListener('leavepictureinpicture', this.onDocumentPictureInPictureChange as any, true);
      this.syncPipStateFromDocument();
    } catch {
      // best-effort
    }

    // Last-resort PiP sync: browsers don't consistently surface a reliable event for
    // changes to document.pictureInPictureElement. Poll lightly and only react to diffs.
    try {
      if ((document as any)?.pictureInPictureEnabled) {
        this.pipSyncTimer = window.setInterval(() => this.syncPipStateFromDocument(), 300);
      }
    } catch {
      // best-effort
    }

    // Ensure we stop camera/mic even if the tab/window is closed without clicking "End call".
    // pagehide also fires on mobile backgrounding / bfcache.
    window.addEventListener('pagehide', this.onPageHide);
    window.addEventListener('beforeunload', this.onBeforeUnload);
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.onKeyboardShortcut);

    if (this.shouldCaptureClientErrors()) {
      this.installClientErrorCapture();
    }
  }
  cycleLayout() {
    this.layoutMode = this.layoutMode === 'grid'
      ? 'ribbon'
      : this.layoutMode === 'ribbon'
        ? 'overlay'
        : 'grid';
    this.cdr.markForCheck();
  }

  toggleSpeakers() {
    this.speakersOn = !this.speakersOn;
    this.syncVideoCallDockState();
    this.cdr.markForCheck();

    // If playback was already unlocked, toggling speakers on should resume audio.
    if (this.playbackUnlocked && this.speakersOn) {
      queueMicrotask(() => this.tryPlayAllMediaElements());
    }
  }

  toggleDeviceSwitcher() {
    this.showDeviceSwitcher = !this.showDeviceSwitcher;
    this.cdr.markForCheck();
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    this.cdr.markForCheck();
  }

  async switchAudioInputDevice(deviceId: string): Promise<void> {
    this.selectedAudioInputDeviceId = String(deviceId || '').trim();
    this.rtcAdvanced.setPreferredInputDevices({
      audioInputDeviceId: this.selectedAudioInputDeviceId || undefined,
      videoInputDeviceId: this.selectedVideoInputDeviceId || undefined,
    });
    if (this.activeJoinedRoomId) {
      try {
        const newStream = await this.rtcAdvanced.switchInputDeviceLive();
        this.syncLocalStreamState(newStream ?? null);
      } catch (error) {
        console.error('Failed to switch audio device:', error);
      }
    }
    this.cdr.markForCheck();
  }

  async switchVideoInputDevice(deviceId: string): Promise<void> {
    this.selectedVideoInputDeviceId = String(deviceId || '').trim();
    this.rtcAdvanced.setPreferredInputDevices({
      audioInputDeviceId: this.selectedAudioInputDeviceId || undefined,
      videoInputDeviceId: this.selectedVideoInputDeviceId || undefined,
    });
    if (this.activeJoinedRoomId) {
      try {
        const newStream = await this.rtcAdvanced.switchInputDeviceLive();
        this.syncLocalStreamState(newStream ?? null);
        if (this.localVideoRef?.nativeElement && this.localCameraStream) {
          this.localVideoRef.nativeElement.srcObject = this.localCameraStream;
          try { await this.localVideoRef.nativeElement.play(); } catch { }
        }
      } catch (error) {
        console.error('Failed to switch video device:', error);
      }
    }
    this.cdr.markForCheck();
  }

  private handleKeyboardShortcut(event: KeyboardEvent): void {
    // Don't intercept when user is typing in an input/textarea
    const target = event.target as HTMLElement;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT' || target?.isContentEditable) {
      return;
    }

    // Only handle shortcuts when in an active call
    if (!this.activeJoinedRoomId) {
      return;
    }

    const key = event.key.toLowerCase();

    switch (key) {
      case 'm':
        event.preventDefault();
        void this.toggleAudio();
        break;
      case 'v':
        event.preventDefault();
        void this.toggleVideo();
        break;
      case 's':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          void this.toggleScreenShare();
        }
        break;
      case 'c':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.toggleTextChat();
        }
        break;
      case 'l':
        event.preventDefault();
        this.cycleLayout();
        break;
      case 'd':
        event.preventDefault();
        this.toggleDeviceSwitcher();
        break;
      case 'p':
        event.preventDefault();
        this.toggleSidebar();
        break;
      case 'escape':
        if (this.showDeviceSwitcher) {
          this.showDeviceSwitcher = false;
          this.cdr.markForCheck();
        }
        break;
    }
  }

  toggleTextChat() {
    if (this.isTextChatVisible) {
      this.closeTextChat();
      return;
    }

    this.restoreTextChat(true);
  }

  closeTextChat() {
    if (!this.isTextChatOpen && !(this.shouldAutoDockTextChat && !this.textChatDismissedWhileSolo)) {
      return;
    }

    this.isTextChatOpen = false;
    this.isTextChatMinimized = false;
    if (this.shouldAutoDockTextChat) {
      this.textChatDismissedWhileSolo = true;
    }
    this.cdr.markForCheck();
  }

  minimizeTextChat() {
    if (!this.isTextChatOpen) {
      return;
    }

    if (this.isMobileViewport) {
      this.closeTextChat();
      return;
    }

    this.isTextChatMinimized = true;
    this.cdr.markForCheck();
  }

  restoreTextChat(focusComposer: boolean = true) {
    this.isTextChatOpen = true;
    this.isTextChatMinimized = false;
    this.textChatDismissedWhileSolo = false;
    this.textChatUnreadCount = 0;
    this.scheduleTextChatScrollToBottom(focusComposer);
    this.cdr.markForCheck();
  }

  onInCallTextChatScroll() {
    const container = this.inCallChatScrollRef?.nativeElement;
    if (!container || this.isTextChatHistoryLoading || this.isTextChatLoadingOlder || !this.canLoadOlderTextChatMessages) {
      return;
    }

    if (container.scrollTop > 10) {
      return;
    }

    this.loadOlderTextChatMessages();
  }

  onTextChatDraftChange() {
    this.chatService.setTyping(!!this.textChatDraft.trim());
  }

  onTextChatComposerKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void this.sendTextChatMessage();
  }

  async sendTextChatMessage() {
    const text = this.textChatDraft.trim();
    if (!text || !this.textChatConnected) {
      return;
    }

    const senderLabel = this.currentUserDisplayName || this.currentUserEmail || 'You';
    const meta = {
      senderName: senderLabel,
      senderUserId: this.userId || undefined,
      roomType: 'video-call',
    };
    void this.persistInCallTextChatMessage(text, meta);

    const payload = await this.chatService.sendMessage(text, meta);

    if (payload) {
      this.appendTextChatMessage(payload, true);
    }

    this.textChatDraft = '';
    this.chatService.setTyping(false);
    this.scheduleTextChatScrollToBottom(true);
    this.cdr.markForCheck();
  }

  formatTextChatTime(ts: number): string {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  get layoutIcon(): string {
    switch (this.layoutMode) {
      case 'grid':
        return 'grid_view';
      case 'ribbon':
        return 'view_carousel';
      case 'overlay':
        return 'picture_in_picture_alt';
      default:
        return 'grid_view';
    }
  }
  private toSafeText(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  private buildFullName(first: unknown, last: unknown): string {
    const f = this.toSafeText(first);
    const l = this.toSafeText(last);
    return `${f} ${l}`.trim();
  }

  private pickDisplayName(candidates: unknown[]): string {
    for (const candidate of candidates) {
      const text = this.toSafeText(candidate);
      if (text) return text;
    }
    return '';
  }

  private getOrCreateGuestRtcUserId(): string {
    const key = 'rtc.guestUserId';
    try {
      const existing = String(sessionStorage.getItem(key) ?? '').trim();
      if (existing) return existing;

      const generated = (globalThis as any)?.crypto?.randomUUID?.()
        ?? `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem(key, String(generated));
      return String(generated);
    } catch {
      return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  }

  private getOrCreateRtcClientId(): string {
    // MUST use sessionStorage (per-tab) to match the RTC service implementation.
    // localStorage would be shared across profile tabs at the same origin, producing
    // the same synthesized profileId for two different profiles → one gets kicked.
    const key = 'rtc.clientId';
    try {
      const existing = String(sessionStorage.getItem(key) ?? '').trim();
      if (existing) return existing;

      const generated = (globalThis as any)?.crypto?.randomUUID?.()
        ?? `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem(key, String(generated));
      return String(generated);
    } catch {
      return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  }

  private resolveCurrentUserIdentity(): { email: string; displayName: string; userId: string; profileId: string } {
    // Try multiple token slots because different app areas store them differently.
    const idToken = String(
      sessionStorage.getItem(`${environment.storage.prefixToken}${this.userId}`)
      || sessionStorage.getItem(`${environment.storage.token}`)
      || '',
    ).trim();

    const decodedToken = idToken ? this.authService.decodeJWTToken(idToken) : undefined;
    const tokenUser = decodedToken?.user ?? {};

    let sessionUser: any = {};
    try {
      const raw = sessionStorage.getItem(`${environment.storage.currentUser}`);
      sessionUser = raw ? JSON.parse(raw) : {};
    } catch {
      sessionUser = {};
    }

    // Guest/token join may not have an authenticated profile. Allow the joining user
    // to provide a human name via query params (e.g. `?name=John%20Doe`).
    const queryDisplayName = this.pickDisplayName([
      this.route?.snapshot?.queryParamMap?.get('name'),
      this.route?.snapshot?.queryParamMap?.get('displayName'),
    ]);

    const email = this.toSafeText(tokenUser?.email || sessionUser?.email);

    const resolvedUserId = this.pickDisplayName([
      tokenUser?._id,
      tokenUser?.id,
      sessionUser?._id,
      sessionUser?.id,
      this.userId,
    ]);

    // In some parts of the platform a single account (userId) can have multiple profiles.
    // Prefer a stable profileId if it exists so different profiles can join the same RTC room.
    const resolvedProfileId = this.pickDisplayName([
      (decodedToken as any)?.profileId,
      tokenUser?.profileId,
      tokenUser?.currentProfileId,
      tokenUser?.activeProfileId,
      tokenUser?.profile?._id,
      tokenUser?.profile?.id,
      tokenUser?.currentProfile?._id,
      tokenUser?.currentProfile?.id,
      sessionUser?.profileId,
      sessionUser?.currentProfileId,
      sessionUser?.activeProfileId,
      sessionUser?.profile?._id,
      sessionUser?.profile?.id,
      sessionUser?.currentProfile?._id,
      sessionUser?.currentProfile?.id,
      this.route?.snapshot?.queryParamMap?.get('profileId'),
    ]);

    const displayName = this.pickDisplayName([
      tokenUser?.pseudonym,
      sessionUser?.pseudonym,
      tokenUser?.nickname,
      sessionUser?.nickname,
      tokenUser?.displayName,
      sessionUser?.displayName,
      tokenUser?.fullName,
      sessionUser?.fullName,
      this.buildFullName(tokenUser?.firstname ?? tokenUser?.firstName, tokenUser?.lastname ?? tokenUser?.lastName),
      this.buildFullName(sessionUser?.firstname ?? sessionUser?.firstName, sessionUser?.lastname ?? sessionUser?.lastName),
      tokenUser?.name,
      sessionUser?.name,
      tokenUser?.username ?? tokenUser?.userName ?? tokenUser?.login,
      sessionUser?.username ?? sessionUser?.userName ?? sessionUser?.login,
      queryDisplayName,
      email,
    ]);

    // If we are in a guest/token-join flow, there may be no platform user id.
    // Use a stable per-tab guest id so backend can kick the old socket on reload.
    const finalUserId = resolvedUserId || this.getOrCreateGuestRtcUserId();

    const roleKey = this.pickDisplayName([
      tokenUser?.role?.[0],
      sessionUser?.role?.[0],
      tokenUser?.role,
      sessionUser?.role,
    ]);

    const nameKey = this.pickDisplayName([
      tokenUser?.pseudonym,
      sessionUser?.pseudonym,
      tokenUser?.nickname,
      sessionUser?.nickname,
      tokenUser?.username,
      sessionUser?.username,
    ]);

    // If the platform doesn't provide a distinct profileId, synthesize one.
    // This enables multiple platform profiles (or multiple browser profiles) to join the same room
    // even when userId is the same.
    const clientId = this.getOrCreateRtcClientId();
    const synthesizedProfileId = roleKey
      ? `${finalUserId}:role:${roleKey}`
      : (nameKey ? `${finalUserId}:name:${nameKey}` : `${finalUserId}:client:${clientId}`);

    const finalProfileId = resolvedProfileId || synthesizedProfileId;

    return { email, displayName, userId: finalUserId, profileId: finalProfileId };
  }

  private isSameParticipantIdentity(remote: RemotePeerStream): boolean {
    const localUid = String(this.userId ?? '').trim();
    const localPid = String(this.profileId ?? '').trim();
    const localCid = String(this.getOrCreateRtcClientId() ?? '').trim();
    const remoteUid = String(remote?.userId ?? '').trim();
    const remotePid = String(remote?.profileId ?? '').trim();
    const remoteCid = String(remote?.clientId ?? '').trim();

    if (localCid && remoteCid) {
      return localCid === remoteCid;
    }

    if (localPid && remotePid) {
      return localPid === remotePid;
    }

    if (!localPid && !remotePid && localUid && remoteUid) {
      return localUid === remoteUid;
    }

    return false;
  }

  private rebuildAllStreams(remoteStreams: RemotePeerStream[]) {
    const streams: PeerStream[] = [];

    // ── Defense-in-depth: filter self from remote streams ──
    // Even if the service's isSelfLoopback didn't catch it, prevent showing our own
    // video feed as a remote tile.
    // Step 1: Remove obvious self-loopbacks
    let filteredRemote = (remoteStreams ?? []).filter(remote => {
      // Profile-first identity match to avoid blocking same-account different-profile participants.
      if (this.isSameParticipantIdentity(remote)) {
        console.warn('[RTC🔍 COMPONENT] rebuildAllStreams: dropping self-remote by participant identity', {
          peerId: remote.peerId,
          remoteUserId: remote.userId || '(none)',
          remoteProfileId: remote.profileId || '(none)',
          localUserId: this.userId || '(none)',
          localProfileId: this.profileId || '(none)',
        });
        return false;
      }
      // Match by local camera track IDs
      if (this.localCameraStream) {
        const localTrackIds = new Set(this.localCameraStream.getTracks().map(t => t.id));
        const hasMatchingTrack = remote.stream?.getTracks()?.some(t => localTrackIds.has(t.id));
        if (hasMatchingTrack) {
          console.warn('[RTC🔍 COMPONENT] rebuildAllStreams: dropping self-remote by track ID match', remote.peerId);
          return false;
        }
      }
      return true;
    });

    // Step 2: Collapse duplicate tiles for same displayName and stream characteristics
    // This is needed when backend doesn't provide userId/profileId reliably.
    const seen = new Map<string, RemotePeerStream>();
    filteredRemote = filteredRemote.filter(remote => {
      // Only collapse if userId/profileId are missing
      if (!remote.userId && !remote.profileId && remote.displayName) {
        // Build a fingerprint: displayName + track count + device labels
        const videoTracks = remote.stream.getVideoTracks();
        const audioTracks = remote.stream.getAudioTracks();
        const fingerprint = [
          remote.displayName,
          videoTracks.length,
          audioTracks.length,
          videoTracks.map(t => t.label).join(','),
          audioTracks.map(t => t.label).join(','),
        ].join('|');
        if (seen.has(fingerprint)) {
          console.warn('[RTC🔍 COMPONENT] rebuildAllStreams: collapsing duplicate tile by displayName/stream fingerprint', remote.peerId, fingerprint);
          return false;
        }
        seen.set(fingerprint, remote);
      }
      return true;
    });

    // ── Final kill-switch: drop any remote stream with the same clientId as local ──
    // This should never happen if backend dedupe and frontend filters work, but as a last resort.
    const beforeKillSwitch = filteredRemote.length;
    filteredRemote = filteredRemote.filter(remote => {
      const localCid = this.getOrCreateRtcClientId();
      if (remote.clientId && remote.clientId === localCid) {
        console.warn('[RTC🔍 COMPONENT] 🚫 Final kill-switch: dropping remote with same clientId as local', {
          remotePeerId: remote.peerId,
          remoteClientId: remote.clientId,
          localClientId: localCid,
        });
        return false;
      }
      return true;
    });
    if (beforeKillSwitch !== filteredRemote.length) {
      console.warn('[RTC🔍 COMPONENT] Final kill-switch removed duplicates:', { before: beforeKillSwitch, after: filteredRemote.length });
    }

    console.log('[RTC🔍 COMPONENT] rebuildAllStreams', {
      rawRemoteCount: (remoteStreams ?? []).length,
      filteredRemoteCount: filteredRemote.length,
      droppedSelf: (remoteStreams ?? []).length - beforeKillSwitch,
      droppedKillSwitch: beforeKillSwitch - filteredRemote.length,
    });

    // Always include local camera tile (muted) so the user sees themselves,
    // and so multi-participant layouts remain stable.
    if (this.localCameraStream) {
      streams.push({
        peerId: 'local-camera',
        stream: this.localCameraStream,
        isScreen: false,
        isLocal: true,
        displayName: 'You',
        isMuted: !this.audioOn,
      });
    }

    // Add local screen tile if sharing (helps user confirm sharing is active).
    if (this.sharingScreen && this.localScreenRef?.nativeElement?.srcObject) {
      streams.push({
        peerId: 'local-screen',
        stream: this.localScreenRef.nativeElement.srcObject as MediaStream,
        isScreen: true,
        isLocal: true,
        displayName: 'Your Screen'
      });
    }
    // Add remote streams (RTCAdvancedService already tags screen shares)
    // IMPORTANT: UI must show exactly one camera tile per participant,
    // plus (optionally) one screen-share tile per participant.
    // RemotePeerStream.streamId can change across renegotiations; using it
    // as UI identity causes duplicate tiles and unstable pin/focus behavior.
    const pickBest = (items: RemotePeerStream[]): RemotePeerStream | undefined => {
      if (!items?.length) return undefined;
      const withVideo = items.find(s => (s.stream?.getVideoTracks?.() ?? []).length > 0);
      return withVideo ?? items[0];
    };

    const buildMediaSignature = (remote: RemotePeerStream): string => {
      const videoTracks = remote?.stream?.getVideoTracks?.() ?? [];
      const audioTracks = remote?.stream?.getAudioTracks?.() ?? [];
      const videoLabels = videoTracks.map(t => String(t?.label ?? '').trim()).filter(Boolean).sort().join(',');
      const audioLabels = audioTracks.map(t => String(t?.label ?? '').trim()).filter(Boolean).sort().join(',');
      return `${videoTracks.length}:${audioTracks.length}:${videoLabels}:${audioLabels}`;
    };

    const buildParticipantKey = (remote: RemotePeerStream): string => {
      const profileId = String(remote?.profileId ?? '').trim();
      if (profileId) return `profile:${profileId}`;

      const userId = String(remote?.userId ?? '').trim();
      if (userId) return `user:${userId}`;

      const clientId = String((remote as any)?.clientId ?? '').trim();
      if (clientId) return `client:${clientId}`;

      const socketId = String(remote?.peerId ?? '').trim();
      if (socketId) return `socket:${socketId}`;

      const displayName = String(remote?.displayName ?? '').trim().toLowerCase();
      if (displayName) return `name:${displayName}`;

      const mediaSignature = buildMediaSignature(remote);
      if (mediaSignature !== '0:0::') return `media:${mediaSignature}`;

      return '';
    };

    const byParticipant = new Map<string, { camera: RemotePeerStream[]; screen: RemotePeerStream[] }>();
    for (const remote of filteredRemote) {
      const participantKey = buildParticipantKey(remote);
      if (!participantKey) continue;
      const bucket = byParticipant.get(participantKey) ?? { camera: [], screen: [] };
      if (remote.isScreen) bucket.screen.push(remote);
      else bucket.camera.push(remote);
      byParticipant.set(participantKey, bucket);
    }

    for (const [participantKey, bucket] of byParticipant.entries()) {
      const camera = pickBest(bucket.camera);
      if (camera) {
        const peer: PeerStream = {
          peerId: `remote-${participantKey}`,
          stream: camera.stream,
          isScreen: false,
          isLocal: false,
          // Keep the real socket id for signaling/QoS control.
          socketId: camera.peerId,
          displayName: camera.displayName || undefined,
          isMuted: !camera.stream.getAudioTracks().some(t => t.enabled),
        };
        streams.push(peer);
      }

      const screen = pickBest(bucket.screen);
      if (screen) {
        const peer: PeerStream = {
          peerId: `remote-screen-${participantKey}`,
          stream: screen.stream,
          isScreen: true,
          isLocal: false,
          socketId: screen.peerId,
          // Reuse participant name for screen tiles so the UI stays clear.
          displayName: screen.displayName || 'Screen Share',
          isMuted: !screen.stream.getAudioTracks().some(t => t.enabled),
        };
        streams.push(peer);
      }
    }

    this.allStreams = streams;
    this.syncAudioAnalyzers(streams);

    // Separate screens from participants
    this.screenShares = streams.filter(s => s.isScreen);
    this.participantStreams = streams.filter(s => !s.isScreen);

    const hasScreenNow = this.screenShares.length > 0;

    // If we just entered screen-share mode, default focus to the shared screen
    // unless the user explicitly pinned something.
    if (hasScreenNow && !this.hadScreenShare) {
      if (this.pinnedParticipants.size === 0) {
        const firstScreen = this.screenShares[0];
        if (firstScreen) {
          this.focusedStreamId = firstScreen.peerId;
        }
      }
    }

    // If we exited screen-share mode, clear focus if it was a screen.
    if (!hasScreenNow && this.hadScreenShare) {
      if (this.focusedStreamId && this.focusedStreamId.includes('screen')) {
        this.focusedStreamId = undefined;
      }
    }

    this.hadScreenShare = hasScreenNow;

    // If focused stream disappeared (e.g. presenter stopped), clear focus.
    if (this.focusedStreamId && !streams.some(s => s.peerId === this.focusedStreamId)) {
      this.focusedStreamId = undefined;
    }

    this.recomputeLayoutStreams();
    this.scheduleQualityPolicyUpdate();
    this.syncFloatingOverlayWindow();

    // If the user already interacted once, best-effort start newly-added media.
    if (this.playbackUnlocked) {
      queueMicrotask(() => this.tryPlayAllMediaElements());
    }
  }

  private recomputeLayoutStreams() {
    const mode = this.effectiveLayoutMode;

    const isPip = (s: PeerStream) => !!this.pipStreamId && s.peerId === this.pipStreamId;

    // If the focused stream is currently in PiP, drop focus so we can choose another main.
    if (this.focusedStreamId && this.focusedStreamId === this.pipStreamId) {
      this.focusedStreamId = undefined;
    }

    // Present mode (Google Meet-like): include screen shares + participants.
    if (mode === 'present') {
      const screens = [...this.screenShares].filter(s => !isPip(s)).sort((a, b) => {
        // Prefer remote screens first, then stable order by id.
        if (a.isLocal !== b.isLocal) return a.isLocal ? 1 : -1;
        return a.peerId.localeCompare(b.peerId);
      });

      const participants = [...this.participantStreams].filter(s => !isPip(s)).sort((a, b) => {
        // Prefer remote participants first.
        if (a.isLocal !== b.isLocal) return a.isLocal ? 1 : -1;
        return a.peerId.localeCompare(b.peerId);
      });

      const candidates = [...screens, ...participants];

      const focused = this.focusedStreamId
        ? candidates.find(s => s.peerId === this.focusedStreamId)
        : undefined;

      let main = focused;

      // If anything is pinned, pick the first pinned that exists.
      if (!main && this.pinnedParticipants.size > 0) {
        for (const pinnedId of this.pinnedParticipants.values()) {
          const match = candidates.find(s => s.peerId === pinnedId);
          if (match) {
            main = match;
            break;
          }
        }
      }

      // If nothing is focused/pinned, keep the current main stream stable.
      if (!main && this.mainStream) {
        const existing = candidates.find(s => s.peerId === this.mainStream!.peerId);
        if (existing) main = existing;
      }

      // Default: show a screen share if available.
      if (!main) {
        main = screens[0] ?? participants[0];
      }

      this.mainStream = main;
      this.secondaryStreams = candidates.filter(s => s.peerId !== main?.peerId);
      return;
    }

    // Non-present modes: keep legacy behavior (participants only).
    const participantsOnly = this.participantStreams.filter(s => !isPip(s));
    const sorted = [...participantsOnly].sort((a, b) => {
      const aPinned = this.pinnedParticipants.has(a.peerId);
      const bPinned = this.pinnedParticipants.has(b.peerId);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;

      if (a.isLocal !== b.isLocal) return a.isLocal ? 1 : -1;
      return a.peerId.localeCompare(b.peerId);
    });

    // Keep current main stable unless focused/pinned logic overrides it.
    const focused = this.focusedStreamId ? sorted.find(s => s.peerId === this.focusedStreamId) : undefined;
    let main = focused;

    if (!main && this.pinnedParticipants.size > 0) {
      for (const pinnedId of this.pinnedParticipants.values()) {
        const match = sorted.find(s => s.peerId === pinnedId);
        if (match) {
          main = match;
          break;
        }
      }
    }

    if (!main && this.mainStream) {
      const existing = sorted.find(s => s.peerId === this.mainStream!.peerId);
      if (existing) main = existing;
    }

    this.mainStream = main ?? sorted[0];
    this.secondaryStreams = sorted.slice(1);
  }

  async ngAfterViewInit() {
    if (this.rtcInitCompleted || this.rtcInitStarted) {
      console.warn('[RTC🔍 COMPONENT] ngAfterViewInit skipped: RTC init already started/completed');
      return;
    }

    this.rtcInitStarted = true;

    try {
      this.initializeRtcSubscriptions();
      if (this.routeRoomId) {
        this.hydrateDirectCallSession(this.routeRoomId);
      }
      this.syncMediaPreferencesFromSession();
      await this.prepareLocalPreview();
      this.rtcInitCompleted = true;
      this.bindAuthorizedRoomChanges();
    } catch (err) {
      console.error('Error initializing video chat:', err);
      if (!this.shouldCaptureClientErrors()) {
        this.errorMessage = 'Unable to connect to the video chat right now. Please refresh the page and try again.';
      }
      this.cdr.markForCheck();
    } finally {
      this.rtcInitStarted = false;
    }
  }

  private updateIceWarningBanner() {
    try {
      const servers = this.rtcAdvanced.getIceServers() ?? [];
      const urls = servers
        .flatMap((s: any) => Array.isArray(s?.urls) ? s.urls : [s?.urls])
        .filter((u: any) => typeof u === 'string')
        .map((u: string) => u.trim());

      const isPublicGoogleStun = (u: string) => {
        const x = u.toLowerCase();
        return x.startsWith('stun:stun.l.google.com:19302')
          || x.startsWith('stun:stun1.l.google.com:19302')
          || x.startsWith('stun:stun2.l.google.com:19302')
          || x.startsWith('stun:stun3.l.google.com:19302')
          || x.startsWith('stun:stun4.l.google.com:19302');
      };

      const isSelfHostedStun = (u: string) => u.toLowerCase().startsWith('stun:evryka.org:3478');

      const stunUrls = urls.filter((u) => u.toLowerCase().startsWith('stun:'));
      const usesPublicGoogleStun = stunUrls.some(isPublicGoogleStun);
      const hasSelfHostedStun = stunUrls.some(isSelfHostedStun);

      if (this.rtcAdvanced.isUsingGoogleStunFallback() && usesPublicGoogleStun && !hasSelfHostedStun) {
        this.iceWarningMessage = 'STUN: Using Google fallback server (self-hosted STUN is currently unavailable)';
      } else {
        this.iceWarningMessage = '';
      }
    } catch {
      this.iceWarningMessage = '';
    }

    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    console.log('🧹 Cleaning up video chat...');
    this.routeParamSub?.unsubscribe();
    this.localStreamSub?.unsubscribe();
    this.authorizedRoomSub?.unsubscribe();
    this.textChatMessageSub?.unsubscribe();
    this.textChatTypingSub?.unsubscribe();
    this.dockEndCallSub?.unsubscribe();
    this.closeFloatingOverlayWindow();
    this.stopCurrentCallSession();

    try {
      document.removeEventListener('enterpictureinpicture', this.onDocumentPictureInPictureChange as any, true);
      document.removeEventListener('leavepictureinpicture', this.onDocumentPictureInPictureChange as any, true);
    } catch {
      // best-effort
    }

    if (this.pipSyncTimer) {
      clearInterval(this.pipSyncTimer);
      this.pipSyncTimer = undefined;
    }

    // Cleanup audio analysis
    this.stopSpeakingDetection();
    this.disposeAllAudioAnalyzers();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = undefined;
    }

    // Remove visibility change listener
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('pagehide', this.onPageHide);
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.onKeyboardShortcut);

    this.uninstallClientErrorCapture();
    this.videoCallDock.clear();
  }

  private installClientErrorCapture() {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      if (!this.originalConsoleError) {
        this.originalConsoleError = console.error.bind(console);
        console.error = (...args: any[]) => {
          try {
            this.captureConsoleError(args);
          } catch {
            // avoid breaking console
          }
          this.originalConsoleError?.(...args);
        };
      }

      window.addEventListener('error', this.onWindowError);
      window.addEventListener('unhandledrejection', this.onUnhandledRejection);
    } catch {
      // best-effort
    }
  }

  private uninstallClientErrorCapture() {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      if (this.originalConsoleError) {
        console.error = this.originalConsoleError;
        this.originalConsoleError = undefined;
      }

      window.removeEventListener('error', this.onWindowError);
      window.removeEventListener('unhandledrejection', this.onUnhandledRejection);
    } catch {
      // best-effort
    }
  }

  clearClientErrors() {
    this.clientErrors = [];
    this.cdr.markForCheck();
  }

  dismissClientError(id: number) {
    this.clientErrors = this.clientErrors.filter(e => e.id !== id);
    this.cdr.markForCheck();
  }

  hideClientErrors() {
    this.clientErrorsVisible = false;
    this.cdr.markForCheck();
  }

  trackByClientErrorId(_index: number, err: ClientErrorEntry): number {
    return err.id;
  }

  formatClientErrorTime(ts: number): string {
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return '';
    }
  }

  async copyClientErrors() {
    try {
      const text = this.clientErrors
        .slice(0, 20)
        .map(e => {
          const time = new Date(e.ts).toISOString();
          const count = e.count > 1 ? ` (x${e.count})` : '';
          const stack = e.stack ? `\n${e.stack}` : '';
          return `[${time}] ${e.source}${count}: ${e.message}${stack}`;
        })
        .join('\n\n');

      if (!text) {
        return;
      }

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch {
      // best-effort
    }
  }

  private captureConsoleError(args: any[]) {
    const { message, stack } = this.formatUnknownError(args);
    this.pushClientError({ source: 'console.error', message, stack });
  }

  private captureWindowError(event: ErrorEvent) {
    const err = event?.error;
    const { message, stack } = this.formatUnknownError(err ?? event?.message);
    this.pushClientError({ source: 'window.error', message, stack });
  }

  private captureUnhandledRejection(event: PromiseRejectionEvent) {
    const { message, stack } = this.formatUnknownError(event?.reason);
    this.pushClientError({ source: 'unhandledrejection', message, stack });
  }

  private pushClientError(entry: { source: ClientErrorEntry['source']; message: string; stack?: string }) {
    if (!this.shouldCaptureClientErrors()) {
      return;
    }

    // Make sure the overlay becomes visible as soon as an error occurs.
    this.clientErrorsVisible = true;

    const now = Date.now();
    const normalizedMessage = entry.message || '(no message)';
    const normalizedStack = entry.stack?.trim() || undefined;
    const key = `${entry.source}|${normalizedMessage}|${normalizedStack ?? ''}`;

    const existing = this.clientErrors[0];
    const existingKey = existing ? `${existing.source}|${existing.message}|${existing.stack ?? ''}` : undefined;

    if (existing && existingKey === key) {
      existing.count += 1;
      existing.ts = now;
      this.ngZone.run(() => this.cdr.markForCheck());
      return;
    }

    const next: ClientErrorEntry = {
      id: this.clientErrorIdSeq++,
      ts: now,
      source: entry.source,
      message: normalizedMessage,
      stack: normalizedStack,
      count: 1,
    };

    this.clientErrors = [next, ...this.clientErrors].slice(0, 20);
    // Ensure change detection runs even if error originated outside Angular.
    this.ngZone.run(() => this.cdr.markForCheck());
  }

  private formatUnknownError(value: any): { message: string; stack?: string } {
    try {
      if (Array.isArray(value)) {
        const parts = value.map(v => this.stringifyErrorLike(v)).filter(Boolean);
        return { message: parts.join(' ') || '(unknown error)' };
      }
      if (value instanceof Error) {
        return { message: value.message || String(value), stack: value.stack };
      }
      if (typeof value === 'string') {
        return { message: value };
      }
      if (value && typeof value === 'object') {
        const message = (value as any)?.message;
        const stack = (value as any)?.stack;
        if (typeof message === 'string') {
          return { message, stack: typeof stack === 'string' ? stack : undefined };
        }
        return { message: this.safeJson(value) };
      }
      return { message: String(value ?? '(unknown error)') };
    } catch {
      return { message: '(failed to format error)' };
    }
  }

  private stringifyErrorLike(value: any): string {
    try {
      if (value instanceof Error) {
        return value.message || String(value);
      }
      if (typeof value === 'string') {
        return value;
      }
      if (value && typeof value === 'object') {
        const message = (value as any)?.message;
        if (typeof message === 'string') {
          return message;
        }
        return this.safeJson(value);
      }
      return String(value);
    } catch {
      return '(unprintable)';
    }
  }

  private safeJson(value: any): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private handleWindowCloseLikeEvent(source: 'pagehide' | 'beforeunload') {
    try {
      console.log(`🧹 Window lifecycle event: ${source}. Stopping RTC/camera now.`);
      this.roomSwitchSequence += 1;
      this.authorizedRoomLoadSequence += 1;
      this.stopCurrentCallSession({ preserveSubscriptions: true });
    } catch (e) {
      // Best-effort: browsers can restrict work during unload
      console.warn('Window close cleanup partial failure:', e);
    }
  }

  private releaseRenderedMediaElements(): void {
    try {
      const host = this.elementRef?.nativeElement as HTMLElement | undefined;
      if (!host) {
        return;
      }

      const elements = Array.from(host.querySelectorAll('video, audio')) as HTMLMediaElement[];
      for (const element of elements) {
        try {
          element.pause();
        } catch {
          // best-effort
        }

        try {
          element.srcObject = null;
        } catch {
          // best-effort
        }

        try {
          element.removeAttribute('src');
          element.load();
        } catch {
          // best-effort
        }
      }
    } catch {
      // best-effort
    }
  }

  private buildVideoOnlyPreviewStream(stream: MediaStream | null | undefined): MediaStream | undefined {
    const liveVideoTracks = (stream?.getVideoTracks?.() ?? []).filter((track) => track.readyState === 'live');
    if (liveVideoTracks.length === 0) {
      return undefined;
    }

    return new MediaStream(liveVideoTracks);
  }

  private syncLocalPreviewVideoElement(): void {
    this.localPreviewStream = this.buildVideoOnlyPreviewStream(this.localCameraStream ?? null);

    if (!this.localVideoRef?.nativeElement) {
      return;
    }

    const previewElement = this.localVideoRef.nativeElement;
    previewElement.srcObject = this.localPreviewStream ?? null;
    previewElement.muted = true;
    previewElement.volume = 0;

    if (this.localPreviewStream) {
      previewElement.play().catch(() => undefined);
      return;
    }

    try {
      previewElement.pause();
    } catch {
      // best-effort
    }
  }

  private stopCurrentCallSession(options: { preserveSubscriptions?: boolean } = {}) {
    void this.exitAutoBackgroundPictureInPicture();
    if (this.floatingMiniPlayerMessageTimer) {
      clearTimeout(this.floatingMiniPlayerMessageTimer);
      this.floatingMiniPlayerMessageTimer = undefined;
    }
    if (this.qualityPolicyTimer) {
      clearTimeout(this.qualityPolicyTimer);
      this.qualityPolicyTimer = undefined;
    }
    this.floatingMiniPlayerMessage = '';

    try {
      this.rtcAdvanced.stopScreenShare();
    } catch {
      // ignore
    }

    this.sharingScreen = false;

    try {
      this.localCameraStream?.getTracks().forEach((track) => {
        try { track.stop(); } catch { }
      });
    } catch {
      // ignore
    }
    this.localCameraStream = undefined;
    this.localPreviewStream = undefined;
    this.isJoiningRoom = false;
    this.activeJoinedRoomId = undefined;

    try {
      const screenStream = (this.rtcAdvanced as any)?.localScreenStream as MediaStream | undefined;
      screenStream?.getTracks().forEach((track) => {
        try { track.stop(); } catch { }
      });
    } catch {
      // ignore
    }

    if (this.localVideoRef?.nativeElement) {
      this.localVideoRef.nativeElement.srcObject = null;
    }

    if (this.localScreenRef?.nativeElement) {
      this.localScreenRef.nativeElement.srcObject = null;
    }

    this.stopSpeakingDetection();
    this.disposeAllAudioAnalyzers();
    if (this.audioContext) {
      this.audioContext.close().catch(() => undefined);
      this.audioContext = undefined;
    }

    if (!options.preserveSubscriptions) {
      this.sub?.unsubscribe();
      this.participantsSub?.unsubscribe();
      this.roomPresenceSub?.unsubscribe();
      this.peerMediaStateSub?.unsubscribe();
      this.sub = undefined;
      this.participantsSub = undefined;
      this.roomPresenceSub = undefined;
      this.peerMediaStateSub = undefined;
    }

    this.chatService.disconnect();
    this.resetTextChatHistoryState();

    this.rtcAdvanced.leaveRoom();
    this.activeJoinedRoomId = undefined;
    this.iceWarningMessage = '';
    this.allStreams = [];
    this.screenShares = [];
    this.participantStreams = [];
    this.roomPresenceEntries = [];
    this.secondaryStreams = [];
    this.mainStream = undefined;
    this.focusedStreamId = undefined;
    this.pinnedParticipants.clear();
    this.pipStreamId = undefined;
    this.hiddenTabLayoutState = undefined;
    this.autoBackgroundPipPeerId = undefined;
    this.hadScreenShare = false;
    this.participantCount = 0;
    this.releaseRenderedMediaElements();
    this.videoCallDock.clear();
    this.cdr.markForCheck();
  }

  private syncMediaPreferencesFromSession(): void {
    let audioEnabled = true;
    let videoEnabled = true;

    try {
      const persistedAudio = sessionStorage.getItem('rtc.audioEnabled');
      const persistedVideo = sessionStorage.getItem('rtc.videoEnabled');
      if (persistedAudio !== null) {
        audioEnabled = persistedAudio !== '0' && persistedAudio !== 'false';
      }
      if (persistedVideo !== null) {
        videoEnabled = persistedVideo !== '0' && persistedVideo !== 'false';
      }
    } catch {
      // best-effort
    }

    this.audioOn = audioEnabled;
    this.videoOn = videoEnabled;
    this.rtcAdvanced.setPreferredMediaState(audioEnabled, videoEnabled);
    this.selectedAudioInputDeviceId = this.rtcAdvanced.getPreferredAudioInputDeviceId() ?? '';
    this.selectedVideoInputDeviceId = this.rtcAdvanced.getPreferredVideoInputDeviceId() ?? '';
    this.syncVideoCallDockState();
  }

  private async prepareLocalPreview(): Promise<void> {
    this.isPreparingPreview = true;

    try {
      await this.ensureLocalCameraReady();
      await this.refreshAvailableMediaDevices();
    } finally {
      this.isPreparingPreview = false;
      this.cdr.markForCheck();
    }
  }

  private buildMediaDeviceOptions(devices: MediaDeviceInfo[], kindLabel: string): MediaDeviceOption[] {
    return devices.map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `${kindLabel} ${index + 1}`,
    }));
  }

  private async refreshAvailableMediaDevices(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((device) => device.kind === 'audioinput');
      const videoInputs = devices.filter((device) => device.kind === 'videoinput');

      this.availableAudioInputDevices = this.buildMediaDeviceOptions(audioInputs, 'Microphone');
      this.availableVideoInputDevices = this.buildMediaDeviceOptions(videoInputs, 'Camera');

      if (!this.selectedAudioInputDeviceId || !this.availableAudioInputDevices.some((device) => device.deviceId === this.selectedAudioInputDeviceId)) {
        this.selectedAudioInputDeviceId = this.rtcAdvanced.getPreferredAudioInputDeviceId()
          ?? this.availableAudioInputDevices[0]?.deviceId
          ?? '';
      }

      if (!this.selectedVideoInputDeviceId || !this.availableVideoInputDevices.some((device) => device.deviceId === this.selectedVideoInputDeviceId)) {
        this.selectedVideoInputDeviceId = this.rtcAdvanced.getPreferredVideoInputDeviceId()
          ?? this.availableVideoInputDevices[0]?.deviceId
          ?? '';
      }

      this.rtcAdvanced.setPreferredInputDevices({
        audioInputDeviceId: this.selectedAudioInputDeviceId || undefined,
        videoInputDeviceId: this.selectedVideoInputDeviceId || undefined,
      });
    } catch (error) {
      console.warn('Unable to enumerate media devices', error);
    }
  }

  async onAudioInputDeviceChange(deviceId: string): Promise<void> {
    this.selectedAudioInputDeviceId = String(deviceId || '').trim();
    this.rtcAdvanced.setPreferredInputDevices({
      audioInputDeviceId: this.selectedAudioInputDeviceId || undefined,
      videoInputDeviceId: this.selectedVideoInputDeviceId || undefined,
    });
    await this.prepareLocalPreview();
  }

  async onVideoInputDeviceChange(deviceId: string): Promise<void> {
    this.selectedVideoInputDeviceId = String(deviceId || '').trim();
    this.rtcAdvanced.setPreferredInputDevices({
      audioInputDeviceId: this.selectedAudioInputDeviceId || undefined,
      videoInputDeviceId: this.selectedVideoInputDeviceId || undefined,
    });
    await this.prepareLocalPreview();
  }

  private syncLocalStreamState(stream: MediaStream | null): void {
    this.localCameraStream = stream ?? undefined;

    const hasVideo = !!stream?.getVideoTracks().some((track) => track.readyState === 'live');
    const hasAudio = !!stream?.getAudioTracks().some((track) => track.readyState === 'live');
    const wantsVideo = this.rtcAdvanced.isVideoEnabled();
    const wantsAudio = this.rtcAdvanced.isAudioEnabled();

    this.videoOn = wantsVideo && hasVideo;
    this.audioOn = wantsAudio && hasAudio;
    this.isAudioOnlyMode = wantsVideo && !hasVideo;

    this.syncLocalPreviewVideoElement();

    this.rebuildAllStreams(this.rtcAdvanced.getRemoteStreamsSnapshot());
    this.cdr.markForCheck();
  }

  private async ensureLocalCameraReady() {
    const hasLiveLocalStream = !!this.localCameraStream?.getTracks().some((track) => track.readyState === 'live');
    if (hasLiveLocalStream) {
      this.rebuildAllStreams(this.rtcAdvanced.getRemoteStreamsSnapshot());
      return;
    }

    const localCam = await this.rtcAdvanced.initLocalCamera();
    if (!localCam) {
      throw new Error('Failed to initialize camera');
    }

    this.localCameraStream = localCam;

    const hasVideo = localCam.getVideoTracks().length > 0;
    this.isAudioOnlyMode = this.rtcAdvanced.isVideoEnabled() && !hasVideo;
    this.videoOn = hasVideo && this.rtcAdvanced.isVideoEnabled();
    this.audioOn = localCam.getAudioTracks().length > 0 && this.rtcAdvanced.isAudioEnabled();

    if (hasVideo) {
      this.syncLocalPreviewVideoElement();
    } else if (this.localVideoRef?.nativeElement) {
      this.localPreviewStream = undefined;
      this.localVideoRef.nativeElement.srcObject = null;
      console.log('🎙️ Running in audio-only mode');
    }

    this.rebuildAllStreams(this.rtcAdvanced.getRemoteStreamsSnapshot());
    this.cdr.markForCheck();
  }

  private initializeRtcSubscriptions() {
    if (this.rtcSubscriptionsInitialized) {
      return;
    }

    this.rtcSubscriptionsInitialized = true;

    this.localStreamSub = this.rtcAdvanced.getLocalStream$().subscribe((stream) => {
      this.ngZone.run(() => {
        this.syncLocalStreamState(stream);
        this.syncVideoCallDockState();
      });
    });

    this.participantsSub = this.rtcAdvanced.getParticipantIds$().subscribe((ids) => {
      this.ngZone.run(() => {
        const remoteDisplayNamesBySocketId = new Map<string, string>();
        for (const remote of this.rtcAdvanced.getRemoteStreamsSnapshot()) {
          const socketId = String(remote?.peerId ?? '').trim();
          const displayName = String(remote?.displayName ?? '').trim().toLowerCase();
          if (socketId && displayName && !remoteDisplayNamesBySocketId.has(socketId)) {
            remoteDisplayNamesBySocketId.set(socketId, displayName);
          }
        }

        const uniqueParticipants = new Set<string>();
        for (const socketId of (ids ?? [])) {
          const profileId = this.rtcAdvanced.getPeerProfileId?.(socketId);
          const userId = this.rtcAdvanced.getPeerUserId?.(socketId);
          const clientId = this.rtcAdvanced.getPeerClientId?.(socketId);
          const displayName = remoteDisplayNamesBySocketId.get(socketId);
          uniqueParticipants.add(profileId || userId || clientId || displayName || socketId);
        }
        if (this.roomPresenceEntries.length === 0) {
          this.participantCount = uniqueParticipants.size + 1;
        }
        this.updateRtcDebugFromParticipants(ids);
        this.syncTextChatDockState();
        this.syncVideoCallDockState();
        this.cdr.markForCheck();
      });
    });

    this.roomPresenceSub = this.rtcAdvanced.getRoomPresence$().subscribe((state) => {
      this.ngZone.run(() => {
        const participants = [...(state?.participants ?? [])].sort((left, right) => {
          if (left.isSelf !== right.isSelf) return left.isSelf ? -1 : 1;
          if (left.inRoom !== right.inRoom) return left.inRoom ? -1 : 1;
          if (left.online !== right.online) return left.online ? -1 : 1;
          return this.getRoomPresenceDisplayName(left).localeCompare(this.getRoomPresenceDisplayName(right));
        });

        this.roomPresenceEntries = participants;
        this.participantCount = Number(state?.connectedCount ?? participants.filter((participant) => participant.inRoom).length);

        if (this.room?.type === 'direct' && this.directCallSession?.role === 'callee' && !this.directCallSession.joinHistoryRecordedAt) {
          const selfJoined = participants.some((participant) => participant.isSelf && participant.inRoom);
          if (selfJoined && !this.directCallJoinHistoryInFlight) {
            const joinedAt = Date.now();
            this.directCallSession.answeredAt = this.directCallSession.answeredAt || joinedAt;
            this.persistDirectCallSessionContext();
            this.directCallJoinHistoryInFlight = true;
            void this.recordDirectCallJoinHistory().finally(() => {
              this.directCallJoinHistoryInFlight = false;
            });
          }
        }

        if (this.room?.type === 'direct' && this.directCallSession?.role === 'caller' && !this.directCallSession.answeredAt) {
          const someoneElseJoined = participants.some((participant) => !participant.isSelf && participant.inRoom);
          if (someoneElseJoined) {
            this.directCallSession.answeredAt = Date.now();
            this.persistDirectCallSessionContext();
          }
        }

        this.syncTextChatDockState();
        this.syncVideoCallDockState();
        this.cdr.markForCheck();
      });
    });

    this.sub = this.rtcAdvanced.getRemoteStreams$().subscribe((remoteStreams) => {
      this.ngZone.run(() => {
        this.rebuildAllStreams(remoteStreams);
        this.updateRtcDebugFromRemoteStreams(remoteStreams);
        this.cdr.markForCheck();
      });
    });

    this.peerMediaStateSub = this.rtcAdvanced.getPeerMediaStates$().subscribe((states) => {
      this.ngZone.run(() => {
        for (const ps of this.allStreams) {
          if (ps.isLocal) continue;
          const socketId = ps.socketId;
          if (!socketId) continue;
          const state = states.get(socketId);
          if (state) {
            ps.isMuted = !state.audioEnabled;
          }
        }
        this.cdr.markForCheck();
      });
    });
  }

  private initializeTextChatSubscriptions() {
    if (!this.textChatMessageSub) {
      this.textChatMessageSub = this.chatService.onMessages().subscribe((payload) => {
        console.log('incoming message', payload);
        this.ngZone.run(() => {
          this.appendTextChatMessage(payload);
          this.cdr.markForCheck();
        });
      });
    }

    if (!this.textChatTypingSub) {
      this.textChatTypingSub = this.chatService.onTyping().subscribe((state) => {
        this.ngZone.run(() => {
          this.textChatPeerTyping = !!state?.isTyping;
          this.cdr.markForCheck();
        });
      });
    }
  }

  private handleWindowResize() {
    const nextIsMobile = window.innerWidth <= 900;
    if (this.isMobileViewport === nextIsMobile) {
      return;
    }

    this.isMobileViewport = nextIsMobile;

    if (nextIsMobile && this.isTextChatMinimized) {
      this.isTextChatMinimized = false;
    }

    this.syncTextChatDockState();

    this.cdr.markForCheck();
  }

  private initializeTextChatRoom(roomId: string, displayName: string, token?: string) {
    try {
      this.chatService.connect(token || undefined);
      this.chatService.leaveRoom();
      this.chatService.joinRoom(roomId, displayName, this.currentUserEmail || undefined, token || undefined);
      this.textChatConnected = true;
      this.textChatPeerTyping = false;
    } catch (error) {
      console.error('Unable to initialize in-call text chat:', error);
      this.textChatConnected = false;
      this.textChatPeerTyping = false;
    }

    this.loadInitialTextChatHistory();
    this.syncTextChatDockState();
  }

  private appendTextChatMessage(payload: ChatMessagePayload, forceMine: boolean = false) {
    if (!payload?.text) {
      return;
    }

    const shouldStickToBottom = this.isTextChatNearBottom(this.inCallChatScrollRef?.nativeElement);
    const senderUserId = this.toSafeText(payload?.meta?.senderUserId);
    const mine = forceMine || (!!senderUserId && !!this.userId && senderUserId === this.userId);
    const message: InCallTextChatMessage = {
      id: this.toSafeText(payload.msgId) || `${payload.sentAt}-${this.textChatMessages.length}`,
      text: this.toSafeText(payload.text),
      senderLabel: this.toSafeText(payload?.meta?.senderName) || (mine ? 'You' : 'Participant'),
      senderUserId: senderUserId || undefined,
      mine,
      sentAt: Number(payload.sentAt || Date.now()),
      type: this.toSafeText(payload?.meta?.messageType) || 'text',
    };

    const alreadyPresent = this.textChatMessages.some((entry) => entry.id === message.id);
    if (alreadyPresent) {
      return;
    }

    this.textChatMessages = [...this.textChatMessages, message].slice(-200);

    if (!message.mine && !this.isTextChatVisible) {
      this.textChatUnreadCount += 1;
    }

    if (this.isTextChatVisible || message.mine || shouldStickToBottom) {
      this.scheduleTextChatScrollToBottom();
    }
  }

  private scheduleTextChatScrollToBottom(focusComposer: boolean = false) {
    requestAnimationFrame(() => {
      const container = this.inCallChatScrollRef?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }

      if (focusComposer && this.inCallChatComposerRef?.nativeElement) {
        this.inCallChatComposerRef.nativeElement.focus();
      }
    });
  }

  private syncTextChatDockState() {
    if (!this.shouldAutoDockTextChat) {
      this.textChatDismissedWhileSolo = false;
      return;
    }

    if (!this.textChatDismissedWhileSolo) {
      this.textChatUnreadCount = 0;
    }
  }

  private getTextChatHistoryRoomId(): string {
    const directRoomId = this.toSafeText(this.directCallSession?.chatRoomId);
    if (directRoomId) {
      return directRoomId;
    }

    return this.toSafeText(this.activeJoinedRoomId) || this.toSafeText(this.routeRoomId) || this.toSafeText(this.room?._id);
  }

  private resetTextChatHistoryState() {
    this.textChatConnected = false;
    this.textChatPeerTyping = false;
    this.textChatDraft = '';
    this.textChatMessages = [];
    this.textChatUnreadCount = 0;
    this.textChatHistoryTotal = 0;
    this.textChatHistoryPageIndex = 0;
    this.isTextChatHistoryLoading = false;
    this.isTextChatLoadingOlder = false;
    this.isTextChatOpen = false;
    this.isTextChatMinimized = false;
    this.textChatDismissedWhileSolo = false;
  }

  private loadInitialTextChatHistory() {
    const historyRoomId = this.getTextChatHistoryRoomId();
    const activeRoomId = this.toSafeText(this.activeJoinedRoomId);
    const requestSeq = ++this.textChatHistoryRequestSeq;

    this.textChatMessages = [];
    this.textChatUnreadCount = 0;
    this.textChatHistoryTotal = 0;
    this.textChatHistoryPageIndex = 0;
    this.isTextChatHistoryLoading = !!historyRoomId;
    this.isTextChatLoadingOlder = false;
    this.cdr.markForCheck();

    if (!historyRoomId) {
      this.isTextChatHistoryLoading = false;
      return;
    }

    this.loadTextChatHistoryPage(historyRoomId, 0)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (requestSeq !== this.textChatHistoryRequestSeq || activeRoomId !== this.toSafeText(this.activeJoinedRoomId) || historyRoomId !== this.getTextChatHistoryRoomId()) {
            return;
          }

          this.textChatMessages = this.mapStoredTextChatMessages(res?.items);
          this.textChatHistoryTotal = Number(res?.totalItems || this.textChatMessages.length || 0);
          this.textChatHistoryPageIndex = this.textChatMessages.length > 0 ? 1 : 0;
          this.isTextChatHistoryLoading = false;
          this.cdr.markForCheck();

          if (this.isTextChatVisible) {
            this.scheduleTextChatScrollToBottom();
          }
        },
        error: (error) => {
          if (requestSeq !== this.textChatHistoryRequestSeq) {
            return;
          }

          console.error('Unable to load in-call text chat history', error);
          this.isTextChatHistoryLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private loadOlderTextChatMessages() {
    const container = this.inCallChatScrollRef?.nativeElement;
    const historyRoomId = this.getTextChatHistoryRoomId();
    const requestPage = this.textChatHistoryPageIndex;
    const requestSeq = this.textChatHistoryRequestSeq;

    if (!container || !historyRoomId || this.isTextChatHistoryLoading || this.isTextChatLoadingOlder || !this.canLoadOlderTextChatMessages) {
      return;
    }

    const previousHeight = container.scrollHeight;
    this.isTextChatLoadingOlder = true;
    this.cdr.markForCheck();

    this.loadTextChatHistoryPage(historyRoomId, requestPage)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (requestSeq !== this.textChatHistoryRequestSeq || historyRoomId !== this.getTextChatHistoryRoomId()) {
            return;
          }

          const olderMessages = this.mapStoredTextChatMessages(res?.items)
            .filter((message) => !this.textChatMessages.some((existing) => existing.id === message.id));

          if (olderMessages.length > 0) {
            this.textChatMessages = [...olderMessages, ...this.textChatMessages];
            this.textChatHistoryTotal = Number(res?.totalItems || this.textChatHistoryTotal || this.textChatMessages.length);
            this.textChatHistoryPageIndex = requestPage + 1;
            this.cdr.detectChanges();

            requestAnimationFrame(() => {
              const nextContainer = this.inCallChatScrollRef?.nativeElement;
              if (nextContainer) {
                nextContainer.scrollTop = nextContainer.scrollHeight - previousHeight;
              }
            });
          } else if (Number(res?.totalItems || 0) <= this.textChatMessages.length) {
            this.textChatHistoryTotal = Number(res?.totalItems || this.textChatMessages.length);
          }

          this.isTextChatLoadingOlder = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          if (requestSeq !== this.textChatHistoryRequestSeq) {
            return;
          }

          console.error('Unable to load older in-call text chat messages', error);
          this.isTextChatLoadingOlder = false;
          this.cdr.markForCheck();
        }
      });
  }

  private loadTextChatHistoryPage(roomId: string, pageIndex: number) {
    const sorting: Sorting = {
      property: 'createdDate',
      direction: 'DESC'
    };
    const filtering: Filtering = [{
      property: 'roomId',
      rule: FilterRule.EQUALS,
      value: roomId,
    }];

    return this.directChatMessageService.getAllAsync(this.textChatHistoryPageSize, pageIndex, sorting, filtering, true, true);
  }

  private mapStoredTextChatMessages(messages: IChatMessageResponse[] | null | undefined): InCallTextChatMessage[] {
    return [...(messages ?? [])]
      .reverse()
      .map((message) => this.mapStoredTextChatMessage(message))
      .filter((message): message is InCallTextChatMessage => !!message);
  }

  private mapStoredTextChatMessage(message: IChatMessageResponse | null | undefined): InCallTextChatMessage | null {
    const text = this.toSafeText(message?.content);
    if (!text) {
      return null;
    }

    const senderUserId = this.toSafeText(message?.meta?.['senderUserId']) || this.toSafeText((message as any)?.senderId);
    const mine = !!senderUserId && !!this.userId && senderUserId === this.userId;
    const sentAtRaw = (message as any)?.createdDate ?? (message as any)?.modifiedDate ?? Date.now();
    const sentAt = Number.isFinite(new Date(sentAtRaw).getTime()) ? new Date(sentAtRaw).getTime() : Date.now();

    return {
      id: this.toSafeText((message as any)?._id) || this.toSafeText(message?.meta?.['liveMsgId']) || `${sentAt}-${text}`,
      text,
      senderLabel: this.toSafeText(message?.senderName) || this.toSafeText(message?.meta?.['actorName']) || this.toSafeText(message?.meta?.['senderName']) || (mine ? 'You' : 'Participant'),
      senderUserId: senderUserId || undefined,
      mine,
      sentAt,
      type: this.toSafeText((message as any)?.type) || this.toSafeText(message?.meta?.['kind']) || 'text',
    };
  }

  private isTextChatNearBottom(container: HTMLDivElement | undefined, threshold = 72): boolean {
    if (!container) {
      return true;
    }

    return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
  }

  private async persistInCallTextChatMessage(text: string, meta: Record<string, unknown>): Promise<void> {
    const roomId = this.getTextChatHistoryRoomId();
    if (!roomId) {
      return;
    }

    try {
      await firstValueFrom(this.directChatMessageService.createAsync({
        roomId,
        receiverId: this.directCallSession?.counterpartUserId,
        content: text,
        type: 'text',
        meta: {
          ...meta,
          liveRoomId: this.toSafeText(this.activeJoinedRoomId) || undefined,
          messageType: 'text',
        },
        skipExternalNotification: true,
      } as any, true, false).pipe(take(1)));
    } catch (error) {
      console.error('Unable to persist in-call text chat message', error);
    }
  }

  private bindAuthorizedRoomChanges() {
    if (this.authorizedRoomSub) {
      return;
    }

    this.authorizedRoomSub = this.authorizedRoomId$.subscribe((roomId) => {
      if (!roomId || !this.rtcInitCompleted) {
        return;
      }

      const switchSequence = ++this.roomSwitchSequence;
      void this.joinAuthorizedRoom(roomId, switchSequence);
    });
  }

  async joinCall(): Promise<void> {
    const roomId = this.routeRoomId ?? String(this.room?._id ?? '').trim();
    if (!roomId || this.isJoiningRoom || this.activeJoinedRoomId === roomId) {
      return;
    }

    this.isJoiningRoom = true;
    const switchSequence = ++this.roomSwitchSequence;

    try {
      await this.joinAuthorizedRoom(roomId, switchSequence);
    } finally {
      if (switchSequence === this.roomSwitchSequence) {
        this.isJoiningRoom = false;
        this.cdr.markForCheck();
      }
    }
  }

  private async joinAuthorizedRoom(roomId: string, switchSequence: number) {
    if (!roomId || roomId === this.activeJoinedRoomId) {
      return;
    }

    try {
      this.stopCurrentCallSession({ preserveSubscriptions: true });
      if (switchSequence !== this.roomSwitchSequence) {
        return;
      }

      await this.ensureLocalCameraReady();
      if (switchSequence !== this.roomSwitchSequence) {
        return;
      }

      const token = this.getSignalingToken();
      console.log('[RTC🔍 COMPONENT] Connecting to signaling server...', { roomId, hasToken: !!token });
      await this.rtcAdvanced.connect(token || undefined);
      if (switchSequence !== this.roomSwitchSequence) {
        return;
      }

      this.updateIceWarningBanner();

      const fromQuery = String(this.route?.snapshot?.queryParamMap?.get('name') || this.route?.snapshot?.queryParamMap?.get('displayName') || '').trim();
      const displayName = (this.currentUserDisplayName || this.currentUserEmail || fromQuery || `Guest ${String(this.userId || '').substring(0, 6)}`).trim();
      console.log('[RTC🔍 COMPONENT] joinRoom', {
        roomId,
        displayName,
        userId: this.userId || '(none)',
        profileId: this.profileId || '(none)',
      });
      this.rtcAdvanced.joinRoom(
        roomId,
        displayName || undefined,
        this.userId || undefined,
        this.profileId || undefined,
        this.currentUserEmail || undefined,
        token || undefined,
      );
      this.activeJoinedRoomId = roomId;
      this.initializeTextChatRoom(roomId, displayName, token || undefined);
      this.participantCount = 1;
      this.roomPresenceEntries = [];
      this.recomputeLayoutStreams();
      this.syncTextChatDockState();
      this.syncVideoCallDockState();
      this.cdr.markForCheck();
    } catch (err) {
      console.error('Error switching video chat room:', err);
      if (!this.shouldCaptureClientErrors()) {
        this.errorMessage = 'Unable to connect to the selected room right now. Please try again.';
      }
      this.cdr.markForCheck();
    }
  }
  loadRoom(id: string) {
    const loadSequence = ++this.authorizedRoomLoadSequence;
    const token = (this.route.snapshot.queryParamMap.get('token') ?? '').trim();

    // If we don't have a token link and we can't derive the current user email,
    // we can't validate participant membership client-side.
    if (!token && !this.currentUserEmail) {
      this.notParticipant = true;
      this.errorMessage = 'Unable to determine current user. Please sign in again or use a join link.';
      this.cdr.markForCheck();
      return;
    }

    // Always use getByIdWithTokenAsync — the separate /join endpoint is not yet
    // reliably deployed, so avoid the 404 entirely.  Passing the token as a
    // query-param lets the backend auto-admit the caller when the route IS ready.
    const room$ = this.videoChatRoomService.getByIdWithTokenAsync(id, token || undefined);

    room$.pipe(take(1)).subscribe({
      next: (res: VideoChatRoom) => {
        if (loadSequence !== this.authorizedRoomLoadSequence || this.routeRoomId !== id) {
          return;
        }

        console.log('[RTC🔍 COMPONENT] Video Chat Room loaded successfully', { roomId: res?._id, participants: res?.participants?.length });
        if (res) {
          this.room = res;
          this.hydrateDirectCallSession(id);
          this.syncMediaPreferencesFromSession();
          // Open meetings (group + isOpenMeeting) let everyone in.
          // Token-based joins are also pre-authorized by the backend.
          // Otherwise enforce participant membership.
          const isOpenMeeting = res.type === 'group' && !!(res as any).isOpenMeeting;
          const isAllowed = isOpenMeeting
            ? true
            : token
              ? true
              : this.room.participants.some((p: any) => p.email === this.currentUserEmail);

          if (!isAllowed) {
            this.notParticipant = true;
            this.errorMessage = 'You are not a participant of this room!';
            this.cdr.markForCheck();
            return;
          }

          this.notParticipant = false;
          void this.prepareLocalPreview();
          this.syncVideoCallDockState();

          // Make the room URL shareable by default: if we have a joinToken but the current
          // URL doesn't include it, inject it into the query string.
          // This prevents users from copying a non-tokenized URL that other accounts cannot join.
          if (!token) {
            const joinToken = String((this.room as any)?.joinToken ?? '').trim();
            if (joinToken) {
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { token: joinToken },
                queryParamsHandling: 'merge',
                replaceUrl: true,
              }).catch(() => undefined);
            }
          }

          this.cdr.markForCheck();
        } else {
          this.router.navigate(['/recruitment/communication/video-chat']);
          return;
        }
      },
      error: (err: any) => {
        if (loadSequence !== this.authorizedRoomLoadSequence || this.routeRoomId !== id) {
          return;
        }

        console.error('[RTC🔍 COMPONENT] Error loading Video Chat Room', err);
        this.pushClientError({
          source: 'console.error',
          message: `Video Chat Room load failed: ${err?.status ?? ''} ${err?.statusText ?? ''} ${err?.url ?? ''} — ${err?.message ?? String(err)}`.trim(),
        });
        this.notParticipant = true;
        this.errorMessage = 'Unable to load room.';
        this.cdr.markForCheck();
      }
    });
  }

  async startScreenShare() {
    try {
      // Must be triggered directly by a user gesture
      // Use the service helper so the screen track is actually added to each peer connection
      // and renegotiation occurs.
      const stream = await this.rtcAdvanced.startScreenShareSimultaneously();
      if (stream == null) {
        this.sharingScreen = false;
        this.cdr.markForCheck();
        return;
      }
      this.localScreenRef.nativeElement.srcObject = stream;
      try { await this.localScreenRef.nativeElement.play(); } catch { }
      this.sharingScreen = true;
      console.log('✅ Screen sharing started');
      this.cdr.markForCheck();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        alert('Please allow screen sharing in your browser.');
      } else if (err.name === 'AbortError') {
        console.warn('User canceled screen share.');
      } else {
        console.error('Screen share error:', err);
      }
      this.cdr.markForCheck();
    }
  }

  stopScreenShare() {
    this.rtcAdvanced.stopScreenShare();
    if (this.localScreenRef?.nativeElement) {
      this.localScreenRef.nativeElement.srcObject = null;
    }
    this.sharingScreen = false;
    console.log('🛑 Screen sharing stopped');
    this.cdr.markForCheck();
  }

  async toggleScreenShare() {
    if (this.sharingScreen) {
      this.rtcAdvanced.stopScreenShare();
      if (this.localScreenRef?.nativeElement) {
        this.localScreenRef.nativeElement.srcObject = null;
      }
      this.sharingScreen = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      // Must be directly triggered by user click
      const stream = await this.rtcAdvanced.startScreenShareSimultaneously();
      if (!stream) return;

      this.localScreenRef.nativeElement.srcObject = stream;
      this.localScreenRef.nativeElement.muted = true;
      this.localScreenRef.nativeElement.volume = 0;
      await this.localScreenRef.nativeElement.play();

      this.sharingScreen = true;
      this.rebuildAllStreams(this.rtcAdvanced.getRemoteStreamsSnapshot());
      this.cdr.markForCheck();

      // 🔥 Listen for when user stops sharing manually
      const [track] = stream.getVideoTracks();
      if (track) {
        track.onended = () => {
          console.log('Screen sharing stopped by user.');
          this.sharingScreen = false;
          this.localScreenRef.nativeElement.srcObject = null;
          this.rebuildAllStreams(this.rtcAdvanced.getRemoteStreamsSnapshot());
          this.cdr.markForCheck();
        };
      }
    } catch (err) {
      console.error('Screen share failed:', err);
      this.sharingScreen = false;
      this.cdr.markForCheck();
    }
  }

  async toggleAudio() {
    const previousState = this.audioOn;
    this.audioOn = !this.audioOn;
    console.log('🎯 toggleAudio CLICKED', `Changing from ${previousState} to ${this.audioOn}`);
    console.log('toggleAudio', `🎙️ Mic ${this.audioOn ? 'enabled' : 'disabled'}`);

    // Persist mute state so it survives component re-create / soft-refresh.
    try { sessionStorage.setItem('rtc.audioEnabled', this.audioOn ? '1' : '0'); } catch { }

    // Important: do NOT unmute local playback here (local elements stay muted to avoid echo).
    // This toggle controls outgoing audio transmission only (replaceTrack + track.stop when muting).
    try {
      await this.rtcAdvanced.toggleAudio(this.audioOn);
      this.syncLocalStreamState(this.localCameraStream ?? null);
      console.log('✅ toggleAudio completed successfully, audioOn =', this.audioOn);
    } catch (error) {
      console.error('❌ toggleAudio failed:', error);
      // Revert state on error
      this.audioOn = previousState;
      try { sessionStorage.setItem('rtc.audioEnabled', this.audioOn ? '1' : '0'); } catch { }
    }
    this.syncVideoCallDockState();
    this.cdr.markForCheck();
  }

  async toggleVideo() {
    // Prevent toggle if in audio-only mode (camera not available)
    if (this.isAudioOnlyMode) {
      console.warn('⚠️ Video toggle disabled: running in audio-only mode');
      return;
    }

    const previousState = this.videoOn;
    this.videoOn = !this.videoOn;
    console.log('🎯 toggleVideo CLICKED', `Changing from ${previousState} to ${this.videoOn}`);
    console.log(`toggleVideo`, `📷 Camera ${this.videoOn ? 'enabled' : 'disabled'}`);

    // Persist video-off state so it survives component re-create / soft-refresh.
    try { sessionStorage.setItem('rtc.videoEnabled', this.videoOn ? '1' : '0'); } catch { }

    // This toggle must stop/start camera *capture* and sending to peers.
    // The service handles: replaceTrack(null) + track.stop() when off, and re-acquire video when on.
    try {
      await this.rtcAdvanced.toggleVideo(this.videoOn);

      if (this.localVideoRef?.nativeElement && this.localCameraStream) {
        this.localVideoRef.nativeElement.srcObject = this.localCameraStream;
        this.localVideoRef.nativeElement.muted = true;
        this.localVideoRef.nativeElement.volume = 0;
        try { await this.localVideoRef.nativeElement.play(); } catch { }
      }

      // Rebuild streams to update UI so local tile reflects camera-off state.
      this.rebuildAllStreams(this.rtcAdvanced.getRemoteStreamsSnapshot());
      console.log('✅ toggleVideo completed successfully, videoOn =', this.videoOn);
    } catch (error) {
      console.error('❌ toggleVideo failed:', error);
      // Revert state on error
      this.videoOn = previousState;
      try { sessionStorage.setItem('rtc.videoEnabled', this.videoOn ? '1' : '0'); } catch { }
    }
    this.syncVideoCallDockState();
    this.cdr.markForCheck();
  }

  exitFullscreen() {
    void this.endCall();
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    console.log(`📦 Video chat ${this.isMinimized ? 'minimized' : 'maximized'}`);
    this.syncVideoCallDockState();
    this.cdr.markForCheck();
  }

  handleVisibilityChange() {
    if (!document.hidden) {
      void this.restoreCallLayoutAfterHiddenTab();
      return;
    }

    void this.keepCallActiveWhileHidden();
  }

  async endCall() {
    console.log('☎️ Ending call...');

    const directCallContextSnapshot = this.directCallSession
      ? { ...this.directCallSession }
      : undefined;
    const terminalKind = directCallContextSnapshot?.role === 'caller'
      ? (directCallContextSnapshot.answeredAt ? 'direct-call-ended' : 'direct-call-missed')
      : undefined;

    try {
      this.stopCurrentCallSession();

      if (terminalKind) {
        await this.persistDirectCallTerminalHistory(terminalKind, directCallContextSnapshot);
      } else {
        this.clearDirectCallSessionContext();
      }
    } finally {
      await this.navigateBackToChatDialog();
    }
  }

  // =============== AUDIO ANALYSIS & SPEAKING DETECTION ===============

  private disposeAudioAnalyzer(peerId: string) {
    const binding = this.audioAnalyzers.get(peerId);
    if (!binding) {
      return;
    }

    try {
      binding.source.disconnect();
    } catch {
      // best-effort
    }

    try {
      binding.analyzer.disconnect();
    } catch {
      // best-effort
    }

    this.audioAnalyzers.delete(peerId);
  }

  private disposeAllAudioAnalyzers() {
    for (const peerId of Array.from(this.audioAnalyzers.keys())) {
      this.disposeAudioAnalyzer(peerId);
    }
  }

  private syncAudioAnalyzers(streams: PeerStream[]) {
    const expectedPeers = new Set(
      streams
        .filter(peer => !peer.isScreen)
        .map(peer => peer.peerId)
    );

    for (const peerId of Array.from(this.audioAnalyzers.keys())) {
      if (!expectedPeers.has(peerId)) {
        this.disposeAudioAnalyzer(peerId);
      }
    }

    for (const peer of streams) {
      if (peer.isScreen) {
        continue;
      }

      this.setupAudioAnalyzer(peer);
    }

    this.syncSpeakingDetectionState();
  }

  private syncSpeakingDetectionState() {
    if (this.audioAnalyzers.size === 0) {
      this.stopSpeakingDetection();

      if (this.audioContext?.state === 'running') {
        this.audioContext.suspend().catch(() => undefined);
      }

      return;
    }

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume().catch(() => undefined);
    }

    this.startSpeakingDetection();
  }

  private setupAudioAnalyzer(peerStream: PeerStream) {
    if (!peerStream.stream.getAudioTracks().length) {
      this.disposeAudioAnalyzer(peerStream.peerId);
      return;
    }

    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const streamId = peerStream.stream.id;
      const existing = this.audioAnalyzers.get(peerStream.peerId);
      if (existing?.streamId === streamId) {
        return;
      }
      if (existing) {
        this.disposeAudioAnalyzer(peerStream.peerId);
      }

      const source = this.audioContext.createMediaStreamSource(peerStream.stream);
      const analyzer = this.audioContext.createAnalyser();
      analyzer.fftSize = 1024;
      analyzer.smoothingTimeConstant = 0.8;

      // CRITICAL: Do NOT connect to destination - only analyze, never play back
      source.connect(analyzer);
      // DO NOT: analyzer.connect(this.audioContext.destination);

      this.audioAnalyzers.set(peerStream.peerId, {
        analyzer,
        source,
        streamId,
      });

      console.log(`🎤 Audio analyzer setup for ${peerStream.peerId} (analysis only, no playback)`);
    } catch (err) {
      console.error('Failed to setup audio analyzer:', err);
    }
  }

  private startSpeakingDetection() {
    if (this.speakingDetectionInterval) {
      return;
    }

    // Check audio levels every 100ms
    this.speakingDetectionInterval = setInterval(() => {
      this.detectSpeaking();
    }, 100);
  }

  private stopSpeakingDetection() {
    if (this.speakingDetectionInterval) {
      clearInterval(this.speakingDetectionInterval);
      this.speakingDetectionInterval = undefined;
    }
  }

  private detectSpeaking() {
    let hasChanges = false;

    for (const peer of this.allStreams) {
      if (peer.isScreen) continue;

      const binding = this.audioAnalyzers.get(peer.peerId);
      if (!binding) continue;

      // Skip detection if muted or (local and audio off)
      if (peer.isMuted || (peer.isLocal && !this.audioOn)) {
        const wasSpeaking = peer.isSpeaking;
        peer.isSpeaking = false;
        peer.audioLevel = 0;
        if (wasSpeaking) hasChanges = true;
        continue;
      }

      const dataArray = new Uint8Array(binding.analyzer.frequencyBinCount);
      binding.analyzer.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
      const normalizedLevel = Math.min(100, (average / 512) * 100);

      const wasSpeaking = peer.isSpeaking;
      const threshold = 15; // Speaking threshold

      peer.audioLevel = normalizedLevel;
      peer.isSpeaking = normalizedLevel > threshold;

      if (wasSpeaking !== peer.isSpeaking) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.cdr.markForCheck();
    }
  }

}