import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-communication',
  standalone: false,
  templateUrl: './communication.component.html',
  styleUrl: './communication.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommunicationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tabMenu') tabMenu!: ElementRef;

  protected _onDestroy = new Subject<void>();
  isAllowed: boolean = true; //sessionStorage.getItem(environment.storage.userId) == "67e284e41e4877d0c8f10cc9";
  currentRoute: string = '';
  private currentSectionKey: string = '';
  userId = sessionStorage.getItem(`${environment.storage.userId}`);
  talents: any[] = [];

  routes: { label: string, icon: string, route: string, activeRoutes: string[] }[] = [
    {
      label: 'Chats & Calls',
      icon: 'forum',
      route: environment.routes.communication.textChat,
      activeRoutes: [
        environment.routes.communication.textChat,
        environment.routes.communication.videoChat,
        environment.routes.communication.room,
      ]
    },
    {
      label: 'Interviews',
      icon: 'support_agent',
      route: environment.routes.communication.interviews,
      activeRoutes: [environment.routes.communication.interviews]
    },
  ];

  constructor(
    private router: Router,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.currentRoute = this.router.url;
    this.currentSectionKey = this.getSectionKey(this.currentRoute);
    console.log('currentRoute', this.currentRoute);
    this.router.events
      .pipe(takeUntil(this._onDestroy))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          const nextRoute = event.urlAfterRedirects;
          const nextSectionKey = this.getSectionKey(nextRoute);
          const shouldScrollIntoView = nextSectionKey !== this.currentSectionKey;

          this.currentSectionKey = nextSectionKey;
          this.currentRoute = nextRoute;

          if (shouldScrollIntoView) {
            this.scrollTabMenuIntoView();
          }
        }

        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    this.scrollTabMenuIntoView();
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  isActive(item: { activeRoutes: string[] }): boolean {
    const currentRoute = this.currentRoute.toLowerCase();
    return item.activeRoutes.some(route => currentRoute.includes(`/${route.toLowerCase()}`));
  }

  private getSectionKey(url: string): string {
    const currentRoute = String(url || '').toLowerCase();
    const currentItem = this.routes.find((item) => item.activeRoutes.some((route) => currentRoute.includes(`/${route.toLowerCase()}`)));

    return currentItem?.route || currentRoute;
  }

  private scrollTabMenuIntoView(): void {
    if (!this.tabMenu) {
      return;
    }

    setTimeout(() => {
      this.tabMenu.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      this.cdr.markForCheck();
    }, 0);
  }
}