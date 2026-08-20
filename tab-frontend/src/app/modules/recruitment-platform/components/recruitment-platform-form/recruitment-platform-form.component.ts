
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subject, take } from 'rxjs';
import { RecruitmentPlatform } from '../../models/recruitment-platform';
import { RecruitmentPlatformService } from '../../services/recruitment-platform.service';
import { LinkedInAuthService } from '../../services/linkedin-auth.service';
import { ContentService } from '../../../general/services/content.service';
import { Filtering, PaginatedResource, SearchLogicService, Sorting } from '../../../general/services/search-logic.service';
import { SkillFormComponent } from '../../../skills/components/skill-form/skill-form.component';
import { FileData } from 'src/app/modules/general/models/file-data';

@Component({
  selector: 'app-recruitment-platform-form',
  templateUrl: './recruitment-platform-form.component.html',
  styleUrl: './recruitment-platform-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentPlatformFormComponent implements OnInit, OnDestroy {
  @Input()
  public set orderPriority(value: number) {
    this.priorityArray = Array.from(new Array(value), (x, i) => i);
  }

  priorityArray: number[] = [1];
  protected _onDestroy = new Subject<void>();
  private validationResult: boolean[] = [];
  private validationCounter: number = 0;
  private validationBehaviorSubject: BehaviorSubject<boolean[]> = new BehaviorSubject<boolean[]>([]);
  public validationBehaviorSubject$ = this.validationBehaviorSubject.asObservable();

  recruitmentPlatform: RecruitmentPlatform = new RecruitmentPlatform();
  public recruitmentPlatformForm: FormGroup;
  recruitmentPlatformList: RecruitmentPlatform[] = [];
  private phoneRegx = /^[+]?[\d]{0,3}[\s]?[(]?[\d]{1,3}[)]?[\s]?[\d\s]{7,12}$/;
  controlButtonContent: string = "";
  public inputProfileImageTypes = ['.jpg', '.png', '.bmp', '.jpeg'];
  public fileName = '';
  fileData: FileData = {};
  selectedFile: any;
  imgSrc!: string;
  notificationMessages: string[] = [];
  isEdit: boolean = false;
  priorities: number[] = [];
  isSelectedProfileImage!: boolean;

  public get extensions() {
    return `${this.inputProfileImageTypes}`;
  }

  constructor(public content: ContentService,
    private formBuilder: FormBuilder,
    public searchLogicService: SearchLogicService,
    private cdr: ChangeDetectorRef,
    private recruitmentPlatformService: RecruitmentPlatformService,
    private linkedInAuthService: LinkedInAuthService,
    @Inject(MAT_DIALOG_DATA)
    public data: RecruitmentPlatform,
    public dialog: MatDialog, public dialogRef: MatDialogRef<SkillFormComponent>) {
    this.isEdit = this.data != undefined;
    this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
    this.recruitmentPlatformForm = this.formBuilder.group({
      priority: [1, [Validators.min(1)]],
      name: ['', [Validators.required]],
      icon: ['', [Validators.required]],
      site: ['', [Validators.required]],
      apiUrl: ['', [Validators.required]],
      accessToken: ['', [Validators.required]],
      clientId: ['', [Validators.required]],
      clientSecret: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.priorities = Array.from({ length: 100 }, (_, index) => index + 1);
    this.initializeDefaultValue(this.data);
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  initializeDefaultValue(data: RecruitmentPlatform) {
    if (data) {
      this.recruitmentPlatform.name = data.name;
      this.recruitmentPlatform.site = data.site;
      this.recruitmentPlatform.apiUrl = data.apiUrl;
      this.recruitmentPlatform.accessToken = data.accessToken;
      this.recruitmentPlatform.clientId = data.clientId;
      this.recruitmentPlatform.clientSecret = data.clientSecret;
      this.recruitmentPlatform.icon = data.icon;
      this.recruitmentPlatform.isVerified = data.isVerified;
      this.recruitmentPlatform.priority = data.priority;
      this.recruitmentPlatform._id = data._id;
    }
  }

  updateCounter(): void {
    this.validationCounter--;
    // console.log('updateCounter');
    if (this.validationCounter == 0) {
      this.validationBehaviorSubject.next(this.validationResult);
      this.cdr.markForCheck();
    }
  }

  async onApply() {
    if(this.recruitmentPlatformForm.valid) {
      const platform: RecruitmentPlatform = {
        name: this.recruitmentPlatform.name,
        icon: this.recruitmentPlatform.icon,
        iconInfo: this.recruitmentPlatform.iconInfo || undefined,
        additionalInfo: this.recruitmentPlatform.additionalInfo || undefined,
        site: this.recruitmentPlatform.site || '',
        apiUrl: this.recruitmentPlatform.apiUrl || '',
        clientId: this.recruitmentPlatform.clientId || '',
        clientSecret: this.recruitmentPlatform.clientSecret || '',
        accessToken: this.recruitmentPlatform.accessToken || '',
        priority: this.recruitmentPlatform.priority || 0
      }
      this.dialogRef.close(platform);
    }
    // this.validationBehaviorSubject$.pipe(take(1)).subscribe((validationResult: any) => {
    //   // console.log(this.recruitmentPlatformForm);

    //   if (this.recruitmentPlatformForm.valid && validationResult.length == 2 && !validationResult.includes(false)) {
    //     // console.log('Recruitment Platform', this.data, this.recruitmentPlatform);

    //     if (this.isEdit) {
    //       if (this.fileData.file) {
    //         this.recruitmentPlatformService.updatePayloadAsync(this.recruitmentPlatform, true, this.fileData);
    //       } else {
    //         this.recruitmentPlatformService.updateAsync(this.recruitmentPlatform, true);
    //       }
    //     } else {
    //       // console.log('Submitting data:', this.recruitmentPlatform, true, this.fileData);
    //       this.recruitmentPlatformService.createPayloadAsync(this.recruitmentPlatform, true, this.fileData);
    //     }
    //     this.dialogRef.close();
    //   }
    // });
    //this.validateContent(this.recruitmentPlatform);
  }

  validateContent(recruitmentPlatform: RecruitmentPlatform) {
    this.validationResult = [];
    this.notificationMessages = [];
    this.validationCounter = 2;
    const formIsValid = this.recruitmentPlatformForm.valid;
    if (!formIsValid) {
      this.manageNotificationMessage(this.content.notificationRecruitmentPlatformFormNotValid);
    }

    const sorting: Sorting = {
      property: 'name',
      direction: "ASC"
    }
    const filterName: Filtering = this.createValidationFilter("name", `=${recruitmentPlatform.name}`);

    this.recruitmentPlatformService.getAllAsync(100, 0, sorting, filterName, false)
      .pipe(take(1))
      .subscribe((result: any) => {
      const isUpdatingValid = this.isUpdateValid(result?.items);
      if (result.totalItems > 0 && !isUpdatingValid) {
        this.manageNotificationMessage(`${this.content.notificationRecruitmentPlatformNameExists}. There are ${result.totalItems} with the same name in the database. Please correct.`);
      }
      this.validationResult.push(result.totalItems == 0 || isUpdatingValid);
      this.updateCounter();

    });

    const filterSiteUrl: Filtering = this.createValidationFilter("siteUrl", `=${recruitmentPlatform.site}`);

    this.recruitmentPlatformService.getAllAsync(100, 0, sorting, filterSiteUrl, false)
      .pipe(take(1))
      .subscribe((result: any) => {
      const isUpdatingValid = this.isUpdateValid(result?.items);
      if (result.totalItems > 0 && !isUpdatingValid) {
        this.manageNotificationMessage(`${this.content.notificationRecruitmentPlatformMainUrlExists}. There are ${result.totalItems} with the same URL in the database. Please correct.`);
      }

      this.validationResult.push(result.totalItems == 0 || isUpdatingValid);
      this.updateCounter();
    });

  }

  isUpdateValid(items: RecruitmentPlatform[]): boolean {
    return this.isEdit && items && items?.length == 1 && items[0]._id == this.recruitmentPlatform._id;
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

  validateProperty(filter: Filtering, sorting: Sorting): Observable<PaginatedResource<RecruitmentPlatform>> {
    return this.recruitmentPlatformService.getAllAsync(10, 1, sorting, filter, false);
  }

  getPropertyName<T>(obj: T, property: keyof T): string {
    return property as string;
  }

  createValidationFilter(column: any, filterValue: any) {
    const filter: Filtering = [];
    const newFilter = this.searchLogicService.getFilter(column, filterValue);
    if (newFilter) {
      filter.push(newFilter);
    }
    return filter;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onFileSelected(event: any) {
    const inputNode: any = event.srcElement;

    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();

      reader.onload = (node: any) => {
        this.fileData = {
          file: node.target.result,
          fileInfo: inputNode.files[0],
          fileName: inputNode.files[0].name,
        };
        this.recruitmentPlatform.icon = inputNode.files[0].name;
        this.selectedFile = node.target.result;
        this.imgSrc = URL.createObjectURL(inputNode.files[0]);
      };

      this.fileName = inputNode.files[0].name;
      this.isSelectedProfileImage =
        this.fileName != undefined && this.fileName != null;
      reader.readAsText(inputNode.files[0]);
    }
  }

  getLinkedInCode() {
    this.linkedInAuthService.getLinkedInCode();
  }
}
export class ValidationStatus {
  status!: boolean;
  message!: string;
}