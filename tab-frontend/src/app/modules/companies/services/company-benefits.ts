import { Injectable } from "@angular/core";
import { CRUDService } from "../../general/services/crud.service";
import { environment } from "../../../../environments/environment";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { CompanyBenefit } from "../models/company-benefits";

@Injectable({
  providedIn: 'root'
})
export class CompanyBenefitsService extends CRUDService<CompanyBenefit> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.companyBenefits}`;

  private companyBenefitSubject = new BehaviorSubject<CompanyBenefit[]>([]);

  companyBenefitSubject$: Observable<CompanyBenefit[]> = this.companyBenefitSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }
}