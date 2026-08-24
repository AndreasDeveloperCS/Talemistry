import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { ROLES } from 'src/app/modules/authentication/models/roles';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { environment } from '../../../../../environments/environment';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-schedule-dashboard',
  templateUrl: './schedule-dashboard.component.html',
  styleUrl: './schedule-dashboard.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('tabMenu') tabMenu!: ElementRef;
  protected _onDestroy = new Subject<void>();

  currentRoute: string = '';

  routes: { label: string, icon: string, route: string }[] = [
    { label: "Current Calendar", icon: 'event', route: environment.routes.schedule.scheduleCalendar },
    { label: "Schedule Management", icon: 'calendar_month', route: environment.routes.schedule.scheduleSchedule },
    { label: "Settings", icon: 'settings', route: environment.routes.schedule.scheduleSettings },
  ];

  filteredRoutes: { label: string, icon: string, route: string }[] = [];

  constructor(
    private router: Router,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    public mainAuthService: AuthService,
  ) { }

  ngOnInit(): void {
    if (this.mainAuthService.hasRole([ROLES.TALENT])) {
      this.filteredRoutes = this.routes.filter(r => r.label !== 'Settings');
    } else {
      this.filteredRoutes = this.routes;
    }
    this.cdr.markForCheck();
    this.currentRoute = this.router.url;
    console.log('currentRoute', this.currentRoute);
    this.router.events
      .pipe(takeUntil(this._onDestroy))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.currentRoute = event.urlAfterRedirects;
        }
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    if (this.tabMenu) {
      setTimeout(() => {
        this.tabMenu.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        this.cdr.markForCheck();
      }, 0);
    }

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.tabMenu) {
          setTimeout(() => {
            this.tabMenu.nativeElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
            this.cdr.markForCheck();
          }, 0);
        }
      });
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  isActive(route: string): boolean {
    const segments = this.currentRoute.split('/');
    const lastSegment = segments[segments.length - 1];
    return lastSegment === route;
  }
}
