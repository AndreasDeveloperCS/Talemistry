import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { CRUDService } from '../../general/services/crud.service';
import { RecruitmentPlatform } from '../models/recruitment-platform';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecruitmentPlatformService extends CRUDService<RecruitmentPlatform> {
  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.recruitmentPlatform}`;

  private recruitmentPlatformSubject = new BehaviorSubject<RecruitmentPlatform[]>([]);
  recruitmentPlatform$: Observable<RecruitmentPlatform[]> = this.recruitmentPlatformSubject.asObservable();

  constructor(http: HttpClient) {
    super(http);
    this.inheritedClassName = this.constructor.name;
  }

  getAll(isProtected: boolean = true): Observable<RecruitmentPlatform[]> {
    return this.http.get<RecruitmentPlatform[]>(this.tartgetUrl, {
      withCredentials: true,
      headers: this.getHttpHeaders(isProtected), // ? 
      observe: 'body',
      responseType: 'json',
    });
  }

  createPayloadAsync(entity: RecruitmentPlatform, isProtected: boolean = true, fileData: any = undefined, pushSubject: boolean = true): Observable<RecruitmentPlatform> {

    let formData = new FormData();

    // console.log(fileData.fileInfo, fileData.file.type);

    let extension = fileData.fileInfo.name.split(".").pop();

    formData.append("icon", fileData.fileInfo, `${entity.name}.${extension}`);
    formData.append("info", JSON.stringify(entity));

    // console.log(this.tartgetUrl, entity);
    for (let pair of formData.entries()) {
      // console.log(pair[0] + ':', pair[1]);
    }
    const request = this.http.post<any>(this.tartgetUrl, formData,
      {
        withCredentials: true,
        headers: this.getHttpHeaders(isProtected),
        observe: "body",
        reportProgress: true,
        responseType: "json",
      });
    
    if(pushSubject) {
      request.pipe(take(1)).subscribe((result: any) => {
        this.refreshDataBehaviorSubject.next(true);
      });
    }
    return request;
  }

  override updateAsync(entity: RecruitmentPlatform, isProtected: boolean = true, pushSubject: boolean = true): Observable<RecruitmentPlatform> {
    // console.log('updateAsync', entity);
    entity.icon = this.renameFilePath(entity.icon, entity.name);
    // console.log('updateAsync', entity);
    const request = this.http.put<any>(`${this.tartgetUrl}/${entity._id}`, entity,
      {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected,
        observe: "body",
        reportProgress: true,
        responseType: "json",
      });
    
    if(pushSubject) {
      request.pipe(take(1)).subscribe((result: any) => {
        this.refreshDataBehaviorSubject.next(true);
      });
    }
    return request;
  }

  updatePayloadAsync(entity: RecruitmentPlatform, isProtected: boolean = true, fileData: any = undefined, pushSubject: boolean = true): Observable<RecruitmentPlatform> {
    let formData = new FormData();
    // console.log('fileData', fileData);
    if (fileData.file) {
      let extension = fileData.fileInfo.name.split(".").pop();
      formData.append("icon", fileData.fileInfo, `${entity.name}.${extension}`);
    }
    formData.append("info", JSON.stringify(entity));

    // console.log(this.tartgetUrl, entity);

    const request = this.http.put<any>(this.tartgetUrl, formData,
      {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected,
        observe: "body",
        reportProgress: true,
        responseType: "json",
      });

    if(pushSubject) {
      request.pipe(take(1)).subscribe((result: any) => {
        this.refreshDataBehaviorSubject.next(true);
      });
    }
    return request;
  }

  updatePriority(media: RecruitmentPlatform, isProtected: boolean = true): Observable<any> {
    const url = `${this.tartgetUrl}/${media._id}/update-priority`;
    return this.http.put(url, { priority: media.priority }, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: true
    });
  }


  // getAll(isProtected:boolean=true): Observable<SocialMedia[]> {
  //   return this.http.get<SocialMedia[]>(this.tartgetUrl, {
  //     withCredentials: true,
  //     headers: this.getHttpHeaders(isProtected),
  //     observe: 'body',
  //     responseType: 'json',
  //   });
  // }

  override getHttpHeaders(isProtected: boolean): HttpHeaders {
    this.idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`) ?? '';
    return isProtected
      ? new HttpHeaders({
        'Authorization': `Bearer ${this.idToken}`,
        //"Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
        //"Access-Control-Allow-Origin" : environment.sourceUrl
      })
      : new HttpHeaders({
        // "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
      })
  }

  renameFilePath(originalPath: string, newName: string): string {
    // Split the path into components
    const pathParts = originalPath.split('/'); // Use '\\' for Windows paths if needed

    // Extract the file name and extension
    const fileName = pathParts.pop() || ''; // Get the last part (file name)
    const extensionIndex = fileName.lastIndexOf('.');
    const extension = extensionIndex !== -1 ? fileName.slice(extensionIndex) : '';

    // Rename the file while preserving the extension
    const newFileName = newName + extension;

    // Reconstruct the full path
    const newPath = [...pathParts, newFileName].join('/');
    // console.log('renameFilePath', newPath, newFileName, extension, extensionIndex, fileName, pathParts);
    return newPath; // Return the new file path
  }
}
