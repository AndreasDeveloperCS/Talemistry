import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { RecommendedQuestionsRequest, RecommendedQuestionsResponse, ScreeningQuestionTemplate } from '../models/screening-question-templates';

@Injectable({
  providedIn: 'root'
})
export class ScreeningQuestionTemplatesService extends CRUDService<ScreeningQuestionTemplate> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.screeningQuestionTemplates}`;

  private screeningQuestionTemplateSubject = new BehaviorSubject<ScreeningQuestionTemplate[]>([]);

  screeningQuestionTemplateSubject$: Observable<ScreeningQuestionTemplate[]> = this.screeningQuestionTemplateSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }

  getRecommendedQuestions(positionTitle: string, isProtected: boolean = true): Observable<RecommendedQuestionsResponse[] | any> {
    console.log('getRecommendedQuestions', positionTitle);

    const apiUrl = `${this.tartgetUrl}/recommended/positionTitle/${encodeURIComponent(positionTitle)}`;

    return this.http.get<RecommendedQuestionsResponse[]>(
      apiUrl, 
      {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected,
      }
    );
  }
}