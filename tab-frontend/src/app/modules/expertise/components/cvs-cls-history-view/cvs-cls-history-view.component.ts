import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { merge, Subject, take, takeUntil } from 'rxjs';
import { Filtering, Sorting } from 'src/app/modules/general/services/search-logic.service';
import { CoverLetterService } from '../../services/cover-letter.service';
import { CVService } from '../../services/cv.service';
import { DialogHelperService } from 'src/app/modules/general/services/dialog-helper.service';
import { PdfRenderingDialogComponent } from 'src/app/modules/general/components/pdf-rendering-dialog/pdf-rendering-dialog.component';
import { DocxRenderingDialogComponent } from 'src/app/modules/general/components/docx-rendering-dialog/docx-rendering-dialog.component';
import { InfoCV } from '../../models/cv-item';
import { CoverLetterInfo } from '../../models/cover-letter';
import { environment } from 'src/environments/environment';

export interface DocumentHistory {
  cvCount: number;
  clCount: number;
  lastCvUpload: string;
  lastClUpload: string;
}

type DocType = 'cv' | 'cl';

interface DocumentState {
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  hasMore: boolean;
  data: any[];
}

@Component({
  selector: 'app-cvs-cls-history-view',
  templateUrl: './cvs-cls-history-view.component.html',
  styleUrl: './cvs-cls-history-view.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CvsClsHistoryViewComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();  
  filtering: Filtering = [];
  sorting: Sorting = { property: 'createdDate', direction: 'DESC' };
  loadingDocView: boolean = false;
  userId: any = sessionStorage.getItem(`${environment.storage.userId}`);

  expandedSection: 'cv' | 'cl' | null = null;

  cvDocuments = [
    { name: 'CV_v1.pdf', date: 'Jan 12, 2025' },
    { name: 'CV_v2.pdf', date: 'Feb 05, 2025' }
  ];

  clDocuments = [
    { name: 'CL_Google.pdf', date: 'Mar 10, 2025' },
    { name: 'CL_Meta.pdf', date: 'Apr 02, 2025' }
  ];

  documentStates: Record<DocType, DocumentState> = {
    cv: { page: 0, pageSize: 5, total: 0, loading: false, hasMore: true, data: [] },
    cl: { page: 0, pageSize: 5, total: 0, loading: false, hasMore: true, data: [] }
  };

  private readonly initialDocumentState: DocumentState = {
    page: 0, pageSize: 5, total: 0, loading: false, hasMore: true, data: []
  };

  private documentServices!: Record<DocType, any>;
  documentHistoryData: DocumentHistory | null = null;

  constructor(
    public cvService: CVService,
    public coverLetterService: CoverLetterService,
    private cdr: ChangeDetectorRef,
    public dialogHelper: DialogHelperService,
  ) {
    this.documentServices = {
      cv: this.cvService,
      cl: this.coverLetterService
    };
  }
  
  ngOnInit() {
    this.loadHistory();
    merge(
      this.cvService.refreshData,
      this.coverLetterService.refreshData
    )
    .pipe(takeUntil(this._onDestroy))
    .subscribe(() => {
      this.resetDocumentStates();
      if (this.expandedSection) {
        this.loadDocuments(this.expandedSection);
      }
      this.loadHistory();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  resetDocumentStates() {
    this.documentStates = {
      cv: { ...this.initialDocumentState },
      cl: { ...this.initialDocumentState }
    };
  }

  loadHistory() {
    this.cvService
    .getDocumentHistory(this.userId, true)
    .pipe(take(1))
    .subscribe({
      next:(result) => {
        console.log('Document History', result);
        this.documentHistoryData = {
          cvCount: result.cvCount,
          clCount: result.clCount,
          lastCvUpload: this.timeAgo(result.lastCvUpload),
          lastClUpload: this.timeAgo(result.lastClUpload)
        };
        this.cdr.markForCheck();
      }, error: (err) => {
        console.error('Error while receiving document history', err);
        this.cdr.markForCheck();
      }
    });
  }

  timeAgo(date?: string | Date | null): string {
    if (!date) {
      return 'Never';
    }

    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

    return 'Just now';
  }

  toggleSection(section: 'cv' | 'cl'): void {
    const isOpening = this.expandedSection !== section;

    this.expandedSection = isOpening ? section : null;

    if (isOpening) {
      const state = this.documentStates[section];

      if (!state.data.length) {
        this.loadDocuments(section);
      }
    }
    console.log('toggleSection', section, this.expandedSection);
  }

  isExpanded(section: 'cv' | 'cl'): boolean {
    return this.expandedSection === section;
  }

  getAnimationState(section: 'cv' | 'cl'): string {
    console.log('getAnimationState', section, "this.isExpanded(section) ? 'expanded' : 'collapsed'", this.isExpanded(section) ? 'expanded' : 'collapsed');
    return this.isExpanded(section) ? 'expanded' : 'collapsed';
  }

  getDocuments() {
    return this.expandedSection === 'cv' ? this.cvDocuments : this.clDocuments;
  }

  getIcon(): string {
    return this.expandedSection === 'cv' ? 'insert_drive_file' : 'article';
  }


  loadDocuments(type: DocType) {
    const state = this.documentStates[type];

    if (state.loading || !state.hasMore) {
      return;
    }

    state.loading = true;
    const service = this.documentServices[type];

    service
      .getAllAsync(state.pageSize, state.page, this.sorting, this.filtering, true, false)
      .pipe(take(1))
      .subscribe({
        next: (res: any) => {

          console.log(`More ${type} items...`, res);

          state.data = [...state.data, ...res.items];
          state.total = res.totalItems;
          state.hasMore = state.data.length < res.totalItems;

          state.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: Error) => {
          console.error(`Error while receiving ${type}`, err);
          state.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  showMore(type: DocType) {
    this.documentStates[type].page++;
    this.loadDocuments(type);
  }

  showDoc<T extends InfoCV | CoverLetterInfo>(section: 'cv' | 'cl', doc: T) {
    if(section === 'cv') {
      this.showCV(doc as InfoCV);
    } else {
      this.showCL(doc as CoverLetterInfo);
    }
  }

  showCV(attachment: InfoCV) {
    this.loadingDocView = true;
    console.log('attachment', attachment);

    this.cvService.downloadById(attachment._id).pipe(take(1)).subscribe({
      next: (blob: Blob) => {

        console.log('showCV blob', blob);

        const extention = attachment?.cvFileInfo?.originalName?.substring(attachment?.cvFileInfo.originalName?.lastIndexOf('.') + 1);
        if (extention == "pdf") {

          this.dialogHelper.openDialog(PdfRenderingDialogComponent, () => {
            // URL.revokeObjectURL(objectURL);
          }, { data: blob });
        }
        else if (extention == "docx" || extention == "doc") {
          this.dialogHelper.openDialog(DocxRenderingDialogComponent, () => {
            // URL.revokeObjectURL(objectURL);
          }, { data: blob });
        }
        this.cdr.markForCheck();
        setTimeout(() => {
          this.loadingDocView = false;
          this.cdr.markForCheck();
        }, 0);
      },
      error: (error) => {
        console.error('Error fetching the image:', error);
        this.loadingDocView = false;
        this.cdr.markForCheck();
      },
    });
  }

  showCL(attachment: CoverLetterInfo) {
    this.loadingDocView = true;
    console.log('attachment', attachment);

    this.coverLetterService.downloadById(attachment._id).pipe(take(1)).subscribe({
      next: (blob: Blob) => {

        console.log('showCV blob', blob);

        const extention = attachment?.coverLetterFileInfo?.originalName?.substring(attachment?.coverLetterFileInfo.originalName?.lastIndexOf('.') + 1);
        if (extention == "pdf") {

          this.dialogHelper.openDialog(PdfRenderingDialogComponent, () => {
          }, { data: blob });
        }
        else if (extention == "docx" || extention == "doc") {
          this.dialogHelper.openDialog(DocxRenderingDialogComponent, () => {
          }, { data: blob });
        }
        this.cdr.markForCheck();

        setTimeout(() => {
          this.loadingDocView = false;
          this.cdr.markForCheck();
        }, 0);
      },
      error: (error) => {
        console.error('Error fetching the image:', error);
        this.loadingDocView = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteDoc<T extends InfoCV | CoverLetterInfo>(section: 'cv' | 'cl', doc: T) {

    console.log('deleteDoc', section, doc);
    const state = this.documentStates[section];
    const service = this.documentServices[section];

    service.deleteAsync(doc._id, true, false)
    .pipe(take(1))
    .subscribe({
      next: () => {
        state.data = state.data.filter(d => d._id !== doc._id);
        const latest = this.getLatestRecord(state.data);
        state.total--;
        state.hasMore = state.data.length < state.total;
        service.refreshDataBehaviorSubject.next(true);

        this.updateDocumentHistory(section, latest);

        if (latest) {
          service.patchAsync(latest._id, latest, 'isMain', !latest.isMain, true, true);
        } else {
          service.isMainEmmitter.emit(undefined);
        }

        this.cdr.markForCheck();
      }, error: (err: any) => {
        if (err.status !== 404) {
          console.error('Error deleting the item', err);
        }
      }
    });
  }

  private updateDocumentHistory<T extends InfoCV | CoverLetterInfo>(section: 'cv' | 'cl', latest: T) {
    if (this.documentHistoryData) {
      if (section === 'cv') {
        this.documentHistoryData.cvCount = Math.max(0, this.documentHistoryData.cvCount - 1);
        this.documentHistoryData.lastCvUpload = latest
          ? this.timeAgo(latest.createdDate)
          : 'Never';
      }

      if (section === 'cl') {
        this.documentHistoryData.clCount = Math.max(0, this.documentHistoryData.clCount - 1);
        this.documentHistoryData.lastClUpload = latest
          ? this.timeAgo(latest.createdDate)
          : 'Never';
      }
      this.cdr.markForCheck();
    }
  }

  private getLatestRecord<T extends { createdDate?: string }>(records: T[]): T | undefined {
    if (!records?.length) {
      return undefined;
    }

    return records.reduce((latest, current) => {

      if (!latest?.createdDate || !current?.createdDate) {
        return latest;
      }

      return new Date(current.createdDate) > new Date(latest.createdDate) ? current : latest;
    });
  }

  isMain<T extends InfoCV | CoverLetterInfo>(section: 'cv' | 'cl', doc: T) {

    const state = this.documentStates[section];

    const service = section === 'cv' ? this.cvService : this.coverLetterService;

    const newValue = !doc.isMain;

    service.patchAsync(doc._id, doc, 'isMain', newValue, true, true);

    // update local state
    state.data = state.data.map(item => ({
      ...item,
      isMain: item._id === doc._id ? newValue : false
    }));

    if (newValue && section === 'cv') {
      service.isMainEmmitter.emit(doc as any);
    }

    this.cdr.markForCheck();
  }
}