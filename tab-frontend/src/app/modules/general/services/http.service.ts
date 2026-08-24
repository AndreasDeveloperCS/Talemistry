import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, take } from 'rxjs';
import { SkillArtifact, SkillType } from '../../skills/models/skill';
import { environment } from '../../../../environments/environment';
import { VerificationEmailData } from '../../authentication/models/signin-signup-info';
import { InterviewSlotData } from '../models/interview-model';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  public headers: HttpHeaders = new HttpHeaders();
  http: HttpClient;
  // TODO: Use separate servcie with pagination
  getSkills(skillTType: SkillType): Observable<any> {

    const skillsResult = this.http.get<SkillArtifact>(`${environment.apiUrl}${environment.serverPaths.skills}/${skillTType.toLocaleLowerCase()}`, {
      headers: new HttpHeaders({
        //='Authorization': `Bearer ${idToken}`,
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
        //"Access-Control-Allow-Origin" : '*'
      }),
      withCredentials: false
    });

    skillsResult.pipe(take(1)).subscribe(result => {
      // console.log(result)
    });
    return skillsResult;
  }

  getPostionInterviews(positionId: any): Observable<any> {
    const tartgetUrl = `${environment.apiUrl}interviews/getByPositionId/${positionId}`;
    return this.http.get<any>(tartgetUrl, {
      headers: this.headers
    });
  }

  createInterviewSlot(interviewSlotData: InterviewSlotData): Observable<any> {
    const tartgetUrl = `${environment.apiUrl}interviews/create`;
    return this.http.post<any>(tartgetUrl, interviewSlotData, {
      headers: this.headers
    });
  }

  constructor(injector: Injector) {
    this.http = injector.get(HttpClient);

    this.headers.set("Content-Type", "application/json; charset=utf-8");
    this.headers.set("Accept", "application/json");
    this.headers.append("Content-Type", "application/json; charset=utf-8");
    this.headers.append("Accept", "application/json");

    // this.headers.append("Origin", "*");
    // this.headers.set("Connection", "keep-alive");
    // this.headers.set("Accept-Encoding", "gzip, deflate, br");
    // this.headers.append("Access-Control-Allow-Origin", '*');
  }

  getUserAsync(userId: string): Observable<any> {
    const tartgetUrl = `${environment.apiUrl}users/${userId}`;
    return this.http.get<any>(tartgetUrl,
      {
        headers: this.headers
      });
  }

  verifyEmailAsync(verificationData: VerificationEmailData): Observable<any> {
    console.log('Http service verificationData', verificationData);
    const tartgetUrl = `${environment.apiUrl}auth/${verificationData.userId}/email-verification/${verificationData.requestId}`;
    const body = verificationData;

    return this.http.patch(tartgetUrl, body,
      {
        withCredentials: false
      });
  }
}
