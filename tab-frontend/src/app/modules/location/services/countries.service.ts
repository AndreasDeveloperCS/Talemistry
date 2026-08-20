import { Injectable } from '@angular/core';
import { CRUDService } from '../../general/services/crud.service';
import { Country } from '../models/country';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CountriesService extends CRUDService<Country> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.countries}`;

  private locationsSubject = new BehaviorSubject<Country[]>([]);

  locationsSubject$: Observable<Country[]> = this.locationsSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http)
  }
}
