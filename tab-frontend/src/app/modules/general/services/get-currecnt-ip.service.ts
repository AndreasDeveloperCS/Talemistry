import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetCurrecntIpService {
  private apiUrl = 'https://ipwho.is/';
  ipInfoModel: any;

  constructor(private http: HttpClient) {

  }

  getIpLocation(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getCurrentInfoModel(): Observable<any> {
    const request = this.getIpLocation();

    request.subscribe({
      next: (data) => {
        this.ipInfoModel = data;
      },
      error: (err) => {
        console.error('IP Lookup failed:', err);
      }
    });

    return request;
  }
}
