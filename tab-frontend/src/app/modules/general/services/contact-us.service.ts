import { HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { FormControl, Validators, FormGroup } from "@angular/forms";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { ContactData } from "../models/contact-form";

@Injectable({
  providedIn: "root"
})
export class ContactUsService {

  private headers: HttpHeaders = new HttpHeaders();

  constructor() {
    this.headers.append("Content-Type", "application/json; charset=utf-8");
    this.headers.append("Accept", "application/json; charset=utf-8");
    this.headers.append("Connection", "keep-alive");
    this.headers.append("Accept-Encoding", "gzip, deflate, br");
    //this.headers.append("Access-Control-Allow-Origin", "*")
  }

  postContactData(path: string, data: ContactData): Observable<any> {

    return Observable.create((observer: { next: (arg0: any) => void; complete: () => void; }) => {
      const fullPath = `${environment.apiUrl}${path}`;
      try {
        fetch(`${fullPath}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8"
            , "Accept": "application/json; charset=utf-8"
            // 'Sec-Fetch-Mode': 'no-cors'
            // "Sec-Fetch-Mode" : "same-origin"
            // ,  "Content-Type" : "application/json; charset=utf-8"
            // ,  "Content" : "application/json; charset=utf-8"
            // ,  "Accept" : "application/json; charset=utf-8"
            // ,  "Connection" : "keep-alive"
            , "Transfer-Encoding": "gzip, chunked"
            , "Accept-Encoding": "gzip, chunked, br"
            //, "Access-Control-Allow-Origin": "http://127.0.0.1:4200"
            //, "Origin" : "http://127.0.0.1:4200"
          },
          body: JSON.stringify(data),
          // keepalive: false,
          mode: 'no-cors',
        })
          .then(function (response) {
            // console.log('response', response);
            return response;
          })
          .then(function (data) {
            observer.next(data);
            observer.complete();
            return data;
          })
          .catch(function (error) {
            console.error("Error:", error);
          });
      } catch (ex) {
        console.error("Error:", ex, "\n\n", "path", path, "\n\n", "content");
      }
    });
  }
}
