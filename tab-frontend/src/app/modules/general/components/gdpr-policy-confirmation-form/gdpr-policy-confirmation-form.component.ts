import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ContentService } from '../../services/content.service';
import { GdprPolicyModel } from '../../models/gdpr-model';
import { GdprService } from '../../services/gdpr.service';

@Component({
  selector: 'app-gdpr-policy-confirmation-form',
  templateUrl: './gdpr-policy-confirmation-form.component.html',
  styleUrl: './gdpr-policy-confirmation-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GdprPolicyConfirmationFormComponent implements OnInit {

  public gdprStatus: boolean = false;
  public gdprContent: GdprPolicyModel = new GdprPolicyModel();

  constructor(public content: ContentService,
    private gdprService: GdprService,
    public dialogRef: MatDialogRef<GdprPolicyConfirmationFormComponent>,

    @Inject(MAT_DIALOG_DATA)
    public status: any) {
    this.gdprStatus = status;
  }

  ngOnInit(): void {
    console.log('onGdprStatusChanged', this.gdprStatus);
    this.gdprContent = this.gdprService.getGdprPolicy()
  }

  onGdprStatusChanged($event: any) {
    console.log('onGdprStatusChanged', $event);

    this.gdprStatus = $event;

    if (this.gdprStatus) {
      this.dialogRef.close($event);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
