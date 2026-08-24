import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, take, takeUntil } from 'rxjs';
import { User } from 'src/app/modules/authentication/models/user';
import { LazySectionDirective } from 'src/app/modules/general/directives/lazy-section.directive';
import { environment } from '../../../../../environments/environment';
import { NotificationWindowComponent } from '../../../general/dialogs/notification-window/notification-window.component';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { UserProfileService } from '../../../profiles/user-profile/services/user-profile.service';
import { SkillType } from '../../../skills/models/skill';
import { CandidateUserProfile } from '../../models/candidate-user-profile';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';

@Component({
  selector: 'app-career-path',
  templateUrl: './career-path.component.html',
  styleUrl: './career-path.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CareerPathComponent implements OnInit, OnDestroy {
  userId: any = sessionStorage.getItem(`${environment.storage.userId}`);
  protected _onDestroy = new Subject<void>();
  panelOpenState = false;
  skill: string = 'My Skill';
  currentSkillType: SkillType = SkillType.hard;
  currentUser: User = new User();

  _profileModel: any;
  loading: boolean = false;

  socialVisible: boolean = false;
  cvParserVisible: boolean = false;
  cvsVisible: boolean = false;
  goalsVisible: boolean = false;
  skillsVisible: boolean = false;
  hardSkillsVisible: boolean = false;
  softSkillsVisible: boolean = false;
  domainSkillsVisible: boolean = false;
  managerialSkillsVisible: boolean = false;
  languageSkillsVisible: boolean = false;
  motivationVisible: boolean = false;
  additionalVisible: boolean = false;

  sections = [
    { id: 'cvParser', title: 'AI CV Parser', icon: 'auto_awesome' },
    { id: 'cvs', title: 'CVs & CLs', icon: 'description' },
    { id: 'social', title: 'My Social Media', icon: 'link' },
    { id: 'goals', title: 'Goals & Objectives', icon: 'my_location' },
    { id: 'motivation', title: 'Motivation', icon: 'emoji_events' },
    { id: 'skills', title: 'Skills & Expertise', icon: 'psychology' },
    { id: 'experience', title: 'Experience & Education', icon: 'school' },
    { id: 'additional', title: 'Additional Info', icon: 'info' }
  ];
  
  public get profileModel() {
    return this._profileModel;
  }

  public set profileModel(value: any) {
    this._profileModel = value;
  }

  constructor(
    public service: CandidateUserProfileService,
    public userService: UserProfileService,
    public content: ContentService,
    public changeDetectorRef: ChangeDetectorRef,
    public dialogHelper: DialogHelperService,
    public dialog: MatDialog,
  ) {
    this.service.restoreCacheIntoCurrentState();
  }

  // ngOnInit(): void {
  //   console.log('User Id', this.userId);
  //   if (!this.userId) {
  //     return;
  //   }
  //   this.loading = true;

  //   this.service
  //     .getByIdAsync(this.userId, true)
  //     .pipe(takeUntil(this._onDestroy))
  //     .subscribe({
  //       next: (candidateProfile: CandidateUserProfile) => {
  //         if(candidateProfile) {
  //           this.service.model = candidateProfile;
  //           this.currentUser = candidateProfile.user;
  //         } else {
  //           this.service.model = new CandidateUserProfile();
  //         }
  //         console.log('Model CandidateUserProfile', this.service.model);
  //         this.loading = false;
  //         this.changeDetectorRef.markForCheck();
  //       },
  //       error: (err) => {
  //         console.error('Error loading data', err);
  //         this.loading = false;
  //         this.changeDetectorRef.markForCheck();
  //       },
  //     });
  // }

  ngOnInit(): void {
    if (!this.userId) {
      return;
    }

    this.loading = true;

    this.service.loadProfile(this.userId)
    .pipe(takeUntil(this._onDestroy))
    .subscribe({
      next: (profile: CandidateUserProfile) => {
        this.service.model = profile;
        this.currentUser = profile.user;
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      }
    });
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  switchSkillType(newType: SkillType) {
    this.currentSkillType = newType;
  }

  async save() {
    this.service.model.userId = this.userId;

    if (this.service.model._id) {

      this.service
        .updateAsync(this.service.model, true, false)
        .pipe(take(1))
        .subscribe((result: any) => {
          this.dialog.open(NotificationWindowComponent, 
            { data: { message: "Profile has been successfully updated!" } }
          );
          console.log('updated candidate profile model ', result);
          this.service.reloadProfile(this.userId);
          this.service.saveCacheCurrentStateIntoInternalStorage();
          this.changeDetectorRef.markForCheck();
        });
    } else {

      this.service
        .createAsync(this.service.model, true, false)
        .pipe(take(1))
        .subscribe((result: CandidateUserProfile) => {
          if(result) {
            this.dialog.open(NotificationWindowComponent, 
              { data: { message: "Profile has been successfully created!" } }
            );
            console.log('created candidate profile model ', result);
            this.service.model._id = result._id;
            this.service.saveCacheCurrentStateIntoInternalStorage();
            this.changeDetectorRef.markForCheck();
          }
        });
    }
  }

  scrollToSection(id: string) {
    LazySectionDirective.pauseLazyLoading = true;

    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    const offset = 40; 

    const initialTop = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: initialTop, behavior: 'auto' });

    requestAnimationFrame(() => {
      LazySectionDirective.pauseLazyLoading = false;

      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });

      const rect = element.getBoundingClientRect();
      if (rect.top >= 0 && rect.top <= window.innerHeight) {
        element.dispatchEvent(new Event('lazy-trigger'));
      }
    });
  }

  scrollToTop() {
    LazySectionDirective.pauseLazyLoading = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const checkScroll = setInterval(() => {
      if (window.scrollY === 0) {
        clearInterval(checkScroll);
        LazySectionDirective.pauseLazyLoading = false;
        const firstSection = document.querySelector('[appLazySection]');
        firstSection?.dispatchEvent(new Event('lazy-trigger'));
      }
    }, 50);
  }
}
