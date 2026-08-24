import { ChangeDetectionStrategy, Component, Inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';
import { Filtering, PaginatedResource, SearchLogicService, Sorting } from '../../../general/services/search-logic.service';
import { SocialMedia, SocialMediaDialogResult } from '../../models/social-media';
import { SocialMediaService } from '../../services/social-media.service';
import { FileData } from 'src/app/modules/general/models/file-data';

@Component({
  selector: 'app-social-media-form',
  templateUrl: './social-media-form.component.html',
  styleUrl: './social-media-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SocialMediaFormComponent implements OnInit {
  @Input()
  public set orderPriority(value: number) {
    this.priorityArray = Array.from(new Array(value), (x, i) => i);
  }

  priorityArray: number[] = [1];
  private validationResult: boolean[] = [];
  private validationCounter: number = 0;
  private validationBehaviorSubject: BehaviorSubject<boolean[]> = new BehaviorSubject<boolean[]>([]);
  public validationBehaviorSubject$ = this.validationBehaviorSubject.asObservable();
  isEdit: boolean = false;
  priorities: number[] = [];
  notificationMessages: string[] = [];

  public inputProfileImageTypes = ['.jpg', '.png', '.bmp', '.jpeg'];

  public fileName = '';

  fileData: FileData = {};

  selectedFile: any;

  imgSrc!: string;

  socialMedia: SocialMedia = new SocialMedia();
  public socialMediaForm: FormGroup;
  socialMediaList: SocialMedia[] = [];
  controlButtonContent: string = "";

  isSelectedProfileImage!: boolean;

  public get extensions() {
    return `${this.inputProfileImageTypes}`;
  }

  constructor(public content: ContentService,
    private formBuilder: FormBuilder,
    public searchLogicService: SearchLogicService,
    private socialMediaService: SocialMediaService,
    @Inject(MAT_DIALOG_DATA)
    public data: SocialMedia,
    public dialog: MatDialog, public dialogRef: MatDialogRef<SocialMediaFormComponent>) {
    this.isEdit = this.data != undefined;
    this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
    this.socialMediaForm = this.formBuilder.group({
      priority: [data?.priority || 1, [Validators.min(1)]],
      name: [data?.name || '', [Validators.required]],
      icon: [data?.icon || ''],
      mainUrl: [data?.mainUrl || '', [Validators.required]],
      imagePath: [data?.imagePath || '']
    });
  }

  ngOnInit(): void {
    this.priorities = Array.from({ length: 100 }, (_, index) => index + 1);

    this.initializeDefaultValue(this.data);
  }

  initializeDefaultValue(data: SocialMedia) {
    if (data) {
      this.socialMedia.name = data.name;
      this.socialMedia.mainUrl = data.mainUrl;
      this.socialMedia.icon = data.icon;
      this.socialMedia.imagePath = data.imagePath;
      this.socialMedia.isVerified = data.isVerified;
      this.socialMedia.priority = data.priority;
      this.socialMedia._id = data._id;
      this.socialMedia.priority = data.priority;
      this.socialMedia.createdDate = data.createdDate;
      this.socialMedia.Key = data.Key;
      this.socialMedia.Bucket = data.Bucket;
      this.socialMedia.imagePath = data.imagePath;
    }
  }

  updateCounter(): void {
    this.validationCounter--;
    if (this.validationCounter == 0)
      this.validationBehaviorSubject.next(this.validationResult);
  }

  async onApply() {
    if (this.socialMediaForm.valid) {
      const socialMediaDialogResult: SocialMediaDialogResult = {
        socialMediaInfo: {
          createdDate: new Date(),
          priority: this.socialMedia.priority,
          icon: this.socialMedia.icon,
          name: this.socialMedia.name,
          mainUrl: this.socialMedia.mainUrl,
          isVerified: false,
          Bucket: this.socialMedia.Bucket,
          imagePath: this.socialMedia.imagePath,
          Key: this.socialMedia.Key,
          _id: this.socialMedia._id || ''
        },
        fileData: this.fileData
      };
      this.dialogRef.close(socialMediaDialogResult);
    }
  }

  validateContent(socialMedia: SocialMedia) {
    this.validationResult = [];
    this.notificationMessages = [];
    this.validationCounter = 2;
    const formIsValid = this.socialMediaForm.valid;
    if (!formIsValid) {
      this.manageNotificationMessage(this.content.notificationSocialMediaFormNotValid);
    }

    const sorting: Sorting = {
      property: 'name',
      direction: "ASC"
    }
    const filterName: Filtering = this.createValidationFilter("name", `=${socialMedia.name}`);

    this.socialMediaService.getAllAsync(100, 0, sorting, filterName, false).pipe(take(1)).subscribe((result: any) => {
      const isUpdatingValid = this.isUpdateValid(result?.items);
      if (result.totalItems > 0 && !isUpdatingValid) {
        this.manageNotificationMessage(`${this.content.notificationSocialMediaNameExists}. There are ${result.totalItems} with the same name in the database. Please correct.`);
      }
      this.validationResult.push(result.totalItems == 0 || isUpdatingValid);
      this.updateCounter();
    });

    const filterMainUrl: Filtering = this.createValidationFilter("mainUrl", `=${socialMedia.mainUrl}`);

    this.socialMediaService.getAllAsync(100, 0, sorting, filterMainUrl, false).pipe(take(1)).subscribe((result: any) => {
      const isUpdatingValid = this.isUpdateValid(result?.items);
      if (result.totalItems > 0 && !isUpdatingValid) {
        this.manageNotificationMessage(`${this.content.notificationSocialMediaMainUrlExists}. There are ${result.totalItems} with the same URL in the database. Please correct.`);
      }

      this.validationResult.push(result.totalItems == 0 || isUpdatingValid);
      this.updateCounter();
    });
  }

  isUpdateValid(items: SocialMedia[]): boolean {
    return this.isEdit && items && items?.length == 1 && items[0]._id == this.socialMedia._id;
  }

  manageNotificationMessage(message: string) {
    if (!this.notificationMessages.includes(message)) {
      this.notificationMessages.push(message);
      setTimeout(() => {
        const index = this.notificationMessages.indexOf(message, 0);
        if (index > -1) {
          this.notificationMessages.splice(index, 1);
        }
      }, 10000);
    }
  }

  validateProperty(filter: Filtering, sorting: Sorting): Observable<PaginatedResource<SocialMedia>> {
    return this.socialMediaService.getAllAsync(10, 1, sorting, filter, false);
  }

  getPropertyName<T>(obj: T, property: keyof T): string {
    return property as string;
  }

  createValidationFilter(column: any, filterValue: any) {
    const filter: Filtering = [];
    const newFilter = this.searchLogicService.getFilter(column, filterValue);
    if (newFilter)
      filter.push(newFilter);
    return filter;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onFileSelected(event: any) {
    console.log('onFileSelected event', event.srcElement);
    const inputNode: any = event.srcElement;

    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();

      reader.onload = (node: any) => {
        this.fileData = {
          file: node.target.result,
          fileInfo: inputNode.files[0],
          fileName: inputNode.files[0].name,
        };
        this.socialMedia.icon = inputNode.files[0].name;
        this.selectedFile = node.target.result;
        this.imgSrc = URL.createObjectURL(inputNode.files[0]);
      };

      this.fileName = inputNode.files[0].name;
      this.isSelectedProfileImage =
        this.fileName != undefined && this.fileName != null;
      reader.readAsText(inputNode.files[0]);
    }
  }
}

export class ValidationStatus {
  status!: boolean;
  message!: string;
}