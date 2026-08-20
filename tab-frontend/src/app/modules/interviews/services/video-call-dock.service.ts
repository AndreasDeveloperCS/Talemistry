import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface VideoCallDockState {
    active: boolean;
    roomId: string;
    roomName: string;
    participantCount: number;
    returnUrl: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
    speakersEnabled: boolean;
    isAudioOnlyMode: boolean;
}

const initialVideoCallDockState: VideoCallDockState = {
    active: false,
    roomId: '',
    roomName: '',
    participantCount: 0,
    returnUrl: '',
    audioEnabled: true,
    videoEnabled: true,
    speakersEnabled: true,
    isAudioOnlyMode: false,
};

@Injectable({
    providedIn: 'root'
})
export class VideoCallDockService {
    private readonly stateSubject = new BehaviorSubject<VideoCallDockState>(initialVideoCallDockState);
    private readonly endCallSubject = new Subject<void>();

    readonly state$ = this.stateSubject.asObservable();
    readonly endCallRequests$ = this.endCallSubject.asObservable();

    get snapshot(): VideoCallDockState {
        return this.stateSubject.value;
    }

    update(patch: Partial<VideoCallDockState>): void {
        this.stateSubject.next({
            ...this.stateSubject.value,
            ...patch,
        });
    }

    activate(next: Omit<VideoCallDockState, 'active'>): void {
        this.stateSubject.next({
            ...next,
            active: true,
        });
    }

    clear(): void {
        this.stateSubject.next(initialVideoCallDockState);
    }

    requestEndCall(): void {
        this.endCallSubject.next();
    }
}