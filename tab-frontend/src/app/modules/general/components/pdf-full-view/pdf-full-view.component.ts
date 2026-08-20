import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: 'app-pdf-full-view',
  templateUrl: './pdf-full-view.component.html',
  styleUrl: './pdf-full-view.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfFullViewComponent {
  @Input()
  public sourcePath!: string;

  constructor(@Inject(MAT_DIALOG_DATA)
  public data: string,
    public dialogRef: MatDialogRef<string>) {
    this.sourcePath = data;
  }

  onPdfComplete($event: any) {
    //   //console.log('onPdfComplete', $event);
  }

  onPdfError($event: any) {
    //   //console.log('onPdfError',$event);
  }
  onClose() {
    this.dialogRef.close();
  }
}
