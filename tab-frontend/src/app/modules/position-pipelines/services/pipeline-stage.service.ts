import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { PositionPipeline } from '../models/position-pipeline';
import { PipelineStage } from '../models/pipeline-stage';

@Injectable({
  providedIn: 'root'
})
export class PipelineStageService extends CRUDService<PipelineStage> {
  
  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.pipelineStage}`;

  private pipelineStageSubject = new BehaviorSubject<PipelineStage[]>([]);
  
  pipelineStageSubject$:Observable<PipelineStage[]> = this.pipelineStageSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http)
  }
}