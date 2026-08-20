import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CRUDService } from '../../general/services/crud.service';
import { PositionBenefit } from '../../position-benefits/models/position-benefit';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BenefitsService extends CRUDService<PositionBenefit> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.benefits}`;

  private benefitsSubject = new BehaviorSubject<PositionBenefit[]>([]);

  benefitsSubject$:Observable<PositionBenefit[]> = this.benefitsSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http)
  }
}
