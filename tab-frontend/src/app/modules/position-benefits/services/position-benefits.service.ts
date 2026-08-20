import { Injectable } from '@angular/core';
import { CRUDService } from '../../general/services/crud.service';
import { PositionBenefit } from '../models/position-benefit';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PositionBenefitsService extends CRUDService<PositionBenefit> {
  
  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.positionBenefits}`;

  private positionBenefitsSubject = new BehaviorSubject<PositionBenefit[]>([]);

  skillsSubject$:Observable<PositionBenefit[]> = this.positionBenefitsSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http)
  }
}