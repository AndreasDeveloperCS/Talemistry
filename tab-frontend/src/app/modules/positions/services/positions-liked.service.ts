import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthGuardService } from '../../authentication/guard/auth-guard.service';
import { CRUDService } from '../../general/services/crud.service';
import { FUNCTIONALBLOCK } from '../../permissions/models/functional-block-enum';
import { PositionLiked } from '../models/position-liked';

@Injectable({
  providedIn: 'root'
})
export class PositionsLikedService extends CRUDService<PositionLiked> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.positionsLiked}`;

  public likedPositions: string[] = [];
  private likedPositionsUpdatedSubject = new BehaviorSubject<boolean>(true);
  likedPositionsUpdated$ = this.likedPositionsUpdatedSubject.asObservable();

  public get isAuthorised(): boolean {
    return this.authGuard.canCreateItems(FUNCTIONALBLOCK.POSITIONSLIKED);
  }
  
  constructor(http: HttpClient, public authGuard: AuthGuardService) {
    super(http);
    if(this.isAuthorised) {
      this.fetchLikedPositions();
    }
  }

  fetchLikedPositions() {
    console.log('fetchLikedPositions');
    this.getLikedPositions().pipe(take(1)).subscribe({
      next: (ids) => {
        this.likedPositions = ids;
        this.notifyLikedPositionUpdates();
        console.log('✅ Updated likedPositionIds', this.likedPositions);
      },
      error: (err) => {
        console.error('❌ Failed to fetch liked positions:', err);
      }
    });
  }

  notifyLikedPositionUpdates() {
    this.likedPositionsUpdatedSubject.next(true);
  }

  likePosition(positionId: any): Observable<any> {
    return this.http.post(`${this.tartgetUrl}/${environment.serverPaths.like}`, 
      { positionId },
      {
        headers: this.getHttpHeaders(true),
        withCredentials: true,
        observe: 'body',
        reportProgress: true,
        responseType: 'json',
      }
    );
  }

  unlikePosition(positionId: any): Observable<any> {
    return this.http.post(`${this.tartgetUrl}/${environment.serverPaths.unlike}`,
      { positionId },
      {
        headers: this.getHttpHeaders(true),
        withCredentials: true,
        observe: 'body',
        reportProgress: true,
        responseType: 'json',
      }
    );
  }

  getLikedPositions(): Observable<any[]> {
    return this.http.get<any>(`${this.tartgetUrl}`, 
      {
        headers: this.getHttpHeaders(true),
        withCredentials: true
      }
    );
  }
}