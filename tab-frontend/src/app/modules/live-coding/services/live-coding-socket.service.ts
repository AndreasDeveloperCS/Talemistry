// live-coding-socket.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable, Subject } from 'rxjs';
import io from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { isJwtLike, normalizeSocketBase } from '../../general/utils/socket.utils';
import { ClipboardEventType, FocusEventType } from '../models/live-coding.model';
import { SqlExecutionContext } from '../models/sql-execution-context';
type Socket = ReturnType<typeof io>;

@Injectable({
  providedIn: 'root'
})
export class LiveCodingSocketService {
    private socket?: Socket;
    private roomId?: string;
    private displayName?: string;
    private userEmail?: string;
    private joinToken?: string;
    private hasConnectedOnce = false;
    userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';

    private code$ = new Subject<any>();
    private output$ = new Subject<any>();
    private peers$ = new BehaviorSubject<string[]>([]);
    private connected$ = new BehaviorSubject<boolean>(false);
    private cursorMove$ = new BehaviorSubject<{ position: { lineNumber: number, column: number }, userId: string }>({ position: { lineNumber: 0, column: 0 }, userId: '' });
    private languageChange$ = new BehaviorSubject<{ language: string, userId: string }>({ language: 'javascript', userId: this.userId });
    private clipboardUsage$ = new BehaviorSubject<{ userId: string }>({ userId: '' });
    private focusChange$ = new BehaviorSubject<{ userId: string }>({ userId: '' });

    connect(token?: string) {
        if (this.socket?.connected) {
            return;
        }

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
        const rawPath = environment.wsPath || 'socket.io'; 
        const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
        const authToken = isJwtLike(token) ? String(token).trim() : undefined;
        const option: any = {
            path: path,   
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 500,
            auth: authToken ? { token: authToken } : undefined,
        }
        this.socket = io(`${base}/ws/livecoding`, option);
        if (!this.socket) {
            return;
        }

        this.socket.on('connect', () => {
            const roomId = this.roomId;
            const shouldRejoinRoom = this.hasConnectedOnce && !!roomId;
            this.hasConnectedOnce = true;
            this.connected$.next(true);

            console.log('livecoding Connected');
            if (shouldRejoinRoom) {
                this.joinRoom(roomId, this.displayName);
            }
        });
        this.socket.on('disconnect', () => this.connected$.next(false));
        this.socket.off('codeUpdate');
        this.socket.on('codeUpdate', (code: any) => {
            console.log('Received code update', code);
            this.code$.next(code);
        });

        this.socket.on('codeOutput', (code: any) => {
            console.log('Received code output', code);
            this.output$.next(code);
        });

        this.socket.on('remoteCursorMove', (data: any) => {
            console.log('Received remote cursor move', data);
            this.cursorMove$.next(data);
        });

        this.socket.on('remoteLanguageChange', (data: any) => {
            console.log('Received remote language change', data);
            this.languageChange$.next(data);
        });

        this.socket.on('interview:clipboard', (data: any) => {
            console.log('Received interview:clipboard', data);
            this.clipboardUsage$.next(data);
        });

        this.socket.on('interview:focus', (data: any) => {
            console.log('Received interview:focus', data);
            this.focusChange$.next(data);
        });
    }

    setJoinContext(userEmail?: string, joinToken?: string) {
        this.userEmail = String(userEmail ?? '').trim().toLowerCase() || undefined;
        this.joinToken = String(joinToken ?? '').trim() || undefined;
    }

    joinRoom(roomId: string, joinToken?: string, displayName?: string, userEmail?: string) {
        if (!this.socket) {
            throw new Error('Chat socket not connected');
        }

        if (userEmail !== undefined || joinToken !== undefined) {
            this.setJoinContext(userEmail, joinToken);
        }

        console.log('roomId', this.socket, roomId, displayName, this.userEmail, !!this.joinToken);

        this.roomId = roomId;
        this.displayName = displayName;
        this.socket.emit('joinRoom', { roomId, displayName, userEmail: this.userEmail, joinToken: this.joinToken }, (ack: any) => {
            if (ack?.peers) this.peers$.next(ack.peers);
        });
    }

    sendCodeChange(data: { roomId: string; code: string }) {
        if (!this.socket) {
            return;
        }
        this.socket.emit('codeChange', {
            roomId: data.roomId,
            code: data.code
        });
    }

    sendClipboardEvent(data: { type: ClipboardEventType; length?: number }) {
        if (!this.socket) {
            return;
        }
        this.socket.emit('interview:clipboard', {
            type: data.type,
            length: data.length,
            timestamp: Date.now(),
            userId: this.userId,
            roomId: this.roomId
        });
    }

    sendChangeFocusEvent(data: { type: FocusEventType }) {
        if (!this.socket) {
            return;
        }
        this.socket.emit('interview:focus', {
            type: data.type,
            userId: this.userId,
            timestamp: Date.now(),
            roomId: this.roomId
        });
    }

    sendLanguageChange(data: { roomId: string; language: string }) {
        if (!this.socket) {
            return;
        }
        this.socket.emit('languageChange', {
            roomId: data.roomId,
            language: data.language
        });
    }

    runCode(payload: { code: string; language: string; roomId: string, sqlContext?: SqlExecutionContext }) {
        if (!this.socket) {
            return;
        }
        this.socket.emit('runCode', payload);
    }

    sendCursorMove(payload: { roomId: string; position: { lineNumber: number; column: number } }) {
        if (!this.socket) {
            return;
        }
        this.socket.emit('cursorMove', payload);
    }

    onRemoteCursorMove() {
        if (!this.socket) return; 
        return fromEvent(this.socket, 'remoteCursorMove');
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
        this.code$.next('');  
        this.peers$.next([]);
    }

    onCodeUpdate(): Observable<any> { return this.code$.asObservable(); }
    onLanguageChange(): Observable<any> { return this.languageChange$.asObservable(); }
    onClipboardUsage(): Observable<any> { return this.clipboardUsage$.asObservable(); }
    onFocusChange(): Observable<any> { return this.focusChange$.asObservable(); }
    onCodeOutput(): Observable<any> { return this.output$.asObservable(); }
    onCursorMove(): Observable<any> { return this.cursorMove$.asObservable(); }
    isConnected(): Observable<boolean> { return this.connected$.asObservable(); }

    ngOnDestroy(): void {
        this.disconnect();
    }
}