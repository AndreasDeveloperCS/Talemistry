
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CRUDService } from '../../../general/services/crud.service';
import { UserCredentials } from '../../../authentication/models/user';
import { environment } from '../../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class UserCredentialsService extends CRUDService<UserCredentials> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.userCredentials}`;

  constructor(http: HttpClient) {
    super(http);

    this.inheritedClassName = this.constructor.name;
  }
}

