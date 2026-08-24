import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { MeetingInvitation } from '../models/meeting-invitation';

@Injectable({
  providedIn: 'root'
})
export class MeetingInvitationsService extends CRUDService<MeetingInvitation> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.meetingInvitations}`;

  private meetingInvitationSubject = new BehaviorSubject<MeetingInvitation[]>([]);

  meetingInvitationSubject$: Observable<MeetingInvitation[]> = this.meetingInvitationSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }

  getByPositionId(positionId: string, isProtected: boolean = true): Observable<MeetingInvitation[] | any> {
    console.log('getByPositionId', positionId);

    const apiUrl = `${this.tartgetUrl}/position/${positionId}`;

    return this.http.get<MeetingInvitation[]>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getByBookingToken(bookingToken: string, isProtected: boolean = true): Observable<MeetingInvitation | any> {
    console.log('getByBookingToken', bookingToken);

    const apiUrl = `${this.tartgetUrl}/booking-token/${bookingToken}`;

    return this.http.get<MeetingInvitation>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getByUserId(userId: string, isProtected: boolean = true): Observable<MeetingInvitation[] | any> {
    console.log('getByUserId', userId);

    const apiUrl = `${this.tartgetUrl}/user/${userId}`;

    return this.http.get<MeetingInvitation[]>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getByPositionIdTalentId(positionId: string, talentId: string, isProtected: boolean = true): Observable<MeetingInvitation | any> {
    console.log('getByPositionIdTalentId', positionId, talentId);

    const apiUrl = `${this.tartgetUrl}/position/${positionId}/talent/${talentId}`;

    return this.http.get<MeetingInvitation>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }
}