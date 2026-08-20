import { HttpClient } from '@angular/common/http';
import { CRUDService } from '../../general/services/crud.service';
import { Role } from '../models/role';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RolesService extends CRUDService<Role> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.roles}`;

  constructor(http: HttpClient) {
    super(http);

    this.inheritedClassName = this.constructor.name;
  }

  getMaxRegisterValue() {
    const tartgetUrl = `${this.tartgetUrl}/max`;

    const request = this.http.get<any>(tartgetUrl, {
      headers: this.getHttpHeaders(true),
      withCredentials: true
    });

    return request;
  }

}