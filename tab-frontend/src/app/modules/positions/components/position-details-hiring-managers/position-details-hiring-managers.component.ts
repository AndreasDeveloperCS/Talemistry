import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PositionsService } from '../../services/positions.service';
import { ContentService } from '../../../general/services/content.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-position-details-hiring-managers',
    templateUrl: './position-details-hiring-managers.component.html',
    styleUrl: './position-details-hiring-managers.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDetailsHiringManagersComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  hiringManagersList: string[] = [];
  rawInputlValue: string = '';

  constructor(
    public content: ContentService,
    public positionsService: PositionsService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.positionsService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        const source = this.positionsService.model.positionDetails.hiringManagers;
        this.hiringManagersList = typeof source === 'string' ? [source] : source;
        this.cdr.markForCheck();
    });

    const defaultEmail = this.getDefaultHiringManager();
    if(defaultEmail) {
      this.add(defaultEmail);
    }
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  getDefaultHiringManager() {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    if (!userId) {
      return null;
    }
    const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`);
    if (!idToken) {
      return null;
    }

    const decodedToken = this.authService.decodeJWTToken(idToken);
    return decodedToken.user.email;
  }

  async add(rawInput: string) {
    const input: string = rawInput?.trim();
    this.rawInputlValue = '';
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

    if (!isEmail) {
        return;
    } else {
        const alreadyExists = this.hiringManagersList?.some(
          (manager) => manager === input
        );

        if (!alreadyExists) {
          this.hiringManagersList.push(input);
          this.positionsService.notifyUpdate();
        }
    }
  }

  remove(item: string) {
    const index = this.hiringManagersList.findIndex(manager =>
      manager === item
    );

    if (index !== -1) {
      this.hiringManagersList.splice(index, 1);
    } else {
      console.warn('Manager not found:', item);
    }
    this.positionsService.notifyUpdate();
  }
}
