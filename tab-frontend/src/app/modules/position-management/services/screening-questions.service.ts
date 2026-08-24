import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { ScreeningQuestion } from '../models/screening-question';
import { ScreeningForm } from '../models/screening-form';

@Injectable({
  providedIn: 'root'
})
export class ScreeningQuestionsService extends CRUDService<ScreeningQuestion> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.screeningQuestions}`;

  private screeningQuestionSubject = new BehaviorSubject<ScreeningQuestion[]>([]);

  screeningQuestionSubject$: Observable<ScreeningQuestion[]> = this.screeningQuestionSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }

  getQuestionsByFormId(formId: string, isProtected: boolean = true): Observable<ScreeningQuestion[] | any> {
    console.log('getQuestionsByFormId', formId);

    const apiUrl = `${this.tartgetUrl}/form/${formId}`;

    return this.http.get<ScreeningQuestion[]>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getQuestionsByUserId(userId: string, isProtected: boolean = true): Observable<ScreeningQuestion[] | any> {
    console.log('getQuestionsByUserId', userId);

    const apiUrl = `${this.tartgetUrl}/user/${userId}`;

    return this.http.get<ScreeningQuestion[]>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }
}