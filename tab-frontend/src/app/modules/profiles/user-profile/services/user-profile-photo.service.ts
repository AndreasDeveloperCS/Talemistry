import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, take } from "rxjs";
import { CRUDService } from "../../../general/services/crud.service";
import { environment } from "../../../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class UserProfilePhotoService extends CRUDService<any> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.profilePhotoPath}`;

  constructor(http: HttpClient) {
    super(http);

    this.inheritedClassName = this.constructor.name;
  }

  //Old
  getById() {
    const tartgetUrl = `${this.tartgetUrl}/${sessionStorage.getItem(`${environment.storage.userId}`)}/old`;
    const isProtected = true;

    const request = this.http.get<any>(tartgetUrl,
      {
        responseType: "blob" as 'json',
        headers: this.getStreamHttpHeaders(isProtected),
        withCredentials: isProtected
      });

    return request;
  }

  getPhotoUrlByIdAsync(userId: string, isProtected: boolean = true) {
    const tartgetUrl = `${this.tartgetUrl}/${userId}`;

    const request = this.http.get<any>(tartgetUrl,
      {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected
      });

    return request;
  }

  getByTalentId(talentId: string) {
    const tartgetUrl = `${this.tartgetUrl}/${talentId}`;
    const isProtected = true;

    const request = this.http.get<any>(tartgetUrl,
      {
        responseType: "blob" as 'json',
        headers: this.getStreamHttpHeaders(isProtected),
        withCredentials: isProtected
      });

    return request;
  }

  update(fileInfo: Blob, fileName?: string): Observable<any> {
    if (!fileInfo) {
      return Observable.prototype;
    }

    const tartgetUrl = `${this.tartgetUrl}/${sessionStorage.getItem(`${environment.storage.userId}`)}`;

    try {
      let formData = new FormData();
      console.log('update', fileName);

      formData.append("file", fileInfo, fileName);
      //formData.append("info", JSON.stringify(fileData.profileInfo));

      const isProtected = true;

      const updated = this.http.put(tartgetUrl, formData, {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected
      });

      updated.pipe(take(1)).subscribe((result: any) => {
        // console.log(result);
      });

      return updated;

    } catch (ex) {
      console.error('update profile photo', ex);
      return Observable.prototype;
    }
  }

  getStreamHttpHeaders(isProtected: boolean): HttpHeaders {
    this.idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`) ?? '';
    return isProtected
      ? new HttpHeaders({
        'Authorization': `Bearer ${this.idToken}`,
        "Content-Type": "blob",
        "Accept": "blob",
      })
      : new HttpHeaders({
        "Content-Type": "blob",
        "Accept": "blob",
      })
  }

  override getHttpHeaders(isProtected: boolean): HttpHeaders {
    this.idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`) ?? '';
    return isProtected
      ? new HttpHeaders({
        'Authorization': `Bearer ${this.idToken}`,
        "Accept": "application/json",
      })
      : new HttpHeaders({
        "Accept": "application/json",
      })
  }
}
