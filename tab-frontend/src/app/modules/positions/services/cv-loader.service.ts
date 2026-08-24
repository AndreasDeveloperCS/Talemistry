import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FileData } from '../../general/models/file-data';
import { HttpService } from '../../general/services/http.service';
import { InfoCVEnvelope } from '../../profiles/user-profile/models/info-cv-envelope';

@Injectable({
  providedIn: 'root'
})
export class CvLoaderService extends HttpService {
  public progress: number = 0;
  message: any;

  constructor(injector: Injector) {
    super(injector);
  }

  upload(data: FileData, info: InfoCVEnvelope): any {
    if (!data.fileInfo) {
      return;
    }

    const tartgetUrl = `${environment.apiUrl}${environment.serverPaths.cvs}/${info.positionId}`;
    // console.log(tartgetUrl, tartgetUrl);

    try {
      let formData = new FormData();

      formData.append("file", data.fileInfo, data.fileInfo.name);
      formData.append("info", JSON.stringify(info));

      const cvApplied = this.http.post(tartgetUrl, formData, {
        withCredentials: false,
        reportProgress: true
      });

      // cvApplied.pipe(take(1)).subscribe((event: any) => {
      //   if (event.type === HttpEventType.UploadProgress) {
      //       this.progress = Math.round(100 * event.loaded / event.total);
      //   } else if (event instanceof HttpResponse) {
      //       this.message = event.body.message;
      //       this.fileInfo = this.getFiles();
      //   }
      // },
      // err => {
      //   this.progress = 0;
      //   this.message = 'Could not upload the file!';
      //   this.currentFile = undefined;
      // });

      return cvApplied;
    } catch (ex) {
      console.error('upload', ex);
    }
  }

  getFiles(): Observable<any> {
    const tartgetUrl = `${environment.apiUrl}cvs/files`;
    return this.http.get(tartgetUrl);
  }

  getCvs(): Observable<any> {
    const tartgetUrl = `${environment.apiUrl}cvs`;
    return this.http.get(tartgetUrl);
  }
}
