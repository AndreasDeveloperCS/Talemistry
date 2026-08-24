import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { MeetingTemplate } from '../models/meeting-template';

@Injectable({
  providedIn: 'root'
})
export class MeetingTemplatesService extends CRUDService<MeetingTemplate> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.meetingTemplates}`;

  private meetingTemplateSubject = new BehaviorSubject<MeetingTemplate[]>([]);

  meetingTemplateSubject$: Observable<MeetingTemplate[]> = this.meetingTemplateSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }

  getByPositionId(positionId: string, isProtected: boolean = true): Observable<MeetingTemplate[] | any> {
    console.log('getByPositionId', positionId);

    const apiUrl = `${this.tartgetUrl}/position/${positionId}`;

    return this.http.get<MeetingTemplate[]>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getByUserId(userId: string, isProtected: boolean = true): Observable<MeetingTemplate[] | any> {
    console.log('getByUserId', userId);

    const apiUrl = `${this.tartgetUrl}/user/${userId}`;

    return this.http.get<MeetingTemplate[]>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }
}