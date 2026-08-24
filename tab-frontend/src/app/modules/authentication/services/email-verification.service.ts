import { CRUDService } from "../../general/services/crud.service";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class EmailVerificationService extends CRUDService<any> {

    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.emailVerification}`;

    constructor(http: HttpClient) {
        super(http);
        this.inheritedClassName = this.constructor.name;
    }
}