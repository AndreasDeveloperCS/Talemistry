import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, take } from "rxjs";
import { environment } from "../../../../environments/environment";
import { CRUDService } from "../../general/services/crud.service";
import { CompanyData, CompanyVersion } from "../models/company";
import { Currency } from "../../general/models/currency";
import { NotificationWindowComponent } from "../../general/dialogs/notification-window/notification-window.component";
import { CompanyCreationModalComponent } from "../components/company-creation-modal/company-creation-modal.component";
import { MatDialog } from "@angular/material/dialog";
import { DialogHelperService } from "../../general/services/dialog-helper.service";
import { WarningsErrorsDialogComponent } from "../../general/components/warnings-errors-dialog/warnings-errors-dialog.component";
import { Router } from "@angular/router";


@Injectable({
  providedIn: 'root'
})
export class CompanyVersionService extends CRUDService<CompanyVersion> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.companiesVersions}`;

  public model: CompanyData = new CompanyData();
  constructor(http: HttpClient,
    private router: Router) 
  {
    super(http);
    this.inheritedClassName = this.constructor.name;
  }


  createPayloadAsync(entity: CompanyVersion, isProtected: boolean = true, fileData: any = undefined, pushSubject: boolean = true): Observable<CompanyVersion> {

    let formData = new FormData();
    if (fileData.file) {
      const extension = fileData.fileInfo.name.split('.').pop();
      const sanitizedFileName = entity.data.companyName.trim().replace(/\s+/g, '-');
      const unique = Math.floor(Math.random() * 1_000_000);

      formData.append(
        'logo',
        fileData.fileInfo,
        `${sanitizedFileName}-${unique}.${extension}`
      );
    }

    formData.append("info", JSON.stringify(entity));

    const request = this.http.post<any>(this.tartgetUrl, formData,
      {
        withCredentials: true,
        headers: this.getHttpHeaders(isProtected),
        observe: "body",
        reportProgress: true,
        responseType: "json",
      });
    if(pushSubject) {
      request.pipe(take(1)).subscribe((result: any) => {
        this.refreshDataBehaviorSubject.next(true);
      });
    }
    return request;
  }

  override updateAsync(entity: CompanyVersion, isProtected: boolean = true, pushSubject: boolean = true): Observable<CompanyVersion> {
    let formData = new FormData();
    formData.append("info", JSON.stringify(entity));

    const request = this.http.put<any>(`${this.tartgetUrl}/${entity._id}`, entity,
      {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected,
        observe: "body",
        reportProgress: true,
        responseType: "json",
      });

    if(pushSubject) {
      request.pipe(take(1)).subscribe((result: any) => {
        this.refreshDataBehaviorSubject.next(true);
        this.refreshData.emit(true);
      });
    }
    return request;
  }

  updatePayloadAsync(entityId: string, entity: CompanyData, isProtected: boolean = true, fileData: any = undefined, pushSubject: boolean = true): Observable<CompanyVersion> {
    let formData = new FormData();
    console.log('updatePayloadAsync entity', entityId);
    if (fileData.file) {
      const extension = fileData.fileInfo.name.split('.').pop();
      const sanitizedFileName = entity.companyName.trim().replace(/\s+/g, '-');
      const unique = Math.floor(Math.random() * 1_000_000);

      formData.append(
        'logo',
        fileData.fileInfo,
        `${sanitizedFileName}-${unique}.${extension}`
      );
    }
    formData.append("info", JSON.stringify(entity));

    const request = this.http.put<any>(`${this.tartgetUrl}/${entityId}`, formData,
      {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected,
        observe: "body",
        reportProgress: true,
        responseType: "json",
      });

    if(pushSubject) {
      request.pipe(take(1)).subscribe((result: any) => {
        this.refreshDataBehaviorSubject.next(true);
      });
    }
    return request;
  }


  renameFilePath(originalPath: string | undefined, newName: string): string {
    if (!originalPath) {
      return newName;
    }
    const pathParts = originalPath.split('/');
    const fileName = pathParts.pop() || '';
    const extensionIndex = fileName.lastIndexOf('.');
    const extension = extensionIndex !== -1 ? fileName.slice(extensionIndex) : '';

    const newFileName = newName + extension;

    const newPath = [...pathParts, newFileName].join('/');
    // console.log('renameFilePath', newPath, newFileName, extension, extensionIndex, fileName, pathParts);
    return newPath;
  }

  override getHttpHeaders(isProtected: boolean): HttpHeaders {
    this.idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`) ?? '';
    return isProtected
      ? new HttpHeaders({
        'Authorization': `Bearer ${this.idToken}`,
        "Accept": "application/json",
      })
      : new HttpHeaders({
        "Accept": "application/json",
      })
  }

  getByUserIdAsync(userId: string, isProtected: boolean = true): Observable<CompanyVersion | null> {
    console.log('getByUserIdAsync', userId);
    return this.http.get<CompanyVersion | null>(`${this.tartgetUrl}/user/${userId}`, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getDefaultCurrency(): Currency {
    return {
      _id: "676e740a9988ca59091e09e5",
      name: "US Dollar",
      symbol: "$",
      symbolNative: "$",
      decimalDigits: 2,
      rounding: 0,
      code: "USD",
      namePlural: "US dollars",
    };
  }

  navigateToCompany(companyId: string) {
    if (companyId) {
      this.router.navigate([environment.routes.companies, companyId]);
    }
  }

  openCompanyPage(companyId: string) {
    if (companyId) {
      window.open(this.getCompanyLink(companyId), '_blank');
    }
  }

  getCompanyLink(companyId: string): string {
    return `${environment.sourceUrl}/${environment.routes.companies}/${companyId}`;
  }
}