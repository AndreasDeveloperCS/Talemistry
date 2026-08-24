import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { PositionEducation } from '../models/position-education';

@Injectable({
  providedIn: 'root'
})
export class EducationService extends CRUDService<PositionEducation> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.education}`;

  private educationSubject = new BehaviorSubject<PositionEducation[]>([]);

  educationSubject$:Observable<PositionEducation[]> = this.educationSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http)
  }
}