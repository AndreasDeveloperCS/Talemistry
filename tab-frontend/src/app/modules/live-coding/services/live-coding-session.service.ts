import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { LiveCodingSession } from '../models/live-coding-session.model';

@Injectable({
  providedIn: 'root'
})
export class LiveCodingSessionService extends CRUDService<LiveCodingSession> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.liveCodingSessions}`;

  private liveCodingSessionssSubject = new BehaviorSubject<LiveCodingSession[]>([]);

  liveCodingSessionssSubject$: Observable<LiveCodingSession[]> = this.liveCodingSessionssSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http)
  }
}