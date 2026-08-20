import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-warnings-errors-dialog',
    templateUrl: './warnings-errors-dialog.component.html',
    styleUrl: './warnings-errors-dialog.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarningsErrorsDialogComponent implements OnInit {
    @Input()
    message: string = "Error!";

    constructor(public dialogRef: MatDialogRef<WarningsErrorsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) 
        public data: { message: string },
        private cdr: ChangeDetectorRef
    ) { }

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