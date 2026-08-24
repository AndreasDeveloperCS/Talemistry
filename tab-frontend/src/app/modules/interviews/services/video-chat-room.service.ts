import { Injectable } from '@angular/core';
import { VideoChatRoom } from '../models/video-chat-room';
import { CRUDService } from '../../general/services/crud.service';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class VideoChatRoomService extends CRUDService<VideoChatRoom> {

    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.videoChatRoom}`;

    private videoChatRoomSubject = new BehaviorSubject<VideoChatRoom[]>([]);

    videoChatRoomSubject$: Observable<VideoChatRoom[]> = this.videoChatRoomSubject.asObservable();

    constructor(http: HttpClient) {
        super(http)
    }

    joinByTokenAsync(roomId: string, token: string): Observable<VideoChatRoom> {
        const id = String(roomId ?? '').trim();
        const t = String(token ?? '').trim();

        // Join-by-token should work for:
        // - authenticated platform accounts (so backend can append caller email to participants)
        // - unauthenticated/guest joins via public link (backend will validate token only)
        // Detect auth token from sessionStorage instead of relying on a cached service field.
        const userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
        const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`)
            ?? sessionStorage.getItem(`${environment.storage.token}`)
            ?? '';
        const isProtected = !!String(idToken).trim();

        const url = `${this.tartgetUrl}/${encodeURIComponent(id)}/join?token=${encodeURIComponent(t)}`;
        console.log('[RTC🔍 REST] joinByTokenAsync', { url, isProtected, roomId: id, hasToken: !!t });

        // Join-by-token supports both authenticated users and guests.
        // If authenticated, we send Authorization so the backend can append our email
        // to room participants. If not, token-only join still works.

        return this.http.get<VideoChatRoom>(
            url,
            {
                headers: this.getHttpHeaders(isProtected),
                // Do NOT send cookies for join-by-token.
                // This endpoint is authenticated via Authorization header (when present) and/or join token.
                // If a proxy incorrectly returns `Access-Control-Allow-Origin: *`, credentialed requests
                // are blocked by browsers. Keeping this non-credentialed avoids that entire class of failures.
                withCredentials: isProtected,
            },
        );
    }

    /**
     * Fetch room by ID, passing an optional join token for authorization.
     * Falls back to the standard getById when no token is provided.
     * The backend getById endpoint accepts `?token=` and will auto-admit the user.
     */
    getByIdWithTokenAsync(roomId: string, token?: string): Observable<VideoChatRoom> {
        const id = String(roomId ?? '').trim();
        const t = String(token ?? '').trim();

        const userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
        const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`)
            ?? sessionStorage.getItem(`${environment.storage.token}`)
            ?? '';
        const isProtected = !!String(idToken).trim();

        const url = t
            ? `${this.tartgetUrl}/${encodeURIComponent(id)}?token=${encodeURIComponent(t)}`
            : `${this.tartgetUrl}/${encodeURIComponent(id)}`;

        console.log('[RTC🔍 REST] getByIdWithTokenAsync', { url, isProtected, roomId: id, hasToken: !!t });

        return this.http.get<VideoChatRoom>(url, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected,
        });
    }
}
