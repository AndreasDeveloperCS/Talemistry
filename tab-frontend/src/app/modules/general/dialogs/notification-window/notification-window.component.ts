import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-notification-window',
  templateUrl: './notification-window.component.html',
  styleUrl: './notification-window.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationWindowComponent implements OnInit {

  @Input()
  message: string = "Success!";
  constructor(public dialogRef: MatDialogRef<NotificationWindowComponent>,
    @Inject(MAT_DIALOG_DATA) 
    public data: { message: string },
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.data?.message) {
      this.message = this.data.message;
    }
    setTimeout(() => {
      this.dialogRef.close();
      this.cdr.markForCheck();
    }, 3000);
  }

}
