import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-team-block',
  templateUrl: './team-block.component.html',
  styleUrl: './team-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:  false
})
export class TeamBlockComponent {
  protected _onDestroy = new Subject<void>();

  currentRoute: string = '';

  routes: { label: string, route: string }[] = [
    { label: "Activity Access", route: environment.routes.recruitmentTab.team.recruitmentTeamActivityAccess },
  ];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.currentRoute = this.router.url;
    this.router.events.pipe(takeUntil(this._onDestroy)).subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects;
      }
      this.cdr.markForCheck();
    });
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onTabChanged(event: MatTabChangeEvent): void {
    const route = this.routes[event.index].route;
    this.router.navigate([route]);
  }

  getSelectedTabIndex(): number {
    return this.routes.findIndex(r => this.currentRoute.includes(r.route));
  }
}
