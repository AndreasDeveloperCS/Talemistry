import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import saveAs from 'file-saver';
import { take, takeUntil } from 'rxjs';
import { DocxRenderingDialogComponent } from '../../../general/components/docx-rendering-dialog/docx-rendering-dialog.component';
import { PdfRenderingDialogComponent } from '../../../general/components/pdf-rendering-dialog/pdf-rendering-dialog.component';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { FilterRule, PaginatedResource, Sorting } from '../../../general/services/search-logic.service';
import { CoverLetterInfo } from '../../models/cover-letter';
import { CoverLetterService } from '../../services/cover-letter.service';

@Component({
  selector: 'app-cover-letter-collection-history',
  templateUrl: './cover-letter-collection-history.component.html',
  styleUrl: './cover-letter-collection-history.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoverLetterCollectionHistoryComponent extends TableTemplateComponent<CoverLetterInfo> implements OnInit, OnDestroy {
  public override selectedPageSize: number = 10;
  public override sorting: Sorting = {
    property: 'createdDate',
    direction: "DESC"
  }
  public override sortingProcessed: Sorting = {
    property: 'createdDate',
    direction: "ASC"
  }

  // public paginatorIntl = inject(MatPaginatorIntl);
  // override ngAfterViewInit(): void {
  //   // Rename "Items per page" (or clear it)
  //   this.paginatorIntl.itemsPerPageLabel = '';
  //   // Make the paginator re-render labels
  //   this.paginatorIntl.changes.next();
  //   super.ngAfterViewInit();
  // }
  public override displayedColumns: string[] = [
    'make-main', 
    'show-cl', 
    'originalName', 
    'size', 
    'fileLastModifiedDate', 
    'createdDate', 
    'delete',
  ];

  public override headerNames: Map<string, string> = new Map<string, string>([
    ['originalName', 'Original Name'], 
    ['size', 'Size'], 
    ['fileLastModifiedDate', 'File Modified'], 
    ['createdDate', 'Created']
  ]);

  public getHeaderClass(column: string) {
    const customColums = ['make-main', 'show-cl', 'delete'];
    return customColums.includes(column) ? 'table-content-width-small' : '';
  }

  isPanelOpen: boolean = false;
  loading: boolean = false;

  constructor(public coverLetterService: CoverLetterService,
    public dialogHelper: DialogHelperService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    injector: Injector) {
    super(coverLetterService, injector);
  }

  override ngOnInit(): void {
    
    this.coverLetterService.refreshData.pipe(takeUntil(this._onDestroy)).subscribe(() => {
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

  delete(rowValue: CoverLetterInfo) {

    this.coverLetterService.deleteAsync(rowValue._id, true, true);

    const isMainCV = this.getLatestRecord(this.dataItems);
    if (isMainCV)
      this.coverLetterService.patchAsync(isMainCV._id, isMainCV, 'isMain', !isMainCV.isMain, true, true);
    else {
      this.coverLetterService.isMainEmmitter.emit(isMainCV);
    }
    this.cdr.markForCheck();
  }

  private getLatestRecord(records: CoverLetterInfo[]): CoverLetterInfo | undefined {
    if (!(records.length > 0)) {
      return undefined;
    }
    return records.reduce((previousValue: CoverLetterInfo | undefined, currentValue: CoverLetterInfo | undefined, currentIndex: number, array: CoverLetterInfo[]) => {
      return !(previousValue?.createdDate && currentValue?.createdDate) ? undefined : previousValue.createdDate > currentValue.createdDate ? previousValue : currentValue;
    }, undefined);
  }

  isMain(rowValue: CoverLetterInfo) {
    this.coverLetterService.patchAsync(rowValue._id, rowValue, 'isMain', !rowValue.isMain, true, true);
    if (rowValue.isMain) {
      this.coverLetterService.isMainEmmitter.emit(rowValue);
    }
    this.cdr.markForCheck();
  }

  getFileNameOrPartOfText(rowValue: CoverLetterInfo) {
    return rowValue.originalName ?? `[Only Text] ${(rowValue.coverLetterText.length > 50 ? rowValue.coverLetterText.substring(0, 50) + '...' : rowValue.coverLetterText)}`;
  }

  showCL(attachment: CoverLetterInfo) {
    this.loading = true;
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

  selectCurrent(rowValue: CoverLetterInfo) {
    const filter = [];
    filter.push({
      property: '_id',
      rule: FilterRule.EQUALS,
      value: rowValue._id
    });
    this.coverLetterService.getAllAsync(1, 0, this.sorting, filter, true, false)
      .pipe(take(1))
      .subscribe((result: PaginatedResource<CoverLetterInfo>) => {
        // console.log(result);
        if (result && result.items && result.items.length > 0) {
          // console.log(result.items.length, result.items[0]);
          this.coverLetterService.coverLetterModel = result.items[0];
        }
        this.cdr.markForCheck();
      })
  }

  override customUpdates() {
    const isMainCV = this.dataItems.filter((cv: CoverLetterInfo) => cv.isMain == true);
    if (isMainCV.length > 0) {
      this.coverLetterService.isMainEmmitter.emit(isMainCV[0]);
    }
    this.cdr.markForCheck();
  }

  downloadCV(attachment: any) {
    this.coverLetterService.downloadById(attachment._id).pipe(take(1)).subscribe({
      next: (blob) => {
        saveAs(blob, attachment.cvFileInfo?.originalName);
        this.cdr.markForCheck();
        //const objectURL = URL.createObjectURL(blob);
        //this.imgSrc = URL.createObjectURL(blob);
        //this.imgSrc = this.sanitizer.bypassSecurityTrustUrl(objectURL);
      },
      error: (error) => {
        console.error('Error fetching the image:', error);
        this.cdr.markForCheck();
      },
    });
  }
}
