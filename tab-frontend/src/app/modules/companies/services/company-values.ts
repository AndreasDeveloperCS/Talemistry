import { Injectable } from "@angular/core";
import { CRUDService } from "../../general/services/crud.service";
import { environment } from "../../../../environments/environment";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { CompanyValue } from "../models/company-values";

@Injectable({
  providedIn: 'root'
})
export class CompanyValuesService extends CRUDService<CompanyValue> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.companyValues}`;

  private companyValuesSubject = new BehaviorSubject<CompanyValue[]>([]);

  companyValuesSubject$: Observable<CompanyValue[]> = this.companyValuesSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }
}