import { Injectable } from '@angular/core';
import { CRUDService } from '../../general/services/crud.service';
import { HttpClient } from '@angular/common/http';
import { University } from '../models/university';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UniversityService extends CRUDService<University> {
  
  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.universities}`;

  constructor(http: HttpClient) {
    super(http);
    this.inheritedClassName = this.constructor.name;
  }

}
