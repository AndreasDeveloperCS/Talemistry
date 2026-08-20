import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { InfoCV } from "../models/cv-item";
import { CRUDService } from "../../general/services/crud.service";
import { environment } from "../../../../environments/environment";


@Injectable({
  providedIn: 'root'
})
export class InfoCvService extends CRUDService<InfoCV> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.cvs}`;

  constructor(http: HttpClient) {
    super(http);

    this.inheritedClassName = this.constructor.name;
  }


}
