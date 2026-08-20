import { Injectable, OnDestroy } from '@angular/core';
import { Subject, take } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthGuardService } from '../../authentication/guard/auth-guard.service';
import { AuthService } from '../../authentication/services/auth.service';
import { FUNCTIONALBLOCK } from '../../permissions/models/functional-block-enum';
import { MenuItem } from '../models/menu-item';

@Injectable({
  providedIn: 'root'
})
export class ControlPanelMenuService implements OnDestroy {

  public selectedTabIndex: number = 0;

  protected _onDestroy = new Subject<void>();

  menuItems: MenuItem[] = [];

  constructor(
    public authGuard: AuthGuardService,
    private authService: AuthService
  ) {
    authService.rolesSubject.pipe(take(1)).subscribe((roles: string[]) => {
      this.populateMenuItems();
    });
  }

  populateMenuItems() {
    this.menuItems = [];
    this.generateMenuItem("User Profile", `/${environment.routes.userProfile}`, `/${environment.routes.userProfile}/${sessionStorage.getItem(`${`${environment.storage.userId}`}`)}`, FUNCTIONALBLOCK.USERPROFILES, 'person');
    this.generateMenuItem("Users", "users", `/${environment.routes.adminTab.users.adminUsers}`, FUNCTIONALBLOCK.USERS, 'group');
    this.generateMenuItem("Visitors", "visitors", `/${environment.routes.adminTab.visitors.adminVisitorsList}`, FUNCTIONALBLOCK.VISITORS, 'travel_explore');
    this.generateMenuItem("Social Media", "social-media", `/${environment.routes.adminTab.socialMedia.adminSocialMediaBlock}`, FUNCTIONALBLOCK.SOCIALMEDIA, 'share');
    this.generateMenuItem("Job Platform", "recruitment-platforms", `/${environment.routes.adminTab.recruitmentPlatforms.adminRecruitmentPlatformsBlock}`, FUNCTIONALBLOCK.JOBPLATFORMS, 'work');
    this.generateMenuItem("Universities", "universities", `/${environment.routes.adminTab.universities.adminUniversitiesBlock}`, FUNCTIONALBLOCK.UNIVERSITIES, 'school'); //adminUniversitiesBlock
    this.generateMenuItem("Skills", "skills", `/${environment.routes.adminTab.skills.adminSkillsBlock}`, FUNCTIONALBLOCK.SKILLS, 'build');
    this.generateMenuItem("Blogs", "blogs", `/${environment.routes.adminTab.blogs.adminBlogs}`, FUNCTIONALBLOCK.BLOGS, 'article');
    this.generateMenuItem("Schedule", "schedule", `/${environment.routes.adminTab.schedule.adminScheduleBlockCalendar}`, FUNCTIONALBLOCK.SCHEDULE, 'calendar_today');
    this.generateMenuItem("Brief", "brief", `/${environment.routes.adminTab.brief.adminBrief}`, FUNCTIONALBLOCK.BRIEFTEMPLATE, 'quiz');
    this.generateMenuItem("Companies", "companies", `/${environment.routes.adminTab.companies.adminCompaniesBlock}`, FUNCTIONALBLOCK.COMPANIES, 'business');
    this.generateMenuItem("Positions", "positions", `/${environment.routes.admin}/${environment.routes.adminTab.career}/${environment.routes.adminTab.positionsAdmin}`, FUNCTIONALBLOCK.POSITIONS, 'work_outline');
    this.generateMenuItem("Permissions", "permissions", `/${environment.routes.adminTab.permissions.adminPermissionsList}`, FUNCTIONALBLOCK.PERMISSIONS, 'lock');
  }

  generateMenuItem(
    label: string,
    name: string,
    route: string,
    functionalBlock: FUNCTIONALBLOCK,
    icon?: string) {

    const item: MenuItem = {
      label: label,
      name: name,
      functionalBlock: functionalBlock,
      isAvailable: this.authGuard.isAvailable(functionalBlock),
      route: route,
      icon: icon
    };

    this.menuItems.push(item);
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}