import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CRUDService } from '../../general/services/crud.service';
import { PositionCertification } from '../models/position-certification';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CertificationsService extends CRUDService<PositionCertification> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.certifications}`;

  private certificationsSubject = new BehaviorSubject<PositionCertification[]>([]);

  certificationsSubject$:Observable<PositionCertification[]> = this.certificationsSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http)
  }
}