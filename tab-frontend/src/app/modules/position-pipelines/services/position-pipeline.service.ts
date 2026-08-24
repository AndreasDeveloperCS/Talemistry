import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { PositionPipeline } from '../models/position-pipeline';
import { DEFAULT_PIPELINE_STAGES, STAGES_NAMES } from '../models/default-pipeline-stages';

@Injectable({
  providedIn: 'root'
})
export class PositionPipelineService extends CRUDService<PositionPipeline> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.positionPipeline}`;

  private positionPipelineSubject = new BehaviorSubject<PositionPipeline[]>([]);

  positionPipelineSubject$: Observable<PositionPipeline[]> = this.positionPipelineSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }

  getPipelineByPositionId(positionId: string, isProtected: boolean = true): Observable<PositionPipeline | any> {
    console.log('getPipelineByPositionId', positionId);

    const apiUrl = `${this.tartgetUrl}/position/${positionId}`;

    return this.http.get<PositionPipeline>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getCurrentPipeline(positionId: any): any {
    return {
      positionId,
    };
  }

  updateStagesOrder(pipelineId: string, orderedStageIds: string[], isProtected: boolean = true): Observable<void> {
    const apiUrl = `${this.tartgetUrl}/${pipelineId}/stages/order`;
    console.log('Updating stages order:', orderedStageIds );
    return this.http.patch<void>(apiUrl, { orderedStageIds },
      {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected,
        observe: "body",
        reportProgress: true,
        responseType: "json",
      }
    );
  }
}

export function normalizeStageName(name: string): STAGES_NAMES {
  return name.toUpperCase().replace(' ', '_') as STAGES_NAMES;
}