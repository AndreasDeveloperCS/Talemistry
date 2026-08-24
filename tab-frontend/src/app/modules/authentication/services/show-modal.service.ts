import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShowModalService implements OnDestroy {
  private isSignInModalSubject = new BehaviorSubject<boolean>(false);
  protected _onDestroy = new Subject<void>();
  isSignInModal$ = this.isSignInModalSubject.asObservable();

  constructor(private router: Router) {
    this.router.events.pipe(takeUntil(this._onDestroy)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (this.isSignInModalSubject.getValue()) {
          this.openSignInModal();
        }
      }
    });
  } 

  openSignInModal() {
    this.isSignInModalSubject.next(true);
  }

  closeSignInModal() {
    this.isSignInModalSubject.next(false);
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}
