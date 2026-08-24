import { Injectable } from "@angular/core";
import { CRUDService } from "../../general/services/crud.service";
import { IndustryDomain } from "../models/industry";
import { environment } from "../../../../environments/environment";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class IndustryDomainService extends CRUDService<IndustryDomain> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.industryDomains}`;

  private industryDomainsSubject = new BehaviorSubject<IndustryDomain[]>([]);

  industryDomains$: Observable<IndustryDomain[]> = this.industryDomainsSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }
}