import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CRUDService } from "../../general/services/crud.service";
import { CompanyData, Company } from "../models/company";
import { environment } from "../../../../environments/environment";
import { Observable, take } from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class CompaniesService extends CRUDService<Company> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.companiesVersions}`;

  public model: CompanyData = new CompanyData();
  constructor(http: HttpClient) {
    super(http);

    this.inheritedClassName = this.constructor.name;
  }


  createPayloadAsync(entity: Company, isProtected: boolean = true, fileData: any = undefined): Observable<Company> {

    let formData = new FormData();

    if (fileData.fileInfo) {
      console.log(fileData.fileInfo, fileData.file.type);
      let extension = fileData.fileInfo.name.split(".").pop();
      formData.append("file", fileData.fileInfo, `${entity.data.companyName}.${extension}`);
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
    request.pipe(take(1)).subscribe((result: any) => {
      this.refreshDataBehaviorSubject.next(true);
    });
    return request;
  }

  override updateAsync(entity: Company, isProtected: boolean = true): Observable<Company> {
    // console.log('updateAsync', entity);
    //entity.data.logo. = this.renameFilePath(entity.data.logo?.originalName, entity.data.companyName);
    // console.log('updateAsync', entity);
    const request = this.http.put<any>(`${this.tartgetUrl}/${entity._id}`, entity,
      {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected,
        observe: "body",
        reportProgress: true,
        responseType: "json",
      });

    request.pipe(take(1)).subscribe((result: any) => {
      this.refreshDataBehaviorSubject.next(true);
    });
    return request;
  }

  updatePayloadAsync(entity: Company, isProtected: boolean = true, fileData: any = undefined): Observable<Company> {
    let formData = new FormData();
    // console.log('fileData', fileData);
    if (fileData.file) {
      let extension = fileData.fileInfo.name.split(".").pop();
      formData.append("file", fileData.fileInfo, `${entity.data.logo?.filename}.${extension}`);
    }
    formData.append("info", JSON.stringify(entity));

    // console.log(this.tartgetUrl, entity);

    const request = this.http.put<any>(this.tartgetUrl, formData,
      {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected,
        observe: "body",
        reportProgress: true,
        responseType: "json",
      });

    request.pipe(take(1)).subscribe((result: any) => {
      this.refreshDataBehaviorSubject.next(true);
    });
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
}