import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ScreeningResponse } from '../../models/screening-response';

@Component({
  selector: 'app-screening-response-view',
  templateUrl: './screening-response-view.component.html',
  styleUrl: './screening-response-view.component.scss', 
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScreeningResponseViewComponent {
  constructor(
    public dialogRef: MatDialogRef<ScreeningResponseViewComponent>,
    @Inject(MAT_DIALOG_DATA)
    public response: ScreeningResponse
  ) {}

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  onCancel() {
    this.dialogRef.close();
  }
}
