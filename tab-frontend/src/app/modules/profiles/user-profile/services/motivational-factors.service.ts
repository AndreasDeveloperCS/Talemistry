import { MotivationalFactor } from "../models/motivational-factor";
import { Injectable, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { CRUDService } from "../../../general/services/crud.service";
import { environment } from "../../../../../environments/environment";

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