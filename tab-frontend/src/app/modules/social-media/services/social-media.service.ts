
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { SocialMedia } from '../models/social-media';

@Injectable({
  providedIn: 'root'
})
export class SocialMediaService extends CRUDService<SocialMedia> {
  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.socialMedia}`;

  private socialMediaSubject = new BehaviorSubject<SocialMedia[]>([]);
  socialMedia$: Observable<SocialMedia[]> = this.socialMediaSubject.asObservable();

  constructor(http: HttpClient) {
    super(http);
    this.inheritedClassName = this.constructor.name;
  }

  getAll(isProtected: boolean = true): Observable<SocialMedia[]> {
    return this.http.get<SocialMedia[]>(this.tartgetUrl, {
      withCredentials: true,
      headers: this.getHttpHeaders(isProtected), 
      observe: 'body',
      responseType: 'json',
    });
  }

  createPayloadAsync(entity: SocialMedia, isProtected: boolean = true, fileData: any = undefined, pushSubject: boolean = true): Observable<SocialMedia> {

    let formData = new FormData();

    const sanitizedFileName = entity.name.trim().replace(/\s+/g, '-').toLowerCase();
    let extension = fileData.fileInfo.name.split(".").pop();

    formData.append("icon", fileData.fileInfo, `${sanitizedFileName}.${extension}`);
    formData.append("info", JSON.stringify(entity));

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

  override updateAsync(entity: SocialMedia, isProtected: boolean = true, pushSubject: boolean = true): Observable<SocialMedia> {
    let formData = new FormData();
    formData.append("info", JSON.stringify(entity));

    const request = this.http.put<any>(`${this.tartgetUrl}/${entity._id}`, formData,
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

  updatePayloadAsync(entity: SocialMedia, isProtected: boolean = true, fileData: any = undefined, pushSubject: boolean = true): Observable<SocialMedia> {
    let formData = new FormData();

    if (fileData.file) {
      const extension = fileData.fileInfo.name.split('.').pop();
      const sanitizedFileName = entity.name.trim().replace(/\s+/g, '-');
      formData.append('icon', fileData.fileInfo, `${sanitizedFileName}.${extension}`);
    }

    formData.append("info", JSON.stringify(entity));

    const request = this.http.put<any>(`${this.tartgetUrl}/${entity._id}`, formData,
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

  updatePriority(media: SocialMedia, isProtected: boolean = true): Observable<any> {
    const url = `${this.tartgetUrl}/${media._id}/update-priority`;
    return this.http.put(url, { priority: media.priority }, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: true
    });
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
