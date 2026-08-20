import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, retry, timer } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';

@Injectable({ providedIn: 'root' })
export class CvService extends CRUDService<any> {
    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.cvPdf}`;

    constructor(http: HttpClient) {
        super(http);
        this.inheritedClassName = this.constructor.name;
    }

    downloadCvPdf(userId: string, template: string, colorTheme: string, isProtected: boolean = true): Observable<any> {
        console.log('downloadCvPdf', userId, template, colorTheme);

        const apiUrl = `${this.tartgetUrl}/download/${userId}?template=${template}&color=${colorTheme}`;

        return this.http.get(apiUrl, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected,
            responseType: 'blob' as 'json'
        }).pipe(
            retry({
                count: 3,
                delay: (error, retryCount) => {
                    console.warn(`CV PDF download attempt ${retryCount} failed, retrying...`, error?.status);
                    return timer(retryCount * 1500);
                }
            })
        );
    }
}