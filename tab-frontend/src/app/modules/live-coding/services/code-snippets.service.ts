import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CRUDService } from '../../general/services/crud.service';
import { CodeSnippet } from '../models/code-snippet.model';

@Injectable({
  providedIn: 'root'
})
export class CodeSnippetService extends CRUDService<CodeSnippet> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.codeSnippets}`;

  private codeSnippetSubject = new BehaviorSubject<CodeSnippet[]>([]);

  codeSnippetSubject$: Observable<CodeSnippet[]> = this.codeSnippetSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http)
  }

  generateCodeSnippet(description: any, language: any, isProtected: true): Observable<any> {
    console.log('generateCodeSnippet', description, language);
    const url = `${this.tartgetUrl}/generate-snippet`
    return this.http.post(
      url, 
      { description, language },
      {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected,
        observe: 'body',
        responseType: 'json',
      }
    );
  }
}