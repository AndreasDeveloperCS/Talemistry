import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class VideoInterviewService {
    private socket: Socket | null = null;
    private signalSubject = new Subject<any>();
    private participantSubject = new Subject<any>();

    connect(url: string = '/', opts: any = {}): void {
        console.log('VideoInterviewService Connecting to', url, 'with options', opts);

        if (this.socket) return;
        this.socket = io(url, opts);

        this.socket.on('connect', () => {
            // console.log('connected', this.socket?.id);
        });

        this.socket.on('signal', (payload: any) => {
            this.signalSubject.next(payload);
        });

        this.socket.on('participant-joined', (p: any) => this.participantSubject.next({ type: 'joined', payload: p }));
        this.socket.on('participant-left', (p: any) => this.participantSubject.next({ type: 'left', payload: p }));
    }

    disconnect(): void {
        if (!this.socket) return;
        this.socket.disconnect();
        this.socket = null;
    }

    join(room: string, userId?: string) {
        this.socket?.emit('join', { room, userId });
    }

    leave(room: string) {
        this.socket?.emit('leave', { room });
    }

    sendSignal(room: string, data: any) {
        this.socket?.emit('signal', { room, data });
    }

    onSignal(): Observable<any> {
        return this.signalSubject.asObservable();
    }

    onParticipant(): Observable<any> {
        return this.participantSubject.asObservable();
    }
}
