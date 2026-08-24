import { HttpClient } from '@angular/common/http';
import { CRUDService } from '../../general/services/crud.service';
import { AccessType } from '../models/access-type';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })

export class AccessTypesService extends CRUDService<AccessType> {


    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.accessTypes}`;

    constructor(http: HttpClient) {
        super(http);

        this.inheritedClassName = this.constructor.name;
    }

    getMaxRegisterValue(isProtected: boolean = false) {
        const tartgetUrl = `${this.tartgetUrl}/max`;

        const request = this.http.get<any>(tartgetUrl, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected
        });

        return request;
    }

    getAllAccessTypesAsync(isProtected: boolean = true) {
        const tartgetUrl = `${this.tartgetUrl}/all`;
        console.log('getAllAccessTypesAsync', tartgetUrl);

        const request = this.http.get<any>(tartgetUrl, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected
        });

        return request;
    }
}