import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { IScreeningForm, ScreeningForm } from '../models/screening-form';
import { Filtering, PaginatedResource, Sorting } from '../../general/services/search-logic.service';
import { ScreeningFormInfo } from '../interfaces/screening-form-position-info';

@Injectable({
  providedIn: 'root'
})
export class ScreeningFormsService extends CRUDService<ScreeningForm> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.screeningForms}`;

  private screeningFormSubject = new BehaviorSubject<ScreeningForm[]>([]);

  screeningFormSubject$: Observable<ScreeningForm[]> = this.screeningFormSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }

  getFormByPositionId(positionId: string, isProtected: boolean = true): Observable<IScreeningForm | any> {
    console.log('getFormByPositionId', positionId);

    const apiUrl = `${this.tartgetUrl}/position/${positionId}`;

    return this.http.get<IScreeningForm>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getFormsByUserId(userId: string, isProtected: boolean = true): Observable<ScreeningForm[] | any> {
    console.log('getFormsByUserId', userId);

    const apiUrl = `${this.tartgetUrl}/user/${userId}`;

    return this.http.get<ScreeningForm[]>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getAllFormPositionInfoAsync(
    pageSize: number,
    pageIndex: number,
    sorting: Sorting,
    filtering: Filtering,
    isProtected: boolean = true,
    pushSubject: boolean = true
  ): Observable<PaginatedResource<ScreeningFormInfo>> {
    console.log('getAllFormPositionInfoAsync', this.tartgetUrl);

    const url = `${this.tartgetUrl}/form-position-info?page=${pageIndex}&size=${pageSize}&sortParams=${encodeURIComponent(JSON.stringify(sorting))}&filterParams=${encodeURIComponent(JSON.stringify(filtering))}`;
    const request = this.http.get<PaginatedResource<ScreeningFormInfo>>(url, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });

    if (pushSubject) {
      request.pipe(take(1)).subscribe((result: any) => {
        this.dataSubject.next(result);
      });
    }
    return request;
  }
}