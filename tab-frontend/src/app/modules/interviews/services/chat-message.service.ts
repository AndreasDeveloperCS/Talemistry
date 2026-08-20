import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, retry, take, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NotificationChannelId } from '../../communication/models/notification-channel';
import { CRUDService } from '../../general/services/crud.service';
import { UserProfileService } from '../../profiles/user-profile/services/user-profile.service';
import { ChatMessage } from '../models/chat-message';
import { CommunicationMean } from '../models/communication-mean';

@Injectable({
    providedIn: 'root'
})
export class ChatMessageService extends CRUDService<ChatMessage> {

    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.chatMessage}`;
    private chatMessageSubject = new BehaviorSubject<ChatMessage[]>([]);
    chatMessageSubject$: Observable<ChatMessage[]> = this.chatMessageSubject.asObservable();

    public defaultCommunicationMeans: CommunicationMean[] = [
        CommunicationMean.email,
        CommunicationMean.sms,
    ];

    constructor(http: HttpClient,
        private userProfileService: UserProfileService) {
        super(http)
    }

    getByRoomIdAsync(roomId: string, isProtected: boolean = true): Observable<ChatMessage[] | null> {
        console.log('getByRoomIdAsync', roomId);
        return this.http.get<ChatMessage[] | null>(`${this.tartgetUrl}/room/${roomId}`, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected
        });
    }

    getRecentByRoomId(
        roomId: string,
        limit: number = 10,
        before?: string,
        beforeId?: string,
        isProtected: boolean = true
    ): Observable<{ items: ChatMessage[]; hasMore: boolean }> {
        let url = `${this.tartgetUrl}/room/${encodeURIComponent(roomId)}/recent?limit=${limit}`;
        if (before) {
            url += `&before=${encodeURIComponent(before)}`;
        }
        if (beforeId) {
            url += `&beforeId=${encodeURIComponent(beforeId)}`;
        }
        return this.http.get<{ items: ChatMessage[]; hasMore: boolean }>(url, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected
        }).pipe(
            timeout(8000),
            retry({ count: 2, delay: 300 })
        );
    }

    getPreferredCommunicationMeans(
        contactId: string,
        fallback: CommunicationMean[]
    ): Observable<CommunicationMean[]> {
        if (!contactId) {
            return of([...fallback]);
        }

        return this.userProfileService.getMessagePreferencesById(contactId, true).pipe(
            map(res => {
                if (res?.channels) {
                    return Object.keys(res.channels)
                        .filter(k => res.channels[k as NotificationChannelId])
                        .map(k => k as CommunicationMean);
                }

                return [...fallback];
            }),
            catchError(err => {
                // Message preferences are optional.
                // Some deployments may not expose this endpoint yet; don't spam the console.
                if (err?.status === 404) {
                    return of([...fallback]);
                }

                if (!environment.production && (environment as any).showDebugginLogs) {
                    // Keep visibility in dev only.
                    console.warn('Error getting message preferences', err);
                }
                return of([...fallback]);
            })
        );
    }

    markAsRead(msgId: string, isProtected: boolean = true): Observable<ChatMessage> {
        const url = `${this.tartgetUrl}/${msgId}/read`;

        const request = this.http.patch<any>(url, {},
            {
                headers: this.getHttpHeaders(isProtected),
                withCredentials: isProtected
            });

        return request;
    }

    createNewStageMessageAsync(entity: ChatMessage, isProtected: boolean = true, pushSubject: boolean = true): Observable<ChatMessage> {
        console.log('createAsync', this.tartgetUrl);
        console.log('Entity', entity);

        const url = `${this.tartgetUrl}/new-stage-message`;

        const request = this.http.post<any>(url, entity,
            {
                headers: this.getHttpHeaders(isProtected),
                withCredentials: isProtected,
                observe: "body",
                reportProgress: true,
                responseType: "json",
            });

        if (pushSubject) {
            request.pipe(take(1)).subscribe((result: any) => {
                this.refreshDataBehaviorSubject.next(true);
                this.refreshData.next(true);
            });
        }

        return request;
    }
}