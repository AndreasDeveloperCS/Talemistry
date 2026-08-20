import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Currency } from '../../general/models/currency';
import { CRUDService } from '../../general/services/crud.service';
import { DialogHelperService } from '../../general/services/dialog-helper.service';
import { CompensationTimeline } from '../../positions/models/position-details';
import { Skill, SkillType, UserAcademicEducation, UserCertification, UserDomainSkill, UserHardSkill, UserLanguageSkill, UserManagerialSkill, UserOperationalExpirience, UserSoftSkill } from '../../skills/models/skill';
import { CandidateUserProfile, CompensationExpectations, Preferences } from '../models/candidate-user-profile';
import { UserProfilePhotoService } from '../../profiles/user-profile/services/user-profile-photo.service';

@Injectable({
  providedIn: 'root'
})
export class CandidateUserProfileService extends CRUDService<CandidateUserProfile> {
  private profileSubject = new BehaviorSubject<CandidateUserProfile | null>(null);
  profile$ = this.profileSubject.asObservable();

  private loaded = false;
  protected override tartgetUrl = `${environment.apiUrl}${environment.serverPaths.candidateProfile}`;

  public hardSkillType: SkillType = SkillType.hard;
  public softSkillType: SkillType = SkillType.soft;
  public managirialSkillType: SkillType = SkillType.managirial;
  public domainSkillType: SkillType = SkillType.domain;
  public languageSkillType: SkillType = SkillType.language;
  public operationalExperienceSkillType: SkillType = SkillType.operationalExperience;
  public academicEducationSkillType: SkillType = SkillType.academic;
  public certificationSkillType: SkillType = SkillType.certification;

  private _model: CandidateUserProfile = new CandidateUserProfile();

  public get model(): CandidateUserProfile {
    return this._model ?? (this._model = new CandidateUserProfile());
  }

  public set model(value: CandidateUserProfile) {
    this._model = value;
  }

  constructor(http: HttpClient, 
    private dialogHelper: DialogHelperService,
    private userProfilePhotoService: UserProfilePhotoService,
  ) {
    super(http);
    this.inheritedClassName = this.constructor.name;
    this.objectReferenceExceptionsCheck();

  }
  counter = 0
  objectReferenceExceptionsCheck() {

    if (!this.model.preferences) {
      this.model.preferences = new Preferences()
    }

    if (!this.model.preferences.compensationPackage) {
      this.model.preferences.compensationPackage = new CompensationExpectations()
    }

    if (!this.model.preferences.compensationPackage.currency) {
      this.model.preferences.compensationPackage.currency = new Currency()
    }

    if (!this.model.preferences.compensationPackage.minimumMap) {
      this.model.preferences.compensationPackage.minimumMap = new Map<CompensationTimeline, number>();
    }

    if (!this.model.preferences.compensationPackage.comfortMap) {
      this.model.preferences.compensationPackage.comfortMap = new Map<CompensationTimeline, number>();
    }

    if (!this.model.preferences.compensationPackage.internalFunction) {
      this.model.preferences.compensationPackage.internalFunction =
        (map: Map<CompensationTimeline, number>, value: number, timeline: CompensationTimeline) => {
          const conversionFactors: Record<CompensationTimeline, number> = {
            [CompensationTimeline.contract]: 1,
            [CompensationTimeline.annual]: 1,
            [CompensationTimeline.month]: 12,
            [CompensationTimeline.week]: 52,
            [CompensationTimeline.day]: 250,
            [CompensationTimeline.hour]: 2000,
          };

          if (!conversionFactors[timeline]) {
            console.error(`Invalid CompensationTimeline: ${timeline}`);
            return map;
          }

          const annualValue = value * conversionFactors[timeline];

          Object.keys(conversionFactors).forEach((key) => {
            const compTimeline = key as unknown as CompensationTimeline;
            const factor = conversionFactors[compTimeline];
            map.set(compTimeline, annualValue / factor);
          });

          return map;
        }
    }
  }

  saveCacheCurrentStateIntoInternalStorage() {
    const serialization = JSON.stringify(this.model);
    const userID = sessionStorage.getItem(environment.storage.userId);
    localStorage.setItem(`${environment.storage.candidateProfileCache}-${userID}`, serialization);
  }

  restoreCacheIntoCurrentState(): boolean {
    const userID = sessionStorage.getItem(environment.storage.userId);
    const restoredCache = localStorage.getItem(`${environment.storage.candidateProfileCache}-${userID}`);
    if (restoredCache) {
      //this.model = JSON.parse(restoredCache);
      return true;
    } else {
      return false;
    }
  }

  resetCahce() {
    const userID = sessionStorage.getItem(environment.storage.userId);
    const restoredCache = localStorage.removeItem(`${environment.storage.candidateProfileCache}-${userID}`);
  }

  addNewSkillToCollection(skillType: SkillType, skillName: string = ''): Skill {
    const skill = this.getDefaultSkill(skillType, skillName);

    console.log('Received in service:', skill, { skillType, skillName });

    if (skillType == SkillType.hard) {
      this.model.hardSkills.push(skill);
    }

    if (skillType == SkillType.soft) {
      this.model.softSkills.push(skill);
    }
    if (skillType == SkillType.managirial) {
      this.model.managerialSkills.push(skill);
    }

    if (skillType == SkillType.domain) {
      this.model.domainSkills.push(skill);
    }

    if (skillType == SkillType.language) {
      this.model.languagesSkills.push(skill);
    }

    if (skillType == SkillType.academic) {
      this.model.academicEducation.push(skill);
    }
    if (skillType == SkillType.certification) {
      this.model.certification.push(skill);
    }
    if (skillType == SkillType.operationalExperience) {
      this.model.operationalExperience.push(skill);
    }
    this.model.skills.push(skill);
    return skill;
  }

  removeSkill(collection: any, skillName: string, skillType: SkillType) {
    const index = collection.findIndex((element: Skill) => element.skillName == skillName && element.skillType == skillType);
    if (index > -1) {
      collection.splice(index, 1);
    }
  }

  removeSkillById(collection: any, skill: Skill) {
    const index = collection.findIndex((element: Skill) => element._id == skill._id);
    if (index > -1) {
      collection.splice(index, 1);
    }
  }

  removeSkillFromCollectionById(skill: Skill) {
    console.log('removeSkillFromCollectionById', skill);
    const executeDelete = async (data: any) => {
      if (data) {
        this.removeSpecificSkill(skill);
      }
    };
    this.dialogHelper.confirmationDialog(executeDelete);
  }

  removeSpecificSkill(skill: Skill) {
    console.log('removeSpecificSkill', skill);
    this.removeSkillById(this.model.skills, skill);

    switch (skill.skillType) {
      case SkillType.hard:
        this.removeSkillById(this.model.hardSkills, skill);
        break;
      case SkillType.soft:
        this.removeSkillById(this.model.softSkills, skill);
        break;
      case SkillType.managirial:
        this.removeSkillById(this.model.managerialSkills, skill);
        break;
      case SkillType.domain:
        this.removeSkillById(this.model.domainSkills, skill);
        break;
      case SkillType.language:
        this.removeSkillById(this.model.languagesSkills, skill);
        break;
      case SkillType.operationalExperience:
        this.removeSkillById(this.model.operationalExperience, skill);
        break;
      case SkillType.academic:
        this.removeSkillById(this.model.academicEducation, skill);
        break;
      case SkillType.certification:
        this.removeSkillById(this.model.certification, skill);
        break;
      default:
    }
  }

  removeSkillFromCollection(skillType: SkillType, skillName: string) {

    console.log('Removing skill:', skillType, skillName);
    const skill = this.getDefaultSkill(skillType, skillName);

    if (skillType == SkillType.hard) {

      this.removeSkill(this.model.hardSkills, skillName, skillType);
      // return this.enrichSkillEntity(new UserHardSkill(), skillName);
      this.removeSkill(this.model.hardSkills, skillName, skillType);
      // const targetIndex = this.model.hardSkills.findIndex(element => element.skillName == skillName);
      // this.model.hardSkills.splice(targetIndex, 1);
    }

    if (skillType == SkillType.soft) {
      this.removeSkill(this.model.softSkills, skillName, skillType);
      // return this.enrichSkillEntity(new UserSoftSkill(), skillName);
    }

    if (skillType == SkillType.managirial) {
      this.removeSkill(this.model.managerialSkills, skillName, skillType);
      // return this.enrichSkillEntity(new UserManagerialSkill(), skillName);
    }

    if (skillType == SkillType.domain) {
      this.removeSkill(this.model.domainSkills, skillName, skillType);
      // return this.enrichSkillEntity(new UserDomainSkill(), skillName);
    }

    if (skillType == SkillType.language) {
      this.removeSkill(this.model.languagesSkills, skillName, skillType);
      // return this.enrichSkillEntity(new UserLanguageSkill(), skillName);
    }

    if (skillType == SkillType.academic) {
      this.removeSkill(this.model.academicEducation, skillName, skillType);
      return this.enrichSkillEntity(new UserAcademicEducation(), skillName);
    }

    if (skillType == SkillType.certification) {
      this.removeSkill(this.model.certification, skillName, skillType);
      return this.enrichSkillEntity(new UserCertification(), skillName);
    }

    if (skillType == SkillType.operationalExperience) {
      console.log('this.model.operationalExperience', this.model.operationalExperience);
      this.removeSkill(this.model.operationalExperience, skillName, skillType);
      return this.enrichSkillEntity(new UserOperationalExpirience(), skillName);
    }

    this.removeSkill(this.model.skills, skillName, skillType);
    return this.enrichSkillEntity(new Skill(), skillName);

  }

  getDefaultSkill(skillType: SkillType, skillName: string): any {

    if (skillType == SkillType.hard) {
      return this.enrichSkillEntity(new UserHardSkill(), skillName);
    }

    if (skillType == SkillType.soft) {
      return this.enrichSkillEntity(new UserSoftSkill(), skillName);
    }
    if (skillType == SkillType.domain) {
      return this.enrichSkillEntity(new UserDomainSkill(), skillName);
    }
    if (skillType == SkillType.managirial) {
      return this.enrichSkillEntity(new UserManagerialSkill(), skillName);
    }
    if (skillType == SkillType.language) {
      return this.enrichSkillEntity(new UserLanguageSkill(), skillName);
    }
    if (skillType == SkillType.academic) {
      return this.enrichSkillEntity(new UserAcademicEducation(), skillName);
    }
    if (skillType == SkillType.certification) {
      return this.enrichSkillEntity(new UserCertification(), skillName);
    }
    if (skillType == SkillType.operationalExperience) {
      return this.enrichSkillEntity(new UserOperationalExpirience(), skillName);
    }
    return this.enrichSkillEntity(new Skill(), skillName);
  }

  enrichSkillEntity(skill: Skill, skillName: string) {
    skill.skillName = skillName;
    // skill.internalId = Guid.create();
    return skill;
  }

  getFullProfileById(userId: string, isProtected: boolean = true): Observable<CandidateUserProfile> {
    return this.http.get<CandidateUserProfile>(`${this.tartgetUrl}/full/${userId}`, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected,
    });
  }

  loadProfile(userId: string): Observable<CandidateUserProfile> {
    if (this.loaded && this.profileSubject.value) {
      return of(this.profileSubject.value);
    }

    return forkJoin({
      profile: this.getByIdAsync(userId, true),
      photo: this.userProfilePhotoService.getPhotoUrlByIdAsync(userId, true).pipe(
        catchError(err => {
          console.warn('Photo request failed, using default image', err);
          return of({ url: null });
        })
      )
    }).pipe(
      map(({ profile, photo }) => {
        if (profile && profile.user) {
          profile.user.photo = photo?.url || null;
        }
        return profile;
      }),
      tap(profile => {
        this.loaded = true;
        this.profileSubject.next(profile);
      }),
      shareReplay(1)
    );
  }

  reloadProfile(userId: string): Observable<CandidateUserProfile> {
    this.loaded = false;
    return this.loadProfile(userId);
  }

  get profile(): CandidateUserProfile | null {
    return this.profileSubject.value;
  }

  clearCache() {
    this.loaded = false;
    this.profileSubject.next(null);
  }

  openCandidatePage(candidateId: string) {
    if (candidateId) {
      window.open(this.getCandidateLink(candidateId), '_blank');
    }
  }

  getCandidateLink(candidateId: string): string {
    return `${environment.sourceUrl}/${environment.routes.publicProfile}/${candidateId}`;
  }
}