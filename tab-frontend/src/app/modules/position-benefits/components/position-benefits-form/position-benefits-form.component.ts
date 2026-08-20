import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';
import { PositionBenefit } from '../../models/position-benefit';

@Component({
  selector: 'app-position-benefits-form',
  templateUrl: './position-benefits-form.component.html',
  styleUrl: './position-benefits-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionBenefitsFormComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();

  benefitForm: FormGroup;
  controlButtonContent: string = "";
  isEdit: boolean = false;

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: PositionBenefit,
    public dialog: MatDialog, 
    public content: ContentService,
    public dialogRef: MatDialogRef<PositionBenefitsFormComponent>) {
      this.benefitForm = this.fb.group({
        benefit: [data?.benefit || '', Validators.required],
        isVerified: [data?.isVerified]
      });
      if(!data) {
        this.benefitForm.get('isVerified')?.setValue(true);
      }
      this.isEdit = this.data != undefined;
      this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
  }

  ngOnInit(): void {
    console.log('Benefit data:', this.data);
  }

  toggleBenefitVerified(): void {
    const current = this.benefitForm.get('isVerified')?.value;
    this.benefitForm.get('isVerified')?.setValue(!current);
    console.log('Toggling isVerified for benefitForm:', this.benefitForm.value);
  }  

  isBenefitVerified() {
    return this.benefitForm.get('isVerified')?.value;
  }

  save(): void {
    if (this.benefitForm.valid) {
      const benefit: PositionBenefit = {
        benefit: this.benefitForm.value.benefit,
        isVerified: true,
        createdDate: new Date()
      };
      this.dialogRef.close(benefit);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}