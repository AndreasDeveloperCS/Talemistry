import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CRUDService } from '../../general/services/crud.service';
import { RecruitmentPlatform } from '../models/recruitment-platform';
import { UserRecruitmentPlatform } from '../models/user-recruitment-platform';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserRecruitmentPlatformService extends CRUDService<UserRecruitmentPlatform> {
  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.userRecruitmentPlatform}`;

  private recruitmentPlatformSubject = new BehaviorSubject<RecruitmentPlatform[]>([]);
  recruitmentPlatform$:Observable<RecruitmentPlatform[]> = this.recruitmentPlatformSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http);
    this.inheritedClassName = this.constructor.name;
  }
}