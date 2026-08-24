import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { User } from "../models/user";
import { CRUDService } from "../../general/services/crud.service";
import { environment } from "../../../../environments/environment";


@Injectable({
  providedIn: 'root'
})
export class UsersService extends CRUDService<User> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.usersPath}`;

  constructor(http: HttpClient) {
    super(http);

    this.inheritedClassName = this.constructor.name;
  }

  getCurrentUserID(): string | null {
    const userID = sessionStorage.getItem(`${environment.storage.userId}`);
    return userID;
  }
}
