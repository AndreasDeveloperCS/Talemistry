import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class CvPreviewService {
  private modeSubject = new BehaviorSubject<'sample' | 'user'>('sample');
  mode$ = this.modeSubject.asObservable();

  setMode(mode: 'sample' | 'user') {
    this.modeSubject.next(mode);
  }

  get mode() {
    return this.modeSubject.value;
  }
}