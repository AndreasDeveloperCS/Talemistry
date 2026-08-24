import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import saveAs from 'file-saver';
import { take, takeUntil } from 'rxjs';
import { InfoCV } from '../../models/cv-item';
import { CVService } from '../../services/cv.service';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { Sorting } from '../../../general/services/search-logic.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { PdfRenderingDialogComponent } from '../../../general/components/pdf-rendering-dialog/pdf-rendering-dialog.component';
import { DocxRenderingDialogComponent } from '../../../general/components/docx-rendering-dialog/docx-rendering-dialog.component';

@Component({
  selector: 'app-cv-collection-history',
  templateUrl: './cv-collection-history.component.html',
  styleUrl: './cv-collection-history.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CvCollectionHistoryComponent extends TableTemplateComponent<InfoCV> implements OnInit, OnDestroy {
  public override selectedPageSize: number = 10;
  public override sorting: Sorting = {
    property: 'createdDate',
    direction: "DESC"
  }
  public override sortingProcessed: Sorting = {
    property: 'createdDate',
    direction: "ASC"
  }

  public override displayedColumns: string[] = ['make-main', 'show-cv', 'originalName', 'size', 'fileLastModifiedDate', 'createdDate', 'delete',];
  public override headerNames: Map<string, string> = new Map<string, string>([
    ['originalName', 'Original Name']
    , ['size', 'Size']
    , ['fileLastModifiedDate', 'File Modified']
    , ['createdDate', 'Created']
  ]);

  public getHeaderClass(column: string) {
    const customColums = ['make-main', 'show-cv', 'delete'];
    return customColums.includes(column) ? 'table-content-width-small' : '';
  }

  isPanelOpen: boolean = false;
  loading: boolean = false;

  constructor(public cvService: CVService,
    public dialogHelper: DialogHelperService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    injector: Injector) {
    super(cvService, injector);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.cvService.refreshData.pipe(takeUntil(this._onDestroy)).subscribe(() => {
      this.reloadData();
      this.cdr.markForCheck();
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onPanelToggle(isOpen: boolean) {
    this.isPanelOpen = isOpen;
  }

  delete(rowValue: InfoCV) {
    this.cvService.deleteAsync(rowValue._id, true, false).pipe(take(1)).subscribe(result => {
      this.cvService.refreshData.emit(true);
      if (!(this.dataItems.length > 0)) {
        return
      }
      const isMainCV = this.getLatestRecord(this.dataItems);
      if (isMainCV) {
        this.cvService.isMainEmmitter.emit(isMainCV);
        this.cvService.patchAsync(isMainCV._id, isMainCV, 'isMain', !isMainCV.isMain, true, true);
        this.cdr.markForCheck();
      }
    });
  }
  
  private getLatestRecord(records: InfoCV[]): InfoCV | undefined {
    return records.reduce((previousValue: InfoCV | undefined, currentValue: InfoCV | undefined, currentIndex: number, array: InfoCV[]) => {
      return !(previousValue?.createdDate && currentValue?.createdDate) ? undefined : previousValue.createdDate > currentValue.createdDate ? previousValue : currentValue;
    }, undefined);
  }

  isMain(rowValue: InfoCV) {
    this.cvService.patchAsync(rowValue._id, rowValue, 'isMain', !rowValue.isMain, true, true);
    if (rowValue.isMain) {
      this.cvService.isMainEmmitter.emit(rowValue);
    }
    this.cdr.markForCheck();
  }

  showCV(attachment: InfoCV) {
    this.loading = true;
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
          this.loading = false;
          this.cdr.markForCheck();
        }, 0);
      },
      error: (error) => {
        console.error('Error fetching the image:', error);
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  override customUpdates() {
    const isMainCV = this.dataItems.filter((cv: InfoCV) => cv.isMain == true);

    if (isMainCV.length > 0) {
      this.cvService.isMainEmmitter.emit(isMainCV[0]);
    }
    this.cdr.markForCheck();
  }

  downloadCV(attachment: any) {
    this.cvService.downloadById(attachment._id).pipe(take(1)).subscribe({
      next: (blob) => {
        saveAs(blob, attachment.cvFileInfo?.originalName);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error fetching the image:', error);
        this.cdr.markForCheck();
      },
    });
  }
}
