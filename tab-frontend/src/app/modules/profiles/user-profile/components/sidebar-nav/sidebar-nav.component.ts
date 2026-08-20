import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard, FileText, TrendingUp, ClipboardList, Bookmark, CalendarClock, Handshake,
  Code2, CreditCard, User, KanbanSquare, Briefcase, Building2, Users, Lock, Calendar, Gift,
  FileQuestion, Wrench, GraduationCap, Share2, Trophy, UserCircle, Search, ShieldCheck, LogOut,
  Sparkles, Bell, HelpCircle,
} from 'lucide-angular';
import { filter, Observable, Subject, take, takeUntil } from 'rxjs';
import { ROLES } from 'src/app/modules/authentication/models/roles';
import { AuthService, convertRoleToRoute } from 'src/app/modules/authentication/services/auth.service';
import { environment } from 'src/environments/environment';
import { UserProfilePhotoService } from '../../services/user-profile-photo.service';
import { SanitizerUrlPipe } from 'src/app/modules/general/pipes/sanitizer-url.pipe';
import { ThemeSwitcherComponent } from 'src/app/modules/general/components/theme-switcher/theme-switcher.component';

const SIDEBAR_ICONS = {
  LayoutDashboard, FileText, TrendingUp, ClipboardList, Bookmark, CalendarClock, Handshake,
  Code2, CreditCard, User, KanbanSquare, Briefcase, Building2, Users, Lock, Calendar, Gift,
  FileQuestion, Wrench, GraduationCap, Share2, Trophy, UserCircle, Search, ShieldCheck, LogOut,
  Sparkles, Bell, HelpCircle,
};

@Component({
  selector: 'app-sidebar-nav',
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.scss',
  imports: [
    CommonModule, MatIconModule, RouterModule, SanitizerUrlPipe, ThemeSwitcherComponent,
    LucideAngularModule.pick(SIDEBAR_ICONS),
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SidebarNavComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  isLoggedIn$: Observable<boolean>;
  imgSrc: string = '';
  isOpen = false;
  isMobile = false;
  currentRoute = "";
  mobileWidthThreshold: number = 960;
  links!: NavLink[];
  groupedLinks: { label: string; items: NavLink[] }[] = [];
  userId: string = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';

  talentLinks: NavLink[] = [
    { label: 'Dashboard', icon: 'layout-dashboard', group: 'Overview', route: `/${environment.routes.talentTab.dashboard.talentDashboardBlock}` },
    { label: 'Applied Positions', icon: 'file-text', group: 'My Journey', route: `/${environment.routes.talentTab.applicationManagement.talentApplicationManagementBlock}` },
    { label: 'Expertise', icon: 'trending-up', group: 'My Journey', route: `/${environment.routes.talentTab.expertise.talentExpertiseBlock}` },
    { label: 'CV Templates', icon: 'clipboard-list', group: 'My Journey', route: `/${environment.routes.talentTab.cvTempletes.talentCvTempletesMinimalistSingle}` },
    { label: 'Saved', icon: 'bookmark', group: 'My Journey', route: `/${environment.routes.talentTab.saved.talentSavedPositions}` },
    { label: 'Calendar', icon: 'calendar-clock', group: 'Evaluate', route: `/${environment.routes.talentTab.schedule.talentScheduleBlockCalendar}` },
    { label: 'Communication', icon: 'handshake', group: 'Evaluate', route: `/${environment.routes.talentTab.communication.communicationTextChat}` },
    { label: 'Live Coding', icon: 'code-2', group: 'Evaluate', route: `/${environment.routes.talentTab.liveCoding.talentLiveCodingPersonalBlock}/${this.userId}` },
    { label: 'Payments', icon: 'credit-card', group: 'Account', route: `/${environment.routes.talentTab.paymentMethods.talentPaymentMethodsBlock}` },
    { label: 'Profile', icon: 'user', group: 'Account', route: environment.routes.talentTab.profile },
    //{ label: 'Recommendations', icon: 'tips_and_updates', route: `/${environment.routes.talentTab.recommendationManagement.talentRecommendationManagementBlock}` },
  ];

  recruiterLinks: NavLink[] = [
    { label: 'Dashboard', icon: 'layout-dashboard', group: 'Overview', route: `/${environment.routes.recruitmentTab.dashboard.recruitmentDashboardBlock}` },
    { label: "Pipeline Board", icon: "kanban-square", group: 'Recruit', route: `/${environment.routes.recruitmentTab.pipelineBoard.recruitmentPipelineBoardBlock}` },
    { label: 'Positions', icon: 'briefcase', group: 'Recruit', route: `/${environment.routes.recruitmentTab.positionManagement.recruitmentPositionManagementBlock}` },
    { label: 'Calendar', icon: 'calendar-clock', group: 'Recruit', route: `/${environment.routes.recruitmentTab.schedule.recruitmentScheduleBlockCalendar}` },
    { label: 'Communication', icon: 'handshake', group: 'Evaluate', route: `/${environment.routes.recruitmentTab.communication.recruitmentCommunicationTextChat}` },
    { label: 'Live Coding', icon: 'code-2', group: 'Evaluate', route: `/${environment.routes.recruitmentTab.liveCoding.recruitmentLiveCodingPersonalBlock}/${this.userId}` },
    { label: 'Companies', icon: 'building-2', group: 'System', route: `/${environment.routes.recruitmentTab.companyManagement.recruitmentCompanyManagementBlock}` },
    { label: 'Team', icon: 'users', group: 'System', route: `/${environment.routes.recruitmentTab.team.recruitmentTeamActivityAccess}` },
    { label: 'Saved', icon: 'bookmark', group: 'System', route: `/${environment.routes.recruitmentTab.saved.recruitmentSavedPositions}` },
    { label: 'Payments', icon: 'credit-card', group: 'Account', route: `/${environment.routes.recruitmentTab.paymentMethods.recruitmentPaymentMethodsBlock}` },
    { label: 'Profile', icon: 'user', group: 'Account', route: `${environment.routes.recruitmentTab.profile}` },
  ];

  interviewerLinks: NavLink[] = [
    { label: 'Dashboard', icon: 'layout-dashboard', group: 'Overview', route: `/${environment.routes.interviewerTab.dashboard.interviewerDashboardBlock}` },
    { label: 'Calendar', icon: 'calendar-clock', group: 'Evaluate', route: `/${environment.routes.interviewerTab.schedule.interviewerScheduleBlockCalendar}` },
    { label: 'Communication', icon: 'handshake', group: 'Evaluate', route: `/${environment.routes.interviewerTab.communication.communicationTextChat}` },
    { label: 'Live Coding', icon: 'code-2', group: 'Evaluate', route: `/${environment.routes.interviewerTab.liveCoding.interviewerLiveCodingPersonalBlock}/${this.userId}` },
    { label: 'Payments', icon: 'credit-card', group: 'Account', route: `/${environment.routes.interviewerTab.paymentMethods.interviewerPaymentMethodsBlock}` },
    { label: 'Profile', icon: 'user', group: 'Account', route: `${environment.routes.interviewerTab.profile}` },
  ];

  adminLinks: NavLink[] = [
    { label: 'Dashboard', icon: 'layout-dashboard', group: 'Overview', route: `/${environment.routes.adminTab.dashboard.adminDashboardBlock}` },
    { label: 'Profile', icon: 'user', group: 'Overview', route: environment.routes.adminTab.profile },
    { label: 'Users', icon: 'users', group: 'People', route: `/${environment.routes.adminTab.users.adminUsers}` },
    { label: 'Permissions', icon: 'lock', group: 'People', route: `/${environment.routes.adminTab.permissions.adminPermissionsList}` },
    { label: 'Companies', icon: 'building-2', group: 'People', route: `/${environment.routes.adminTab.companies.adminCompaniesBlock}` },
    { label: 'Schedule', icon: 'calendar', group: 'Recruit', route: `/${environment.routes.adminTab.schedule.adminScheduleBlockCalendar}` },
    { label: 'Positions', icon: 'briefcase', group: 'Recruit', route: `${environment.routes.adminTab.career}/${environment.routes.adminTab.positionsAdmin}` },
    { label: 'Benefits', icon: 'gift', group: 'Recruit', route: `/${environment.routes.adminTab.positionBenefits.adminPositionBenefitsBlock}` },
    { label: 'Screening', icon: 'file-question', group: 'Recruit', route: `/${environment.routes.adminTab.screeningQuestionnaires.adminScreeningQuestionnairesBlock}` },
    { label: 'Communication', icon: 'handshake', group: 'Content', route: `/${environment.routes.adminTab.communication.adminCommunicationTextChat}` },
    { label: 'Skills', icon: 'wrench', group: 'Content', route: `/${environment.routes.adminTab.skills.adminSkillsBlock}` },
    { label: 'Universities', icon: 'graduation-cap', group: 'Content', route: `/${environment.routes.adminTab.universities.adminUniversitiesBlock}` },
    { label: 'Job Platform', icon: 'share-2', group: 'Content', route: `/${environment.routes.adminTab.recruitmentPlatforms.adminRecruitmentPlatformsBlock}` },
    { label: 'Motivation', icon: 'trophy', group: 'Content', route: `/${environment.routes.adminTab.motivationalFactors.adminMotivationalFactorsBlock}` },
    { label: 'Social Media', icon: 'share-2', group: 'Content', route: `/${environment.routes.adminTab.socialMedia.adminSocialMediaBlock}` },
    { label: 'Payment Methods', icon: 'credit-card', group: 'Account', route: '/payment-methods' },
  ];

  constructor(private router: Router,
    private mainAuthService: AuthService,
    private cdr: ChangeDetectorRef,
    private userProfilePhotoService: UserProfilePhotoService,
  ) {
    this.isLoggedIn$ = this.mainAuthService.loginStatus$;
  }

  ngOnInit() {
    this.checkScreenSize()
    this.currentRoute = this.router.url

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd))
      .pipe(takeUntil(this._onDestroy)).subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
        if (this.isMobile) {
          this.isOpen = false;
        }
      });

    this.mainAuthService.loginStatus$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(isLogged => {
        if (isLogged) {
          this.loadPhoto();
        }
      });

    this.links = this.resolveLinksByRole();
    this.groupedLinks = groupLinks(this.links);
  }

  private loadPhoto() {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    if (!userId) return;

    this.userProfilePhotoService
      .getPhotoUrlByIdAsync(userId, true)
      .pipe(take(1))
      .subscribe({
        next: (photo) => {
          this.imgSrc = photo?.url || '';
          this.cdr.markForCheck();
        },
        error: () => {
          this.imgSrc = '';
          this.cdr.markForCheck();
        }
      });
  }

  openProfilePage() {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    if (!userId) {
      return;
    }

    const roles = this.mainAuthService.getRoles();
    if (roles?.length) {
      this.router.navigate([
        environment.routes.userProfile,
        userId,
        convertRoleToRoute(roles),
      ]);
    }
  }

  private resolveLinksByRole(): NavLink[] {
    const idToken = sessionStorage.getItem(
      `${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`
    ) ?? '';
    const roles = this.mainAuthService.decodeJWTToken(idToken).user.role;

    if (roles.includes(ROLES.HR) || roles.includes(ROLES.HM) || roles.includes(ROLES.RC)) {
      return this.recruiterLinks;
    } else if (roles.includes(ROLES.TALENT)) {
      return this.talentLinks;
    } else if (roles.includes(ROLES.INTERVIEWER)) {
      return this.interviewerLinks;
    } else if (roles.includes(ROLES.SA) || roles.includes(ROLES.ADMIN)) {
      return this.adminLinks;
    }

    return [];
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  @HostListener("window:resize")
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < this.mobileWidthThreshold;
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  isActive(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  onMainPage() {
    this.router.navigate(['/']);
  }

  onPositions() {
    this.router.navigate([environment.routes.positions]);
  }

  navigateToPrivacyPolicy() {
    this.router.navigate([environment.routes.privacyPolicy]);
  }

  navigateToPricingPlans() {
    this.router.navigate([environment.routes.pricingPlans]);
  }

  logOut() {
    this.mainAuthService.logout();
  }
}

export interface NavLink {
  label: string;
  icon: string;
  route: string;
  group: string;
}

/** Groups links by their `group` field, preserving first-seen group order. */
export function groupLinks(links: NavLink[]): { label: string; items: NavLink[] }[] {
  const order: string[] = [];
  const byGroup = new Map<string, NavLink[]>();
  for (const link of links) {
    if (!byGroup.has(link.group)) {
      byGroup.set(link.group, []);
      order.push(link.group);
    }
    byGroup.get(link.group)!.push(link);
  }
  return order.map((label) => ({ label, items: byGroup.get(label)! }));
}