import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-pdf-rendering-dialog',
  templateUrl: './pdf-rendering-dialog.component.html',
  styleUrl: './pdf-rendering-dialog.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfRenderingDialogComponent implements OnInit, OnDestroy {
  fileUrl: SafeResourceUrl | null = null;
  url: string = '';
  private objectUrl: string | null = null;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public content: ContentService,
    private sanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<PdfRenderingDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public blob: any
  ) {}
  
  ngOnInit(): void {
    this.convertBlob(this.blob);
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  convertBlob(blob: any) {
    if (!blob) {
      console.error('No blob provided for PDF rendering.');
      return;
    }

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }

    this.objectUrl = URL.createObjectURL(blob);
    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
    this.changeDetectorRef.markForCheck();
  }

  closeModal() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.dialogRef.close();
  }
}
