import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PositionSkill } from '../models/position-details';
import { PositionDialogHelperService } from './position-dialog.service';
import { DialogHelperService } from '../../general/services/dialog-helper.service';
import { CRUDService } from '../../general/services/crud.service';
import { OpenPosition } from '../models/position';
import { PositionPageDialogComponent } from '../components/position-page-dialog/position-page-dialog.component';
import { LocalStorageService } from '../../general/services/local-storage.service';
import { IOpenPosition } from '../../interviews/models/chat-message-payload';
import { Router } from '@angular/router';
import { Filtering, PaginatedResource, Sorting } from '../../general/services/search-logic.service';
import { RecruitmentFunnel } from '../../ui-drawer-previews/models/recruitment-funnel';
import { HrDashboardStats } from '../../ui-drawer-previews/models/dashboard-stats';
import { PipelineHealthStats } from '../../ui-drawer-previews/models/pipeline-health-stats';
import { PositionMatchResult } from '../../talent-dashboard/interfaces/position-match.interface';

@Injectable({
  providedIn: 'root'
})
export class PositionsService extends CRUDService<OpenPosition> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.positions}`;

  public model: OpenPosition = new OpenPosition();
  private modelUpdatedSubject = new BehaviorSubject<boolean>(false);
  modelUpdated$ = this.modelUpdatedSubject.asObservable();

  private positionTitleSubject = new BehaviorSubject<boolean>(false);
  public positionTitle$ = this.positionTitleSubject.asObservable();

  private positionSkillsSubject = new BehaviorSubject<boolean>(false);
  public positionSkills$ = this.positionSkillsSubject.asObservable();

  private formDataSubject: BehaviorSubject<any>;
  formData$: Observable<any>;

  constructor(
    http: HttpClient,
    private localStorageService: LocalStorageService,
    public dialogHelper: DialogHelperService,
    private router: Router,
    private positionDialogHelper: PositionDialogHelperService) {
    super(http);
    this.inheritedClassName = this.constructor.name;
    this.formDataSubject = new BehaviorSubject<any>(this.localStorageService.getData('positionFormData') || {});
    this.formData$ = this.formDataSubject.asObservable();
  }

  getByUserIdAsync(userId: string, isProtected: boolean = true): Observable<IOpenPosition[]> {
    console.log('getByUserIdAsync', userId);
    return this.http.get<IOpenPosition[]>(`${this.tartgetUrl}/user/${userId}`, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  getTopPositionMatches(isProtected: boolean = true): Observable<PositionMatchResult[]> {
    return this.http.get<PositionMatchResult[]>(`${this.tartgetUrl}/top-matches`, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }

  notifyUpdate() {
    console.log(this.model);
    this.modelUpdatedSubject.next(true);
  }

  changePositionTitle(newTitle: string) {
    this.model.title = newTitle;
    this.positionTitleSubject.next(true);
  }

  updatePositionSkill(updatedSkill: PositionSkill) {
    let skills = this.model.positionDetails.requirements.positionSkills.filter(skill =>
      skill.skillName !== updatedSkill.skillName || skill.skillType !== updatedSkill.skillType
    );

    skills.push(updatedSkill);

    this.model.positionDetails.requirements.positionSkills = skills;
    this.positionSkillsSubject.next(true);
  }

  closeDialog: EventEmitter<boolean> = new EventEmitter<boolean>();

  updateForm(partialData: any) {
    const updatedData = {
      title: partialData.title,
      positionDetails: {
        company: partialData.company,
        general: {
          ...partialData.positionDetails?.general || {}
        },
        conditions: {
          ...partialData.positionDetails?.conditions || {}
        },
        requirements: {
          ...partialData.positionDetails?.requirements || {}
        }
      }
    };
    console.log('this.model', this.model);
  }

  realText(doc: any): any {
    console.log('doc', doc);
    const extractText = (node: any): string => {
      if (!node) return '';
      if (node.type === 'text') return node.text || '';
      if (Array.isArray(node.content)) {
        return node.content.map(extractText).join('');
      }
      return '';
    };

    const text = extractText(doc);
    return text.trim();
  }

  isRealText(html: string) {
    console.log('html', html);
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    console.log(text, text.trim().length);
    return text.trim().length > 0;
  }

  openNewPosition() {
    const callback = async (data: any) => {
      console.log('PositionDialogService', 'openNewPosition', data);
      if (data === 'addAnotherPosition') {
        this.openNewPosition();
      }
      else {
        console.warn('Dialog closed without providing any data');
      }
    };

    this.positionDialogHelper.openDialog(
      PositionPageDialogComponent,
      callback,
      {
        data: new OpenPosition(),
        isFullScreen: true
      }
    );
  }

  editOpenedPosition(positionId: string) {
    this.getByIdAsync(positionId).pipe(take(1)).subscribe(
      (position: any) => {
        console.log('Editing position:', position);
        this.model = position;
        const callback = (data: any) => {
          if (data === 'addAnotherPosition') {
            this.openNewPosition();
          }
          else {
            console.warn('Dialog closed without providing any data');
          }
        };

        this.positionDialogHelper.openDialog(PositionPageDialogComponent, callback, {
          data: position,
          isFullScreen: true
        });
      },
      error => {
        console.error('Error retrieving post data:', error);
      }
    );
  }

  deleteOpenedPosition(positionId: string) {
    console.log('deleteOpenedPosition', positionId);
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log('Deleting the position');
        const result = this.deleteAsync(positionId, true);
        console.log(result);
      } else {
        console.log('Delete action was cancelled');
      }
    }
    this.dialogHelper.confirmationDialog(executeDelete);
  }

  navigateToPosition(positionId: string) {
    this.router.navigate([environment.routes.positions, positionId]);
  }

  openPositionPage(positionId: string) {
    if (positionId) {
      window.open(this.getPositionLink(positionId), '_blank');
    }
  }

  getPositionLink(positionId: string): string {
    return `${environment.sourceUrl}/${environment.routes.positions}/${positionId}`;
  }

  getAllAsyncForHr(
    pageSize: number,
    pageIndex: number,
    sorting: Sorting,
    filtering: Filtering,
    isProtected: boolean = true,
    pushSubject: boolean = true
  ): Observable<PaginatedResource<any>> {

    console.log('getAllAsyncForHr', this.tartgetUrl);
    const url = `${this.tartgetUrl}/hr?page=${pageIndex}&size=${pageSize}&sortParams=${encodeURIComponent(JSON.stringify(sorting))}&filterParams=${encodeURIComponent(JSON.stringify(filtering))}`

    const request = this.http.get<PaginatedResource<any>>(url, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });

    if (pushSubject) {
      request.pipe(take(1)).subscribe((result: any) => {
        this.dataSubject.next(result);
      });
    }

    return request;
  }

  getAllAsyncForHrFunnel(
    pageSize: number,
    pageIndex: number,
    sorting: Sorting,
    filtering: Filtering,
    isProtected: boolean = true,
    pushSubject: boolean = true
  ): Observable<PaginatedResource<RecruitmentFunnel>> {

    console.log('getAllAsyncForHrFunnel', this.tartgetUrl);
    const url = `${this.tartgetUrl}/hr/funnel?page=${pageIndex}&size=${pageSize}&sortParams=${encodeURIComponent(JSON.stringify(sorting))}&filterParams=${encodeURIComponent(JSON.stringify(filtering))}`

    const request = this.http.get<PaginatedResource<any>>(url, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });

    if (pushSubject) {
      request.pipe(take(1)).subscribe((result: any) => {
        this.dataSubject.next(result);
      });
    }

    return request;
  }

  getHrDashboardStats(isProtected: boolean = true): Observable<HrDashboardStats> {

    console.log('getAllAsyncForHrFunnel', this.tartgetUrl);
    const url = `${this.tartgetUrl}/hr/dashboard-stats`

    const request = this.http.get<HrDashboardStats>(url, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });

    return request;
  }

  getPipelineHealthStats(isProtected: boolean = true): Observable<PipelineHealthStats> {
    console.log('getPipelineHealthStats', this.tartgetUrl);
    const url = `${this.tartgetUrl}/pipeline-health`

    const request = this.http.get<PipelineHealthStats>(url, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });

    return request;
  }

  getAllSavedAsync(
    pageSize: number,
    pageIndex: number,
    sorting: Sorting,
    filtering: Filtering,
    isProtected: boolean = true,
    pushSubject: boolean = true
  ): Observable<PaginatedResource<OpenPosition>> {
    const url = `${this.tartgetUrl}/saved?page=${pageIndex}&size=${pageSize}&sortParams=${encodeURIComponent(JSON.stringify(sorting))}&filterParams=${encodeURIComponent(JSON.stringify(filtering))}`;
    console.log('getAllSavedAsync', url);

    const request = this.http.get<PaginatedResource<OpenPosition>>(url, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });

    if (pushSubject) {
      request.pipe(take(1)).subscribe((result: any) => {
        this.dataSubject.next(result);
      });
    }

    return request;
  }
}
