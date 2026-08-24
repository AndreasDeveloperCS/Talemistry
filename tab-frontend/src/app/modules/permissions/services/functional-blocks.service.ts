import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { FunctionalBlock } from '../models/functional-block';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FunctionalBlocksService extends CRUDService<FunctionalBlock> {

    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.functionalBlocks}`;

    constructor(http: HttpClient) {
        super(http);

        this.inheritedClassName = this.constructor.name;
    }

    getMaxRegisterValue() {
        const tartgetUrl = `${this.tartgetUrl}/max`;

        const request = this.http.get<any>(tartgetUrl, {
            headers: this.getHttpHeaders(true),
            withCredentials: true
        });

        return request;
    }
}