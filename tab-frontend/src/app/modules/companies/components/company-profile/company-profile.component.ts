import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subject, forkJoin, take } from 'rxjs';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { WarningsErrorsDialogComponent } from '../../../general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { NotificationWindowComponent } from '../../../general/dialogs/notification-window/notification-window.component';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { FUNCTIONALBLOCK } from '../../../permissions/models/functional-block-enum';
import { CompanyVersion, CompanyVersionDialogResult } from '../../models/company';
import { CompanyPhotoGalleryItem } from '../../models/company-photo-gallery';
import { CompanyPhotoGalleryService } from '../../services/company-photo-gallery.service';
import { CompanyVersionService } from '../../services/company-version.service';
import { CompanyCreationModalComponent } from '../company-creation-modal/company-creation-modal.component';

@Component({
  selector: 'app-company-profile',
  templateUrl: './company-profile.component.html',
  styleUrl: './company-profile.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyProfileComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  companyId!: string;
  private verifiedCompanyId: string | null = null;
  company!: CompanyVersion;
  selectedTabIndex = 0;
  isLoading: boolean = true;

  photoGalleryItems: CompanyPhotoGalleryItem[] = [];
  canEditPhotoGallery = false;
  isPhotoGalleryLoading = false;
  isPhotoUploading = false;
  photoGalleryError: string | null = null;
  private photoGalleryLoadedOnce = false;

  tabs = [
    { label: 'Overview', icon: 'insert_chart_outlined' },
    { label: 'Open Positions', icon: 'work_outline' },
    { label: 'Gallery', icon: 'camera_enhance' },
  ];

  public get canEditItems(): boolean {
    return this.authGuard.canEditItem(FUNCTIONALBLOCK.COMPANIES, this.company);
  }

  constructor(
    private dialogHelper: DialogHelperService,
    private companyService: CompanyVersionService,
    private companyPhotoGalleryService: CompanyPhotoGalleryService,
    private activatedRoute: ActivatedRoute,
    public authGuard: AuthGuardService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.isLoading = true;
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(take(1))
      .subscribe(params => {
        this.companyId = params.get('companyId') || '';
        console.log('Current company ID:', this.companyId);
        if (!this.companyId) {
          return;
        }
        this.getCompanyInfo();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  getCompanyInfo() {
    this.companyService
      .getByIdAsync(this.companyId, true)
      .pipe(take(1))
      .subscribe({
        next: (res: CompanyVersion) => {
          console.log('Company:', res);
          if (res) {
            this.company = res as CompanyVersion;
            // Gallery endpoints are keyed by the underlying Company id (not the company-version id).
            const resolved = (this.company.companyId ?? this.company._id ?? '') as any;
            this.verifiedCompanyId = resolved ? String(resolved) : null;
            this.cdr.markForCheck();
          }
          this.isLoading = false;

          if (this.selectedTabIndex === 2 && this.companyId) {
            this.loadPhotoGallery(false);
          }
        }, error: (err) => {
          console.error('Error getting the company by id', err);
          this.cdr.markForCheck();
          this.isLoading = false;
        }
      });

    window.scrollTo(0, 0);
  }

  editCompany(): void {
    console.log('Editing company:', this.company);
    this.dialogHelper.openDialog(CompanyCreationModalComponent, (result: CompanyVersionDialogResult) => {
      if (result) {
        console.log('Editing company result', result);
        //result.companyInfo = this.company._id;
        this.company.data = result.companyInfo;
        console.log('Before updateAsync', result, this.company._id);
        this.companyService.updatePayloadAsync(this.company._id, result.companyInfo, true, result?.fileData, true)
          .pipe(take(1)).subscribe({
            next: (saved) => {
              console.log('saved', saved);
              this.dialog.open(NotificationWindowComponent, {
                data: { message: "Company has been updated!" }
              });
              this.company = { ...this.company, data: result.companyInfo };
              console.log('Company', this.company);
              this.cdr.markForCheck();
            }, error: (err) => {
              console.error('Error updating company', err);
              this.dialog.open(WarningsErrorsDialogComponent, {
                data: { message: "Error updating company!" }
              });
              this.cdr.markForCheck();
            }
          });
      }
    }, { data: this.company });
  }

  selectTab(index: number) {
    this.selectedTabIndex = index;

    if (index === 2 && this.companyId) {
      this.loadPhotoGallery(false);
    }
  }

  loadPhotoGallery(force: boolean) {
    const companyId = this.verifiedCompanyId ?? this.companyId;
    if (!companyId) return;
    if (this.isPhotoGalleryLoading || this.isPhotoUploading) return;
    if (!force && this.photoGalleryLoadedOnce) return;

    this.isPhotoGalleryLoading = true;
    this.photoGalleryError = null;
    this.cdr.markForCheck();

    forkJoin({
      canEdit: this.companyPhotoGalleryService.canEdit(companyId),
      gallery: this.companyPhotoGalleryService.getGalleryBestEffort(companyId)
    })
      .pipe(take(1))
      .subscribe({
        next: ({ canEdit, gallery }) => {
          this.photoGalleryItems = (gallery?.items ?? []).slice();
          // Keep UI/actions enabled for owners/editors even if the can-edit call fails.
          this.canEditPhotoGallery = !!canEdit?.canEdit || this.canEditItems;
          this.photoGalleryLoadedOnce = true;
          this.isPhotoGalleryLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading photo gallery', err);
          const status = err?.status;
          if (status === 404) {
            this.photoGalleryItems = [];
            this.canEditPhotoGallery = false;
            this.photoGalleryLoadedOnce = true;
            this.photoGalleryError = null;
          } else {
            this.photoGalleryError = 'Failed to load gallery.';
          }
          this.isPhotoGalleryLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onPhotoFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const fileList = input.files;
    input.value = '';

    if (!fileList || fileList.length === 0 || !this.companyId) return;
    if (!(this.canEditItems || this.canEditPhotoGallery)) return;

    const companyId = this.verifiedCompanyId ?? this.companyId;
    if (!companyId) return;

    const { validFiles, errorMessage } = this.validateGalleryFiles(Array.from(fileList));
    if (errorMessage) {
      this.photoGalleryError = errorMessage;
      this.cdr.markForCheck();
      return;
    }

    this.isPhotoUploading = true;
    this.photoGalleryError = null;
    this.cdr.markForCheck();

    this.companyPhotoGalleryService
      .upload(companyId, validFiles)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isPhotoUploading = false;
          this.photoGalleryLoadedOnce = false;
          this.loadPhotoGallery(true);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error uploading gallery photos', err);
          this.photoGalleryError = this.formatGalleryUploadError(err);
          this.isPhotoUploading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private validateGalleryFiles(files: File[]): { validFiles: File[]; errorMessage: string | null } {
    const acceptedTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);
    const maxBytes = 20 * 1024 * 1024;
    const maxFiles = 20;

    const errors: string[] = [];
    const validFiles: File[] = [];

    if (files.length > maxFiles) {
      errors.push(`You can upload up to ${maxFiles} files at once.`);
      files = files.slice(0, maxFiles);
    }

    for (const f of files) {
      if (!acceptedTypes.has(f.type)) {
        errors.push(`Unsupported file type: ${f.name} (${f.type || 'unknown'}). Allowed: PNG, JPG/JPEG, GIF, WEBP.`);
        continue;
      }
      if (f.size > maxBytes) {
        const mb = Math.round((f.size / (1024 * 1024)) * 10) / 10;
        errors.push(`File too large: ${f.name} (${mb} MB). Max: 20 MB.`);
        continue;
      }
      validFiles.push(f);
    }

    return { validFiles, errorMessage: errors.length ? errors.join(' ') : null };
  }

  private formatGalleryUploadError(err: any): string {
    const status = err?.status;
    const apiMessage = err?.error?.message;

    if (status === 0) {
      return 'Upload failed due to a network/CORS error. Please check the browser Network tab for blocked requests.';
    }

    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }

    if (Array.isArray(apiMessage) && apiMessage.length) {
      return apiMessage.join(' ');
    }

    if (status === 401 || status === 403) {
      return 'Upload failed: you are not authenticated or not allowed to edit this company.';
    }

    if (status === 400) {
      return 'Upload failed: the server rejected the files. Please check file types (PNG/JPG/GIF/WEBP) and size (≤20MB).';
    }

    return 'Upload failed. Please try again.';
  }

  deletePhoto(photoId: string) {
    if (!this.companyId || !(this.canEditItems || this.canEditPhotoGallery)) return;

    const companyId = this.verifiedCompanyId ?? this.companyId;
    if (!companyId) return;

    this.companyPhotoGalleryService
      .deleteItem(companyId, photoId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.photoGalleryItems = (res?.items ?? []).slice();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting gallery photo', err);
          this.photoGalleryError = 'Delete failed. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }

  onJobsList() {
    this.selectedTabIndex = 1;
  }
}
