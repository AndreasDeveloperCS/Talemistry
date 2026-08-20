import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { renderAsync } from 'docx-preview';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-docx-rendering-dialog',
  templateUrl: './docx-rendering-dialog.component.html',
  styleUrl: './docx-rendering-dialog.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocxRenderingDialogComponent implements OnInit, OnDestroy {
  fileUrl: SafeResourceUrl | null = null;
  url: string = '';
  documentContent: string | null | SafeHtml = null;
  documentContentUpdated: string | null | SafeHtml = null;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public content: ContentService,
    private sanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<DocxRenderingDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public blob: any
  ) {}

  async ngOnInit() {
    await this.loadDocx(this.blob);
  }
  
  ngOnDestroy(): void {
    URL.revokeObjectURL(this.blob);
  }

  async loadDocx(blob: Blob) {
    console.log('DocxRenderingDialogComponent Loading DOCX blob:', blob);
    if (!blob) {
      console.error('No blob provided for DOC/DOCX rendering.');
      return;
    }
    const container = document.createElement('div.doc-container');
    await renderAsync(blob, container); // Render DOCX content into a temporary container
    this.documentContent = this.sanitizer.bypassSecurityTrustHtml(container.innerHTML);
    this.changeDetectorRef.markForCheck();
  }

  closeModal() {
    URL.revokeObjectURL(this.blob);
    this.dialogRef.close();
  }
}
