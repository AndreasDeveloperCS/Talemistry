import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CoverLetterDataInternalEnvelope } from '../../models/cv-item';
import { GdprPolicyModel } from '../../../general/models/gdpr-model';
import { GdprService } from '../../../general/services/gdpr.service';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { GdprPolicyConfirmationFormComponent } from '../../../general/components/gdpr-policy-confirmation-form/gdpr-policy-confirmation-form.component';

@Component({
  selector: 'app-cover-letter-attach-dialog',
  templateUrl: './cover-letter-attach-dialog.component.html',
  styleUrl: './cover-letter-attach-dialog.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoverLetterAttachDialogComponent implements OnInit {
  public gdprConfirmationStatus: boolean = false;
  public gdprContent!: GdprPolicyModel;
  public isSelectedCv = true;

  public coverLetterTextControl: FormControl = new FormControl('');

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<CoverLetterAttachDialogComponent>,
    private gdprService: GdprService,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private dialogHelperService: DialogHelperService,
    @Inject(MAT_DIALOG_DATA)
    public data: CoverLetterDataInternalEnvelope) {
  }

  ngOnInit(): void {
    this.gdprContent = this.gdprService.getGdprPolicy();
  }

  onGdprConfirmationChanged($event: boolean | any) {
    this.gdprConfirmationStatus = $event;
  }

  openPrivacyPolicy() {
    this.dialogHelperService.openDialog(
      GdprPolicyConfirmationFormComponent
      , (status: boolean) => {
        if (status) {
          this.gdprConfirmationStatus = status;
          this.cdr.markForCheck();
        }
      }, {
      data: this.gdprConfirmationStatus,
      panelClass: "general-panel-class-dialog"
    });
  }

  confirmCVUploading() {
    if (this.gdprConfirmationStatus) {
      this.data.info.candidateInfo.coverLetterText = this.data.info?.coverLetterText;
      this.data.info.gdprConfirmed = this.gdprConfirmationStatus;
      this.dialogRef.close(this.data);
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
