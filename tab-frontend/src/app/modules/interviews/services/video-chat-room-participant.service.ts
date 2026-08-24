import { Injectable } from '@angular/core';
import { CRUDService } from '../../general/services/crud.service';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { VideoChatRoomParticipant } from '../models/video-chat-room-participant';

@Injectable({
    providedIn: 'root'
})
export class VideoChatRoomParticipantService extends CRUDService<VideoChatRoomParticipant> {

    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.videoChatRoomParticipant}`;

    private videoChatRoomParticipantSubject = new BehaviorSubject<VideoChatRoomParticipant[]>([]);

    videoChatRoomParticipantSubject$: Observable<VideoChatRoomParticipant[]> = this.videoChatRoomParticipantSubject.asObservable();

    constructor(http: HttpClient) {
        super(http)
    }

    getAll(isProtected: boolean = true): Observable<VideoChatRoomParticipant[] | null> {
        const request = this.http.get<VideoChatRoomParticipant[]>(`${this.tartgetUrl}/all`, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected
        });
        return request;
    }
}