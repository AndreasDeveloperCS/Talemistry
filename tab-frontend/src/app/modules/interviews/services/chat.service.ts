import { Injectable, OnDestroy } from "@angular/core";
import { Subject, BehaviorSubject, Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { ChatMessagePayload } from "../models/chat-message-payload";
import io from 'socket.io-client';
import { isJwtLike, normalizeSocketBase } from "../../general/utils/socket.utils";
type Socket = ReturnType<typeof io>;

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
    private socket?: Socket;
    private roomId?: string;
    private displayName?: string;
    private userEmail?: string;
    private joinToken?: string;
    private hasConnectedOnce = false;

    private messages$ = new Subject<ChatMessagePayload>();
    private typing$ = new Subject<{ from: string; isTyping: boolean }>();
    private peers$ = new BehaviorSubject<string[]>([]);
    private connected$ = new BehaviorSubject<boolean>(false);

    connect(token?: string) {
        if (this.socket?.connected) return;

        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = undefined;
        }

        this.hasConnectedOnce = false;

        const sameOriginBase = (() => {
            try {
                return (typeof window !== 'undefined' && window?.location?.origin)
                    ? String(window.location.origin).trim()
                    : '';
            } catch {
                return '';
            }
        })();

        const base = normalizeSocketBase(environment.wsBase || sameOriginBase);
        const rawPath = environment.wsPath || 'socket.io'; // must match adapter
        const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
        const authToken = isJwtLike(token) ? String(token).trim() : undefined;
        const option: any = {
            path: path,   // must match adapter
            // Start with polling so blocked websocket upgrades do not break the initial connect.
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 500,
            auth: authToken ? { token: authToken } : undefined,
        }
        this.socket = io(`${base}/ws/videotextchat`, option);

        this.socket.on('connect', () => {
            const roomId = this.roomId;
            const shouldRejoinRoom = this.hasConnectedOnce && !!roomId;
            this.hasConnectedOnce = true;
            this.connected$.next(true);

            console.log('videotextchat Connected');
            if (shouldRejoinRoom) {
                this.joinRoom(roomId, this.displayName);
            }
        });
        this.socket.on('disconnect', () => this.connected$.next(false));

        this.socket.on('new-message', (msg: ChatMessagePayload) => this.messages$.next(msg));
        this.socket.on('typing', (p: { from: string; isTyping: boolean }) => this.typing$.next(p));
        this.socket.on('peer-joined', () => this.refreshPeers());
        this.socket.on('peer-left', () => this.refreshPeers());
    }

    setJoinContext(userEmail?: string, joinToken?: string) {
        this.userEmail = String(userEmail ?? '').trim().toLowerCase() || undefined;
        this.joinToken = String(joinToken ?? '').trim() || undefined;
    }

    joinRoom(roomId: string, displayName?: string, userEmail?: string, joinToken?: string) {
        if (!this.socket) {
            throw new Error('Chat socket not connected');
        }

        if (userEmail !== undefined || joinToken !== undefined) {
            this.setJoinContext(userEmail, joinToken);
        }

        console.log('roomId', this.socket, roomId, displayName, this.userEmail, !!this.joinToken);

        this.roomId = roomId;
        this.displayName = displayName;
        this.socket.emit('join-room', { roomId, displayName, userEmail: this.userEmail, joinToken: this.joinToken }, (ack: any) => {
            if (ack?.peers) this.peers$.next(ack.peers);
        });
    }

    leaveRoom() {
        if (!this.socket || !this.roomId) return;
        this.socket.emit('leave-room', { roomId: this.roomId });
        this.roomId = undefined;
        this.displayName = undefined;
        this.userEmail = undefined;
        this.joinToken = undefined;
        this.peers$.next([]);
    }

    disconnect() {
        this.leaveRoom();
        if (!this.socket) return;

        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = undefined;
        this.hasConnectedOnce = false;
        this.connected$.next(false);
    }

    sendMessage(text: string, meta?: any): Promise<ChatMessagePayload | null> {
        console.log('videotextchat sendMessage', text, meta, this.socket, this.roomId);
        if (!this.socket || !this.roomId) {
            return Promise.resolve(null);
        }
        const userId = sessionStorage.getItem(`${environment.storage.userId}`);
        console.log('roomId', text, meta, userId);

        const msgId = (crypto as any).randomUUID?.() ?? String(Date.now());

        return new Promise((resolve) => {
            this.socket!.emit('chat-message', {
                roomId: this.roomId, text, msgId, meta
            }, (ack: any) => {
                resolve(ack?.echo ?? {
                    from: this.socket?.id ?? 'self',
                    text,
                    msgId,
                    meta,
                    sentAt: Date.now(),
                });
            });
        });
    }

    setTyping(isTyping: boolean) {
        if (!this.socket || !this.roomId) return;
        this.socket.emit('typing', { roomId: this.roomId, isTyping });
    }

    readReceipt(msgIds: string[]) {
        if (!this.socket || !this.roomId) return;
        this.socket.emit('read-receipt', { roomId: this.roomId, msgIds });
    }

    private refreshPeers() {
        if (!this.socket || !this.roomId) return;
        this.socket.emit('join-room', {
            roomId: this.roomId,
            displayName: this.displayName,
            userEmail: this.userEmail,
            joinToken: this.joinToken,
        }, (ack: any) => {
            if (ack?.peers) this.peers$.next(ack.peers);
        });
    }

    onMessages(): Observable<ChatMessagePayload | any> { return this.messages$.asObservable(); }
    onTyping(): Observable<{ from: string; isTyping: boolean }> { return this.typing$.asObservable(); }
    peers(): Observable<string[]> { return this.peers$.asObservable(); }
    isConnected(): Observable<boolean> { return this.connected$.asObservable(); }

    ngOnDestroy(): void {
        this.disconnect();
    }
}