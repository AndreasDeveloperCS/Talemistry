import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PdfFullViewComponent } from './components/pdf-full-view/pdf-full-view.component';
import { PdfRenderingDialogComponent } from './components/pdf-rendering-dialog/pdf-rendering-dialog.component';
import { DocNamePipe } from './pipes/doc-name.pipe';

@NgModule({
  declarations: [
    PdfFullViewComponent,
    PdfRenderingDialogComponent,
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    PdfViewerModule,
    DocNamePipe,
  ],
  exports: [
    PdfFullViewComponent,
    PdfRenderingDialogComponent,
  ],
})
export class PdfDialogsModule { }