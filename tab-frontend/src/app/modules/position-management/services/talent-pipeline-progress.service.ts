import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { Filtering, PaginatedResource, Sorting } from '../../general/services/search-logic.service';
import { EnrichedAppliedPositionsProgress, IApplicantsByStage, ITalentPipelineProgressGroup, ITalentPipelineStagesGroup, TalentPipelineProgress } from '../models/talent-pipeline-progress';
import { StageType } from '../../position-pipelines/models/pipeline-stage';

@Injectable({
  providedIn: 'root'
})
export class TalentPipelineProgressService extends CRUDService<TalentPipelineProgress> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.talentPipelineProgress}`;

  private talentPipelineProgressSubject = new BehaviorSubject<TalentPipelineProgress[]>([]);

  talentPipelineProgressSubject$: Observable<TalentPipelineProgress[]> = this.talentPipelineProgressSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }

  getPipelineProgressByPositionId(positionId: string, isProtected: boolean = true): Observable<ITalentPipelineProgressGroup | any> {
    const apiUrl = `${this.tartgetUrl}/position/${positionId}/full`;

    return this.http.get<ITalentPipelineProgressGroup>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getPipelineProgressByPositionStageType(positionId: string, stageType: StageType, isProtected: boolean = true): Observable<IApplicantsByStage | any> {
    const apiUrl = `${this.tartgetUrl}/position/${positionId}/stage/${stageType}`;

    return this.http.get<IApplicantsByStage>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getPipelineProgressByStageType(stageType: StageType, isProtected: boolean = true): Observable<IApplicantsByStage | any> {
    const apiUrl = `${this.tartgetUrl}/stage/${stageType}`;

    return this.http.get<IApplicantsByStage>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getPipelineProgressByTalentId(talentId: string, isProtected: boolean = true): Observable<ITalentPipelineProgressGroup[]> {
    const apiUrl = `${this.tartgetUrl}/talent/${talentId}/full`;

    return this.http.get<ITalentPipelineProgressGroup[]>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getPipelineProgressByTalentIdPositionId(talentId: string, positionId: string, isProtected: boolean = true): Observable<ITalentPipelineProgressGroup | any> {
    const apiUrl = `${this.tartgetUrl}/talent/${talentId}/position/${positionId}/full`;

    return this.http.get<ITalentPipelineProgressGroup>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getGroupedTalentPipelineStagesByPositionId(positionId: string, isProtected: boolean = true): Observable<ITalentPipelineStagesGroup | any> {
    const apiUrl = `${this.tartgetUrl}/position/${positionId}/grouped`;

    return this.http.get<ITalentPipelineStagesGroup>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getTalentPipelineStagesByPositionId(talentId: string, positionId: string, isProtected: boolean = true): Observable<ITalentPipelineStagesGroup | any> {
    const apiUrl = `${this.tartgetUrl}/talent/${talentId}/position/${positionId}`;

    return this.http.get<ITalentPipelineStagesGroup>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getAppliedPositionsByTalentId1(talentId: string, isProtected: boolean = true): Observable<EnrichedAppliedPositionsProgress | any> {
    const apiUrl = `${this.tartgetUrl}/positions/by-talent-id/${talentId}`;

    return this.http.get<EnrichedAppliedPositionsProgress>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getAppliedPositionsReachedStage(
    stageType: StageType, 
    pageSize: number,
    pageIndex: number,
    sorting: Sorting,
    filtering: Filtering,
    isProtected: boolean = true): Observable<PaginatedResource<EnrichedAppliedPositionsProgress>> {
    const apiUrl = `${this.tartgetUrl}/positions/by-stage/${stageType}?page=${pageIndex}&size=${pageSize}&sortParams=${encodeURIComponent(JSON.stringify(sorting))}&filterParams=${encodeURIComponent(JSON.stringify(filtering))}`;
    return this.http.get<PaginatedResource<EnrichedAppliedPositionsProgress>>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getAppliedPositionsByTalentId(
    talentId: string,
    pageSize: number,
    pageIndex: number,
    sorting: Sorting,
    filtering: Filtering,
    isProtected: boolean = true,
    pushSubject: boolean = true
  ): Observable<PaginatedResource<EnrichedAppliedPositionsProgress>> {

    const url = `${this.tartgetUrl}/positions/by-talent-id/${talentId}?page=${pageIndex}&size=${pageSize}&sortParams=${encodeURIComponent(JSON.stringify(sorting))}&filterParams=${encodeURIComponent(JSON.stringify(filtering))}`

    const request = this.http.get<PaginatedResource<EnrichedAppliedPositionsProgress>>(url, {
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

  getAppliedPositionIds(talentId: string, isProtected: boolean = true): Observable<string[]> {
    const apiUrl = `${this.tartgetUrl}/positions/applied-ids/${talentId}`;

    return this.http.get<string[]>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getTalentsByUserId(userId: string, isProtected: boolean = true): Observable<any> {
    console.log('getTalentsByUserId', userId);

    const apiUrl = `${this.tartgetUrl}/talents/${userId}`;

    return this.http.get<any>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getTalentsForPositionByUserId(userId: string, isProtected: boolean = true): Observable<any> {
    console.log('getTalentsForPositionByUserId', userId);

    const apiUrl = `${this.tartgetUrl}/talentsForPosition/${userId}`;

    return this.http.get<any>(apiUrl, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getTalentsContactsListByPositions(userId: string | null, isProtected: boolean = true): Observable<any> {
    console.log('getTalentsForPositionByUserId', userId);
    const userID = userId ?? sessionStorage.getItem(`${environment.storage.userId}`);
    const apiUrl = `${this.tartgetUrl}/contacts/${userID}`;
    console.log('getTalentsForPositionByUserId apiUrl', apiUrl);
    if (userID == null) {
      return new Observable<any>();
    }
    return this.http.get<any>(apiUrl, { 
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getContactsByPositionId(positionId: string, isProtected: boolean = true): Observable<any> {
    const apiUrl = `${this.tartgetUrl}/contacts/by-position-id/${positionId}`;
    console.log('getContactsByPositionId apiUrl', apiUrl);
    if (positionId == null) {
      return new Observable<any>();
    }
    return this.http.get<any>(apiUrl, { 
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }
}