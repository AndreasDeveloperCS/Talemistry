import { Injectable } from '@angular/core';
import { CRUDService } from '../../general/services/crud.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { TalentNote } from '../models/talent-note';

@Injectable({
  providedIn: 'root'
})
export class TalentNotesService extends CRUDService<TalentNote> {
  
  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.talentNotes}`;

  private talentNotesSubject = new BehaviorSubject<TalentNote[]>([]);

  talentNoteSubject$:Observable<TalentNote[]> = this.talentNotesSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http)
  }

  getByPositionIdTalentIdAsync(positionId: string, talentId: string, isProtected: boolean = true): Observable<TalentNote> {
    console.log('getByPositionIdTalentIdAsync', positionId, talentId);

    const apiUrl = `${this.tartgetUrl}/position/${positionId}/talent/${talentId}`;

    return this.http.get<TalentNote>(apiUrl, {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected
    });
  }
}