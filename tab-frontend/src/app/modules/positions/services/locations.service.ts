import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { Country } from '../../location/models/country';

@Injectable({
  providedIn: 'root'
})
export class LocationsService extends CRUDService<Country> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.countries}`;

  private locationsSubject = new BehaviorSubject<Country[]>([]);

  locationsSubject$:Observable<Country[]> = this.locationsSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http)
  }
}