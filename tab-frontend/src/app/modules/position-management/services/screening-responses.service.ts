import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { ScreeningResponse } from '../models/screening-response';

@Injectable({
  providedIn: 'root'
})
export class ScreeningResponsesService extends CRUDService<ScreeningResponse> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.screeningResponses}`;

  private screeningResponseSubject = new BehaviorSubject<ScreeningResponse[]>([]);

  screeningResponseSubject$: Observable<ScreeningResponse[]> = this.screeningResponseSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }

  getByFormId(formId: string, isProtected: boolean = true): Observable<ScreeningResponse | any> {
    console.log('getByFormId', formId);

    const apiUrl = `${this.tartgetUrl}/form/${formId}`;

    return this.http.get<ScreeningResponse>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getByTalentIdAsync(talentId: string, isProtected: boolean = true): Observable<ScreeningResponse | any> {
    console.log('getByTalentId', talentId);

    const apiUrl = `${this.tartgetUrl}/talent/${talentId}`;

    return this.http.get<ScreeningResponse>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getByPositionIdTalentIdAsync(positionId: string, talentId: string, isProtected: boolean = true): Observable<ScreeningResponse | any> {
    console.log('getByPositionIdTalentIdAsync', positionId, talentId);

    const apiUrl = `${this.tartgetUrl}/position/${positionId}/talent/${talentId}`;

    return this.http.get<ScreeningResponse>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getAllByFormId(formId: string, isProtected: boolean = true): Observable<ScreeningResponse[] | any> {
    console.log('getAllByFormId', formId);

    const apiUrl = `${this.tartgetUrl}/all-responses/form/${formId}`;

    return this.http.get<ScreeningResponse[]>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }
}