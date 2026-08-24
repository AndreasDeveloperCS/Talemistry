import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CRUDService } from './crud.service';

@Injectable({
  providedIn: 'root'
})
export class ChatGptService extends CRUDService<any> {
  public override tartgetUrl = `${environment.apiUrl}${environment.serverPaths.chatGpt}`;

  constructor(http: HttpClient) { 
    super(http);
  }

  generateChatGptContent(topic: any, isImageNeeded: boolean): Observable<any> {
    console.log('Service Chat GPT', isImageNeeded);
    return this.http.post(`${this.tartgetUrl}/${environment.serverPaths.generateContent}`, 
      { params: { topic, isImageNeeded } },
      {
        headers: this.getHttpHeaders(true),
        withCredentials: true,
        observe: 'body',
        reportProgress: true,
        responseType: 'json',
      }
    );
  }

  generateOpenPosition(payload: any): Observable<any> {
    console.log('ChatGptService generateOpenPosition', payload);
    return this.http.post(`${this.tartgetUrl}/${environment.serverPaths.generateOpenPosition}`,
      { payload },
      {
        headers: this.getHttpHeaders(true),
        withCredentials: true,
        observe: 'body',
        reportProgress: true,
        responseType: 'json',
      }
    );
  }
}