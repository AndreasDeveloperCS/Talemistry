import { HttpClient, HttpHeaders } from "@angular/common/http";
import { EventEmitter, Injectable, OnInit } from "@angular/core";
import { Observable, take, tap } from "rxjs";
import { FileData } from "../../general/models/file-data";
import { CRUDService } from "../../general/services/crud.service";
import { UserProfileService } from "../../profiles/user-profile/services/user-profile.service";
import { InfoCVEnvelope } from "../models/info-cv-envelope";
import { InfoCV } from "../models/cv-item";
import { ClientInfoService } from "../../general/services/get-client-info.service";
import { environment } from "../../../../environments/environment";
import { User } from "../../authentication/models/user";
import { DocumentHistory } from "../components/cvs-cls-history-view/cvs-cls-history-view.component";

@Injectable({
    providedIn: 'root'
})
export class CVService extends CRUDService<InfoCV> implements OnInit {
    userId!: string;
    user: User = new User();
    isMainEmmitter: EventEmitter<InfoCV> = new EventEmitter<InfoCV>();
    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.cvs}`;

    constructor(http: HttpClient,
        public userProfileService: UserProfileService,
        private clientInfoService: ClientInfoService) {
        super(http);

        this.inheritedClassName = this.constructor.name;
        this.userId = sessionStorage.getItem(`${environment.storage.userId}`) || '';
        if (this.userId)
            this.userProfileService.getByIdAsync(this.userId, true).pipe(take(1)).subscribe((user: User) => {
                this.user = user;
            });
    }

    ngOnInit(): void {
        // if(this.userId)
        // this.userProfileService.getByIdAsync(this.userId, true).pipe(takeUntil(this._onDestroy)).subscribe((user:User)=> {
        //     this.user = user;
        // });
    }

    downloadById(id: any): Observable<any> {
        const tartgetUrl = `${this.tartgetUrl}/${id}`;
        const isProtected = true;

        const request = this.http.get<any>(tartgetUrl,
            {
                responseType: "blob" as 'json',
                headers: this.getStreamHttpHeaders(isProtected),
                withCredentials: isProtected
            });

        return request;
    }
    
    getDocumentHistory(id: any, isProtected: boolean = true): Observable<DocumentHistory> {
        const tartgetUrl = `${this.tartgetUrl}/document-history`;

        const request = this.http.get<DocumentHistory>(tartgetUrl,
        {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected
        });

        return request;
    }

    upload(cvFile: FileData, info: InfoCVEnvelope, coverLetterFilesCollection: FileData[], isProtected: boolean = false): any {
        console.log(cvFile, coverLetterFilesCollection, info);
        if (!cvFile || !info) {
            return new Observable();
        }

        try {

            const jsonData = JSON.stringify(info);

            let formData = new FormData();
            formData.append("info", jsonData);
            formData.append("files[]", cvFile.fileInfo, cvFile.fileInfo.name);
            coverLetterFilesCollection.forEach((fileData: FileData) => {
                formData.append("files[]", fileData.fileInfo, fileData.fileInfo.name);
            });

            const result$ = this.http.post(this.tartgetUrl, formData, {
                responseType:"json",
                withCredentials: false,
                })
                .pipe(
                take(1),
                tap(() => this.refreshData.emit(true))
            );

            return result$;

        } catch (ex) {
            return new Observable();
        }
    }

    uploadOld(cvFile: FileData, info: InfoCVEnvelope, coverLetterFilesCollection: FileData[], isProtected: boolean = false): any {
        console.log(cvFile, coverLetterFilesCollection, info);
        if (!cvFile || !info) {
            return new Observable();
        }

        try {

            const jsonData = JSON.stringify(info);

            let formData = new FormData();
            formData.append("info", jsonData);
            formData.append("files[]", cvFile.fileInfo, cvFile.fileInfo.name);
            coverLetterFilesCollection.forEach((fileData: FileData) => {
                formData.append("files[]", fileData.fileInfo, fileData.fileInfo.name);
            });

            const url = `${this.tartgetUrl}/old`;
            const result$ = this.http.post(url, formData, {
                    responseType:"json",
                    withCredentials: false,
                })
                .pipe(
                take(1),
                tap(() => this.refreshData.emit(true))
            );

            return result$;

        } catch (ex) {
            return new Observable();
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


}
