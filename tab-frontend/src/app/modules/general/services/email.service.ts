import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ContactData } from '../models/contact-form';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private http: HttpClient) {
    // this.headers.set("Accept-Encoding", "gzip, deflate, br");
  }

  async sendEmailAsync(body: ContactData): Promise<any> {

    let headers: HttpHeaders = new HttpHeaders();

    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Accept', 'application/json');
    headers.set('Connection', 'keep-alive');
    //headers.set('Transfer-Encoding', 'gzip, chunked')
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Strict-Origin-When-Cross-Origin', '*');

    return await this.http.post<ContactData>(`${environment.apiUrl}emails/send`,
      body,
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
          , 'Accept': 'application/json; charset=utf-8'
          //'Transfer-Encoding': 'gzip, chunked'
        },
        withCredentials: false
      }).toPromise();
  }
}
