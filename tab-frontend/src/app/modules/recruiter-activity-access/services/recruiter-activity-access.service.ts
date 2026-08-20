import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CRUDService } from '../../general/services/crud.service';
import { ActivityAccessResponse, RecruiterActivityAccess, RecruiterSearchResult } from '../models/recruiter-activity-access.model';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class RecruiterActivityAccessService extends CRUDService<RecruiterActivityAccess> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.recruiterActivityAccess}`;

  constructor(http: HttpClient) {
    super(http);
    this.inheritedClassName = this.constructor.name;
  }

  getMyActivityAccess(isProtected: boolean = true) {
    const url = `${this.tartgetUrl}/my`;
    const request = this.http.get<ActivityAccessResponse>(url, {
      withCredentials: true,
      headers: this.getHttpHeaders(isProtected),
    });
    return request;
  }

  searchRecruiterByEmail(email: string, isProtected: boolean = true) {
    const url = `${this.tartgetUrl}/search`;
    const request = this.http.get<RecruiterSearchResult>(url, {
      withCredentials: true,
      headers: this.getHttpHeaders(isProtected),
      params: { email }
    });
    return request;
  }
}