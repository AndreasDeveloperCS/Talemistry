import { Injectable } from "@angular/core";
import { CRUDService } from "../../general/services/crud.service";
import { environment } from "../../../../environments/environment";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { CurrentCompany } from "../models/current-company";

@Injectable({
  providedIn: 'root'
})
export class CurrentCompanyService extends CRUDService<CurrentCompany> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.currentCompany}`;

  private locationsSubject = new BehaviorSubject<CurrentCompany[]>([]);

  locationsSubject$: Observable<CurrentCompany[]> = this.locationsSubject.asObservable();

  constructor(http: HttpClient) {
    super(http)
  }

  getByUserIdAsync(userId: string, isProtected: boolean = true): Observable<CurrentCompany | null> {
    console.log('getByUserIdAsync', userId);
    return this.http.get<CurrentCompany | null>(`${this.tartgetUrl}/user/${userId}`, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }
}