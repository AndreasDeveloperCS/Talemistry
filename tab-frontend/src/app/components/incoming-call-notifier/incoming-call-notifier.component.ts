import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../modules/authentication/services/auth.service';
import { DirectCallInvitation, DirectCallType, TextChatService } from '../../modules/interviews/services/text-chat.service';

interface IncomingCallPopup {
    id: string;
    roomId: string;
    roomName?: string;
    chatRoomId?: string;
    callerUserId: string;
    callerName: string;
    callType: DirectCallType;
    initials: string;
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

@Component({
    selector: 'app-incoming-call-notifier',
    templateUrl: './incoming-call-notifier.component.html',
    styleUrl: './incoming-call-notifier.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class IncomingCallNotifierComponent implements OnInit, OnDestroy {
    popups: IncomingCallPopup[] = [];

    private readonly onDestroy$ = new Subject<void>();
    private readonly directCallSessionStorageKey = 'text-chat.direct-call.session';
    private socketInitialized = false;

    constructor(
        private readonly authService: AuthService,
        private readonly textChatService: TextChatService,
        private readonly router: Router,
        private readonly cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.bindSocketLifecycle();

        this.textChatService.onIncomingCalls()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((invitation) => {
                this.showIncomingCallPopup(invitation);
            });

        if (this.authService.isAuthenticated()) {
            this.ensureSocketConnected();
        }
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    acceptIncomingCall(popup: IncomingCallPopup): void {
        this.prepareCallPreferences(popup.callType);

        if (popup.chatRoomId && popup.callerUserId) {
            this.persistDirectCallSessionContext({
                roomId: popup.roomId,
                chatRoomId: popup.chatRoomId,
                counterpartUserId: popup.callerUserId,
                counterpartName: popup.callerName,
                callType: popup.callType,
                role: 'callee',
                startedAt: Date.now(),
            });
        }

        this.closePopup(popup.id);
        this.router.navigate(['/recruitment/communication/room', popup.roomId, 'video-chat']);
    }

    closePopup(id: string): void {
        const popup = this.popups.find((entry) => entry.id === id);
        if (!popup) {
            return;
        }

        popup.closing = true;
        this.cdr.markForCheck();

        setTimeout(() => {
            this.popups = this.popups.filter((entry) => entry.id !== id);
            this.cdr.markForCheck();
        }, 400);
    }

    private bindSocketLifecycle(): void {
        this.authService.loginStatus$
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((isLoggedIn) => {
                if (isLoggedIn) {
                    this.ensureSocketConnected();
                    return;
                }

                this.popups = [];
                this.socketInitialized = false;
                this.textChatService.disconnect();
                this.cdr.markForCheck();
            });
    }

    private ensureSocketConnected(): void {
        if (this.socketInitialized) {
            return;
        }

        this.socketInitialized = true;
        this.textChatService.connect();
    }

    private showIncomingCallPopup(invitation: DirectCallInvitation): void {
        const popupId = `global-call:${invitation.roomId}:${invitation.callerUserId}:${invitation.callType}`;
        if (this.popups.some((popup) => popup.id === popupId)) {
            return;
        }

        const callerName = String(invitation.callerName || invitation.callerEmail || 'Participant').trim();
        const popup: IncomingCallPopup = {
            id: popupId,
            roomId: invitation.roomId,
            roomName: invitation.roomName,
            chatRoomId: invitation.chatRoomId,
            callerUserId: invitation.callerUserId,
            callerName,
            callType: invitation.callType === 'audio' ? 'audio' : 'video',
            initials: this.getInitials(callerName || 'Participant'),
        };

        this.popups = [popup, ...this.popups];
        this.cdr.markForCheck();
    }

    private getInitials(value: string): string {
        const source = String(value || 'EV').trim();
        const parts = source.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }

        return source.slice(0, 2).toUpperCase();
    }

    private prepareCallPreferences(callType: DirectCallType): void {
        try {
            sessionStorage.setItem('rtc.audioEnabled', '1');
            sessionStorage.setItem('rtc.videoEnabled', callType === 'audio' ? '0' : '1');
        } catch {
            // best effort
        }
    }

    private persistDirectCallSessionContext(context: DirectCallSessionContext): void {
        try {
            sessionStorage.setItem(this.directCallSessionStorageKey, JSON.stringify(context));
        } catch {
            // best effort
        }
    }
}