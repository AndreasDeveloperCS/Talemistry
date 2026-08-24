import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-confirm-request-dialog',
  templateUrl: './confirm-request-dialog.component.html',
  styleUrl: './confirm-request-dialog.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmRequestDialogComponent {

  constructor(
    public content: ContentService,
    public dialogRef: MatDialogRef<ConfirmRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {
    // console.log('ConfirmRequestDialogComponent', data);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }

  reject(): void {
    this.dialogRef.close(false);
  }
}