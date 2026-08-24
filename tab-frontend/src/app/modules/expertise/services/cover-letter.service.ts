import { HttpClient, HttpHeaders } from "@angular/common/http";
import { EventEmitter, Injectable, OnInit } from "@angular/core";
import { Observable, take } from "rxjs";
import { FileData } from "../../general/models/file-data";
import { CRUDService } from "../../general/services/crud.service";
import { CoverLetterInfo } from "../models/cover-letter";
import { User } from "../../authentication/models/user";
import { environment } from "../../../../environments/environment";
import { ClientInfoService } from "../../general/services/get-client-info.service";
import { UserProfileService } from "../../profiles/user-profile/services/user-profile.service";

@Injectable({
    providedIn: 'root'
})
export class CoverLetterService extends CRUDService<CoverLetterInfo> implements OnInit {

    userId!: string;
    user: User = new User();

    coverLetterModel: CoverLetterInfo = new CoverLetterInfo();

    isMainEmmitter: EventEmitter<CoverLetterInfo> = new EventEmitter<CoverLetterInfo>();
    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.coverLetters}`;

    constructor(http: HttpClient,
        public userProfileService: UserProfileService,
        private clientInfoService: ClientInfoService) {
        super(http);

        this.inheritedClassName = this.constructor.name;
        this.userId = sessionStorage.getItem(`${environment.storage.userId}`) || '';
        if (this.userId) {
            this.userProfileService.getByIdAsync(this.userId, true).pipe(take(1)).subscribe((user: User) => {
                this.user = user;
            });
        }
    }

    ngOnInit(): void {

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

    upload(info: CoverLetterInfo, file: FileData, isProtected: boolean = false): any {
        console.log('Upload Cover Letter', this.constructor.name, info);

        if (!info) {
            return new Observable();
        }

        try {
            info.userId = sessionStorage.getItem(`${environment.storage.userId}`);
            info.candidateInfo.firstname = this.coverLetterModel.candidateInfo.firstname;
            info.candidateInfo.lastname = this.coverLetterModel.candidateInfo.lastname;
            info.candidateInfo.email = this.coverLetterModel.candidateInfo.email;
            info.candidateInfo.phone = this.coverLetterModel.candidateInfo.phone;
            console.log('info.candidateInfo', info);
            const jsonData = JSON.stringify(info);

            let formData = new FormData();

            formData.append("info", jsonData);

            console.log('Upload Cover Letter file', file);
            if (file) {
                formData.append("file", file.fileInfo, file.fileInfo.name);
            } else {
                formData.append("file", new Blob());
            }

            const result = this.http.post(this.tartgetUrl, formData, {
                headers : this.getHttpHeaders(isProtected),
                //reportProgress:true,
                //responseType:"json",
                withCredentials: isProtected,
            });
            result.pipe(take(1)).subscribe((result: any) => {
                // console.log('CV is added', result);
                this.refreshData.emit(true);
            });

            return result;

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
