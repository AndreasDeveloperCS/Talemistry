import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject, Subscription, take, takeUntil } from 'rxjs';
import { SocialMedia, UserSocialMedia, UserSocialMediaForm } from '../../../social-media/models/social-media';
import { Filtering, PaginatedResource, SearchLogicService, Sorting } from '../../../general/services/search-logic.service';
import { ContentService } from '../../../general/services/content.service';
import { SocialMediaService } from '../../../social-media/services/social-media.service';

@Component({
  selector: 'app-link-form',
  templateUrl: './link-form.component.html',
  styleUrl: './link-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkFormComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();

  notificationMessages: string[] = [];
  controlButtonContent: string = "";
  userSocialMedia!: UserSocialMedia;

  socialMediaListAsync!: Observable<SocialMedia[]>;

  userSocialMediaForm: FormGroup<UserSocialMediaForm>;
  isEdit: boolean;
  dataSubscription!: Subscription;
  filterControl!: FormControl;

  page: number = 0;
  limit: number = 10;
  totalItems: number = 0;
  isLoading: boolean = false;
  filtering: Filtering = [];
  sorting: Sorting = { property: 'priority', direction: 'ASC' };
  socialMediaList: SocialMedia[] = [];

  constructor(private formBuilder: FormBuilder,
    public content: ContentService,
    @Inject(MAT_DIALOG_DATA)
    public data: UserSocialMedia,
    public service: SocialMediaService,
    public searchLogicService: SearchLogicService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<LinkFormComponent>) {

    this.isEdit = this.data != undefined;
    this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
    console.log('LinkFormComponent data', this.data);
    this.userSocialMedia = this.data != undefined ? this.data : new UserSocialMedia();
    this.userSocialMediaForm = this.formBuilder.group<UserSocialMediaForm>({
      name: new FormControl('', [Validators.required]),
      icon: new FormControl('', [Validators.required]),
      type: new FormControl(new SocialMedia(), [Validators.required]),
      profileLink: new FormControl('', [Validators.required]),
    });

    this.filterControl = new FormControl('', [
      Validators.pattern(/^(?!\s*$).+/),
    ]);

  }
  ngOnInit(): void {
    this.populateCollection();
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  updateCollection(data: PaginatedResource<SocialMedia>) {
    if (data.totalItems) {
      this.totalItems = data.totalItems;
    }
    console.log('data items', data.items);
    if (data.items) {

      this.socialMediaList = this.socialMediaList.concat(...data.items.filter(item => !this.socialMediaList.find(element => {
        return item.name == element.name;
      })));
      console.log('socialMediaList', this.socialMediaList);
      this.preselectType();
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  populateCollection() {
    this.service.getAllAsync(10, this.page, this.sorting, this.filtering, true)
      .pipe(takeUntil(this._onDestroy))
      .subscribe(this.updateCollection.bind(this));
    this.cdr.markForCheck();
  }

  preselectType() {
    if(this.data) {
      this.selectMedia({ value: this.userSocialMedia.type });
    } else {
      const randomIndex = Math.floor(Math.random() * this.socialMediaList.length);
      this.selectMedia({ value: this.socialMediaList[randomIndex] });
      let selected;
      selected = this.socialMediaList[randomIndex]; 
      if (!selected && this.socialMediaList.length) {
        selected = this.socialMediaList[0];
      }
      this.userSocialMediaForm.patchValue({ type: selected });   
      this.userSocialMedia.type = selected;
    }
    this.cdr.markForCheck();
  }

  onScroll($event: any) {
    const bottomReached = ($event.target.offsetHeight + $event.target.scrollTop) >= $event.target.scrollHeight * 0.95;
    if (bottomReached) {
      this.loadSocialMedia();
    }
  }

  applyLocalFilter($event: Event, column: string) {
    this.filtering.splice(0, this.filtering.length);
    if (!this.isFilterEmpty()) {
      this.page = 0;

      const filterValue = this.filterControl.value;
      const newFilter = this.searchLogicService.getFilter(column, filterValue);

      if (newFilter) {
        this.filtering.push(newFilter);
      }

      this.service.getAllAsync(10, this.page, this.sorting, this.filtering, true).pipe(take(1))
        .subscribe((data: PaginatedResource<SocialMedia>) => {
          if (data.totalItems) {
            this.totalItems = data.totalItems;
            this.cdr.markForCheck();
          }
          if (data.items) {
            this.socialMediaList = this.socialMediaList.concat(...data.items.filter(item => !this.socialMediaList.find(element => {
              return item.name == element.name;
            })));
            this.socialMediaList = this.socialMediaList.filter(item => data.items?.some(element => {
              return item.name == element.name;
            }));

            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });

    } else {
      this.populateCollection();
    }
  }

  isFilterEmpty() {
    return this.filterControl?.value == "";
  }

  isNextListPopulationAllowed() {
    return this.isLoading || (this.socialMediaList.length >= this.totalItems && this.totalItems !== 0);
  }

  moveUp() {
    this.userSocialMedia.priority -= 1;
  }

  moveDown() {
    this.userSocialMedia.priority += 1;
  }

  loadSocialMedia() {
    if (!this.isFilterEmpty()) {
      return;
    }
    if (this.isNextListPopulationAllowed()) {
      return;
    }
    this.filtering = [];
    this.isLoading = true;
    this.page++;
    this.service.getAllAsync(10, this.page, this.sorting, this.filtering, true).pipe(take(1)).subscribe(this.updateCollection.bind(this));
    this.cdr.markForCheck();
  }

  async selectMedia($event: any) {
    // console.log('selectMedia', $event);
  }

  async filterSocialMedia($event: any) {
    // console.log('filterSocialMedia', $event);
  }

  async onApply() {
    this.data = this.userSocialMedia;
    this.dialogRef.close(this.data);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  update($event: any) {
    this.userSocialMedia.priority = $event;
  }

  compareSocialMedia = (a: any, b: any) => {
    return a && b && a.id === b.id; 
  };
}
