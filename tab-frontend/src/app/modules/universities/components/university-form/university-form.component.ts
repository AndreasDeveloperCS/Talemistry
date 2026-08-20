import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subject, take } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';
import { Filtering, PaginatedResource, SearchLogicService, Sorting } from '../../../general/services/search-logic.service';
import { University } from '../../models/university';
import { UniversityService } from '../../services/university.service';

@Component({
    selector: 'app-university-form',
    templateUrl: './university-form.component.html',
    styleUrl: './university-form.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UniversityFormComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  notificationMessages: string[] = [];
  private validationResult: boolean[] = [];
  private validationCounter: number = 0;
  private validationBehaviorSubject: BehaviorSubject<boolean[]> = new BehaviorSubject<boolean[]>([]);
  public validationBehaviorSubject$ = this.validationBehaviorSubject.asObservable();
  isEdit: boolean = false;
  priorities: number[] = [];

  university: University = new University();
  public universityForm: FormGroup;
  universityList: University[] = [];
  controlButtonContent: string = "";
  validationSubscription: any;

  constructor(public content: ContentService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    public searchLogicService: SearchLogicService,
    private universityService: UniversityService,
    @Inject(MAT_DIALOG_DATA)
    public data: University,
    public dialog: MatDialog, public dialogRef: MatDialogRef<UniversityFormComponent>) {
    this.isEdit = this.data != undefined;
    this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
    this.universityForm = this.formBuilder.group({
      name: [data.name || '', [Validators.required]],
      alpha_two_code: [data.alpha_two_code || '', [Validators.required]],
      country: [data.country || '', [Validators.required]],
      web_pages: [data.web_pages || '', [Validators.required]],
      domains: [data.domains || '', [Validators.required]],
      stateProvince: [data.stateProvince || '', []]
    });
  }

  ngOnInit(): void {
    this.initializeDefaultValue(this.data);
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  updateCounter(): void {
    this.validationCounter--;
    // console.log('updateCounter');
    if (this.validationCounter == 0) {
      this.validationBehaviorSubject.next(this.validationResult);
      this.cdr.markForCheck();
    }
  }

  initializeDefaultValue(data: University) {
    if (data) {
      this.university._id = data._id;
      this.university.name = data.name;
      this.university.alpha_two_code = data.alpha_two_code;
      this.university.country = data.country;
      this.university.web_pages = data.web_pages;
      this.university.domains = data.domains;
      this.university.stateProvince = data.stateProvince;
      this.university.isVerified = data.isVerified;
    }
  }

  async onApply() {
    if(this.universityForm.valid) {
      const university: University= {
        isVerified: true,
        createdDate: new Date(),
        name: this.universityForm.value.name,
        country: this.universityForm.value.country,
        domains: this.universityForm.value.domains,
        web_pages: this.universityForm.value.web_pages,
        alpha_two_code: this.universityForm.value.alpha_two_code,
        stateProvince: this.universityForm.value.stateProvince,
      }
      this.dialogRef.close(university);
    }
    // this.validationBehaviorSubject$.pipe(take(1)).subscribe((validationResult: any) => {  
    //   if (this.universityForm.valid && validationResult.length == 2 && !validationResult.includes(false)) {

    //     if (this.isEdit) {
    //       this.universityService.updateAsync(this.university, true);
    //     } else {
    //       this.universityService.createAsync(this.university, true);
    //     }
    //     this.dialogRef.close();
    //   }
    // });
    // this.validateContent(this.university);
  }

  validateContent(university: University) {
    this.validationResult = [];
    this.notificationMessages = [];
    this.validationCounter = 2;
    const formIsValid = this.universityForm.valid;
    if (!formIsValid) {
      this.manageNotificationMessage(this.content.notificationUniversityFormNotValid);
    }

    const sorting: Sorting = {
      property: 'name',
      direction: "ASC"
    }
    const filterName: Filtering = this.createValidationFilter("name", `=${university.name}`);

    this.universityService.getAllAsync(100, 0, sorting, filterName, false).pipe(take(1)).subscribe((result: any) => {
      const isUpdatingValid = this.isUpdateValid(result?.items);
      if (result.totalItems > 0 && !isUpdatingValid) {
        this.manageNotificationMessage(`${this.content.notificationUniversityNameExists}. There are ${result.totalItems} with the same name in the database. Please correct.`);
      }
      this.validationResult.push(result.totalItems == 0 || isUpdatingValid);
      this.cdr.markForCheck();
      this.updateCounter();
    });
  }

  isUpdateValid(items: University[]): boolean {
    return this.isEdit && items && items?.length == 1 && items[0]._id == this.university._id;
  }

  manageNotificationMessage(message: string) {
    if (!this.notificationMessages.includes(message)) {
      this.notificationMessages.push(message);
      setTimeout(() => {
        const index = this.notificationMessages.indexOf(message, 0);
        if (index > -1) {
          this.notificationMessages.splice(index, 1);
        }
        this.cdr.markForCheck();
      }, 10000);
    }

  }

  validateProperty(filter: Filtering, sorting: Sorting): Observable<PaginatedResource<University>> {
    return this.universityService.getAllAsync(10, 1, sorting, filter, false);
  }

  getPropertyName<T>(obj: T, property: keyof T): string {
    return property as string;
  }

  createValidationFilter(column: any, filterValue: any) {
    const filter: Filtering = [];
    const newFilter = this.searchLogicService.getFilter(column, filterValue);
    if (newFilter) {
      filter.push(newFilter);
      this.cdr.markForCheck();
    }
    return filter;
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

export class ValidationStatus {
    status!: boolean;
    message!: string;
}