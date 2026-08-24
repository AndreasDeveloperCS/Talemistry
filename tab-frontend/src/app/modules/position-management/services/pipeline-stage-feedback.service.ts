import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { PipelineStageFeedback } from '../models/pipeline-stage-feedback';

@Injectable({
  providedIn: 'root'
})
export class PipelineStageFeedbacksService extends CRUDService<PipelineStageFeedback> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.pipelineStageFeedbacks}`;

  private pipelineStageFeedbackSubject = new BehaviorSubject<PipelineStageFeedback[]>([]);

  pipelineStageFeedbackSubject$: Observable<PipelineStageFeedback[]> = this.pipelineStageFeedbackSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }

  getFeedbackByPipelineProgressId(pipelineProgressId: string, isProtected: boolean = true): Observable<PipelineStageFeedback[] | any> {
    const apiUrl = `${this.tartgetUrl}/by-progress/${pipelineProgressId}`;

    return this.http.get<PipelineStageFeedback[]>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }
}