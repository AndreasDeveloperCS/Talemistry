import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { ChatRoom } from '../models/chat-room';
import { IChatRoomSummary } from '../models/chat-message-payload';

@Injectable({
    providedIn: 'root'
})
export class ChatRoomService extends CRUDService<ChatRoom> {

    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.chatRoom}`;

    private chatRoomSubject = new BehaviorSubject<ChatRoom[]>([]);

    chatRoomSubject$: Observable<ChatRoom[]> = this.chatRoomSubject.asObservable();

    constructor(http: HttpClient) {
        super(http)
    }

    getByUserIdAsync(userId: string, isProtected: boolean = true): Observable<ChatRoom[] | null> {
        console.log('getByUserIdAsync', userId);
        return this.http.get<ChatRoom[] | null>(`${this.tartgetUrl}/user/${userId}`, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected
        });
    }

    getByParticipantIdAsync(participantId: string, isProtected: boolean = true): Observable<IChatRoomSummary[] | null> {
        console.log('getByParticipantIdAsync', participantId);
        return this.http.get<IChatRoomSummary[] | null>(`${this.tartgetUrl}/participant/${participantId}`, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected
        });
    }
}