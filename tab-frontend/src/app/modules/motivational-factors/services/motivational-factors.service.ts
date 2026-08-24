import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MotivationalFactor } from "../models/motivational-factor";
import { CRUDService } from "../../general/services/crud.service";
import { environment } from "../../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class MotivationalFactorsService extends CRUDService<MotivationalFactor> {
  userId!: string;

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.motivationalFactors}`;

  constructor(http: HttpClient) {
    super(http);

  }
}