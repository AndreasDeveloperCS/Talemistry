import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CRUDService } from '../../general/services/crud.service';
import { HttpClient } from '@angular/common/http';
import { Skill } from '../models/skill';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SkillsService extends CRUDService<Skill> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.skills}`;

  private skillsSubject = new BehaviorSubject<Skill[]>([]);

  skillsSubject$:Observable<Skill[]> = this.skillsSubject.asObservable();
  
  constructor(http: HttpClient) {
    super(http)
  }
}
