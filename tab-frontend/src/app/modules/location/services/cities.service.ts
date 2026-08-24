import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { City } from '../models/city';
import { CRUDService } from '../../general/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class CitiesService extends CRUDService<City> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.cities}`;

  private locationsSubject = new BehaviorSubject<City[]>([]);

  locationsSubject$: Observable<City[]> = this.locationsSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http)
  }
}