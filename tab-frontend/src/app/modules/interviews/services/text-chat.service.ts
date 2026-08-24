import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import io from "socket.io-client";
import { environment } from "../../../../environments/environment";
import { NotificationTemplate } from "../../pipeline-board/enums/notification-templates.enum";
import { IChatMessageResponse } from "../models/chat-message-payload";
import { CommunicationMean } from "../models/communication-mean";
import { ChatMessage } from "../models/chat-message";

type Socket = ReturnType<typeof io>;

export type DirectCallType = 'audio' | 'video';

export interface DirectCallInvitePayload {
  roomId: string;
  targetUserId: string;
  chatRoomId?: string;
  roomName?: string;
  callType: DirectCallType;
  selectedCommunicationMeans?: CommunicationMean[];
}

export interface RoomCallInvitePayload {
  roomId: string;
  roomName?: string;
  callType: DirectCallType;
}

export interface DirectCallInvitation {
  roomId: string;
  chatRoomId?: string;
  roomName?: string;
  callType: DirectCallType;
  callerUserId: string;
  callerName?: string;
  callerEmail?: string;
  sentAt: number;
}

export interface DirectCallInviteNotificationResult {
  channel: 'sms' | 'email' | 'telegram' | 'whatsapp';
  success: boolean;
  skipped?: boolean;
  reason?: string;
}

export interface DirectCallInviteAck {
  ok: boolean;
  delivered?: boolean;
  notificationResults?: DirectCallInviteNotificationResult[];
  notifiedParticipantCount?: number;
  deliveredToOnlineCount?: number;
  skippedParticipantCount?: number;
}

@Injectable({ providedIn: "root" })
export class TextChatService implements OnDestroy {

  private socket?: Socket;
  private roomId?: string;

  private normalizeSocketBase(value: unknown): string {
    try {
      const raw = String(value ?? '').trim();
      if (!raw) return '';

      if (/^https?:\/\//i.test(raw)) {
        return new URL(raw).origin.replace(/\/+$/, '');
      }

      if (typeof window !== 'undefined' && window?.location?.origin) {
        return new URL(raw, window.location.origin).origin.replace(/\/+$/, '');
      }

      return raw.replace(/\/+$/, '');
    } catch {
      return String(value ?? '').trim().replace(/\/+$/, '');
    }
  }

  private readAuthToken(explicitToken?: string): string | undefined {
    const provided = String(explicitToken ?? '').trim();
    if (provided) {
      return provided;
    }

    try {
      const userId = String(sessionStorage.getItem(`${environment.storage.userId}`) ?? '').trim();
      const byUserId = userId
        ? String(sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`) ?? '').trim()
        : '';
      const direct = String(sessionStorage.getItem(`${environment.storage.token}`) ?? '').trim();
      return byUserId || direct || undefined;
    } catch {
      return undefined;
    }
  }

  private messages$ = new Subject<IChatMessageResponse>();
  private typing$ = new Subject<{ userId: string; isTyping: boolean }>();
  private read$ = new Subject<{ userId: string; roomId: string; messageIds: string[] }>();
  private incomingCall$ = new Subject<DirectCallInvitation>();

  private connected$ = new BehaviorSubject<boolean>(false);

  private emitWithAck<T>(eventName: string, payload: unknown, timeoutMs = 6000): Promise<T | null> {
    if (!this.socket) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      let settled = false;
      const timer = globalThis.setTimeout(() => {
        if (settled) {
          return;
        }

        settled = true;
        console.warn(`Socket ack timeout for ${eventName}`);
        resolve(null);
      }, timeoutMs);

      this.socket!.emit(eventName, payload, (ack: T | null) => {
        if (settled) {
          return;
        }

        settled = true;
        globalThis.clearTimeout(timer);
        resolve(ack ?? null);
      });
    });
  }

  connect(token?: string) {

    if (this.socket?.connected) {
      return;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = undefined;
    }

    const sameOriginBase = (() => {
      try {
        return (typeof window !== 'undefined' && window?.location?.origin)
          ? String(window.location.origin).trim()
          : '';
      } catch {
        return '';
      }
    })();

    const base = this.normalizeSocketBase(environment.wsBase || sameOriginBase);
    const rawPath = environment.wsPath || 'socket.io';
    const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    const authToken = this.readAuthToken(token);

    this.socket = io(`${base}/ws/textchat`, {
      path,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      auth: authToken ? { token: authToken } : undefined
    });

    this.socket.on("connect", () => {
      this.connected$.next(true);
      console.log('Connected');
      if (this.roomId) {
        this.joinRoom(this.roomId);
      }
    });

    this.socket.on("connect_error", (err: any) => {
      console.error("Socket connect error:", err);
    });

    this.socket.on('reconnect', () => {
      console.log('Socket reconnected, rejoining room...');
      if (this.roomId) {
        this.joinRoom(this.roomId);
      }
    });

    this.socket.on("disconnect", () => {
      this.connected$.next(false);
    });

    this.socket.on("new-message", (msg: IChatMessageResponse) => {
      console.log('New message', msg);
      this.messages$.next(msg);
    });

    this.socket.on("typing", (data: { userId: string; isTyping: boolean }) => {
      this.typing$.next(data);
    });

    this.socket.on("messages-read", (data: { userId: string; roomId: string; messageIds: string[] }) => {
      this.read$.next(data);
    });

    this.socket.on('incoming-call', (data: DirectCallInvitation) => {
      this.incomingCall$.next(data);
    });

  }

  joinRoom(roomId: string) {

    if (!this.socket) {
      throw new Error("Socket not connected");
    }

    this.roomId = roomId;

    console.log('Join Room', this.socket, this.roomId);

    this.socket.emit("join-room", { roomId });
  }

  leaveRoom() {

    if (!this.socket || !this.roomId) {
      return;
    }

    console.log('Leave Room', this.roomId);

    this.socket.emit("leave-room", { roomId: this.roomId });

    this.roomId = undefined;
  }

  sendMessage(
    content: string,
    receiverId: string,
    communicationMeans?: CommunicationMean[],
    templateName?: NotificationTemplate
  ): Promise<ChatMessage | IChatMessageResponse | null> {

    if (!this.socket || !this.roomId) {
      return Promise.resolve(null);
    }

    const msgId =
      (crypto as any).randomUUID?.() ?? String(Date.now());

    return new Promise((resolve) => {

      this.socket!.emit(
        "send-message",
        {
          roomId: this.roomId,
          content,
          receiverId,
          communicationMeans,
          templateName,
          msgId
        },
        (ack: any) => {
          console.log("ACK", ack);

          if (!ack || !ack.ok) {
            resolve(null);
            return;
          }

          resolve(ack.message);
        }
      );

    });

  }

  setTyping(isTyping: boolean) {

    if (!this.socket || !this.roomId) return;

    this.socket.emit("typing", {
      roomId: this.roomId,
      isTyping
    });
  }

  markMessagesRead(messageIds: string[]): void {
    if (!this.socket || !this.roomId || !messageIds.length) {
      return;
    }

    this.socket.emit("read-messages", {
      roomId: this.roomId,
      messageIds
    });
  }

  sendDirectCallInvite(payload: DirectCallInvitePayload): Promise<DirectCallInviteAck | null> {
    return this.emitWithAck<DirectCallInviteAck>('direct-call-invite', payload);
  }

  sendRoomCallInvite(payload: RoomCallInvitePayload): Promise<DirectCallInviteAck | null> {
    return this.emitWithAck<DirectCallInviteAck>('room-call-invite', payload);
  }

  onMessages(): Observable<IChatMessageResponse> {
    return this.messages$.asObservable();
  }

  onTyping(): Observable<{ userId: string; isTyping: boolean }> {
    return this.typing$.asObservable();
  }

  onMessagesRead(): Observable<{ userId: string; roomId: string; messageIds: string[] }> {
    return this.read$.asObservable();
  }

  onIncomingCalls(): Observable<DirectCallInvitation> {
    return this.incomingCall$.asObservable();
  }

  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  disconnect(): void {
    this.leaveRoom();
    this.socket?.disconnect();
    this.socket = undefined;
    this.connected$.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}