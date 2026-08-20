import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { VideoRecord } from '../models/video-record';

@Injectable({
    providedIn: 'root'
})
export class VideoRecordService extends CRUDService<VideoRecord> {

    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.videoRecordings}`;

    private videoRecordsSubject = new BehaviorSubject<VideoRecord[]>([]);

    videoRecordsSubject$: Observable<VideoRecord[]> = this.videoRecordsSubject.asObservable();

    constructor(http: HttpClient) {
        super(http)
    }

    uploadChunk(recordingId: string, chunkIndex: number, chunk: Blob, 
        isLast: boolean, interviewId?: string, isProtected: boolean = true
    ): Observable<any> {
        const formData = new FormData();
        formData.append('file', chunk, `chunk-${chunkIndex}.webm`);
        formData.append('recordingId', recordingId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('isLast', String(isLast));

        if (interviewId) {
            formData.append('interviewId', interviewId);
        }

        return this.http.post(`${this.tartgetUrl}`, formData, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected,
            observe: "body",
            reportProgress: true,
            responseType: "json",
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
}