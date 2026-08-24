import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CRUDService } from "../../general/services/crud.service";
import { Currency } from "../models/currency";
import { environment } from "../../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class CurrenciesService extends CRUDService<Currency> {
  userId!: string;

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.currencies}`;

  constructor(http: HttpClient) {
    super(http);

  }


  override getHttpHeaders(isProtected: boolean): HttpHeaders {
    this.idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`) ?? '';
    return isProtected
      ? new HttpHeaders({
        'Authorization': `Bearer ${this.idToken}`,
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
        "Access-Control-Allow-Origin": environment.sourceUrl
      })
      : new HttpHeaders({
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
      })
  }
}