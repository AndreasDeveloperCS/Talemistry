import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';

@Injectable({ providedIn: 'root' })
export class VisitCardPdfService extends CRUDService<any> {
    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.visitCardsPdf}`;

    constructor(http: HttpClient) {
        super(http);
        this.inheritedClassName = this.constructor.name;
    }

    downloadVisitCardsPdf(userId: string, selectedColor: string, isProtected: boolean = true): Observable<any> {
        console.log('downloadVisitCardsPdf', userId, selectedColor);
    
        const apiUrl = `${this.tartgetUrl}/download-visit-cards/${userId}?color=${selectedColor}`;

        return this.http.get(apiUrl, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected,
            responseType: 'blob' as 'json'
        });
    }
}