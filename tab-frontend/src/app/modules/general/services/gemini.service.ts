import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private generateGeminiPostUrl = `${environment.apiUrl}gemini/generate`;

  constructor(private http: HttpClient) { }

  generateGeminiPost(topic: any): Observable<any> {
    // console.log('generateGeminiPost topic:', topic);
    return this.http.get(`${this.generateGeminiPostUrl}`, { params: { topic } });
  }
}