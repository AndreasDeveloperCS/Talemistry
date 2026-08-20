import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';
import { MotivationalFactor } from '../../models/motivational-factor';
import { IntensityLevel } from 'src/app/modules/skills/models/skill';

@Component({
  selector: 'app-motivational-factors-form',
  templateUrl: './motivational-factors-form.component.html',
  styleUrl: './motivational-factors-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MotivationalFactorsFormComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();

  motivationalFactorForm: FormGroup;
  controlButtonContent: string = "";
  isEdit: boolean = false;

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: MotivationalFactor,
    public dialog: MatDialog, 
    public content: ContentService,
    public dialogRef: MatDialogRef<MotivationalFactorsFormComponent>) {
      this.motivationalFactorForm = this.fb.group({
        motivationalFactor: [data?.factor || '', Validators.required],
        isVerified: [data?.isVerified]
      });
      if(!data) {
        this.motivationalFactorForm.get('isVerified')?.setValue(true);
      }
      this.isEdit = this.data != undefined;
      this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
  }

  ngOnInit(): void {
    console.log('Motivational Factor data:', this.data);
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  toggleMotivationalFactorVerified(): void {
    const current = this.motivationalFactorForm.get('isVerified')?.value;
    this.motivationalFactorForm.get('isVerified')?.setValue(!current);
    console.log('Toggling isVerified for motivationalFactorForm:', this.motivationalFactorForm.value);
  }  

  isMotivationalFactorVerified() {
    return this.motivationalFactorForm.get('isVerified')?.value;
  }

  save(): void {
    if (this.motivationalFactorForm.valid) {
      const factor: MotivationalFactor= {
        factor: this.motivationalFactorForm.value.motivationalFactor,
        influenceStrength: IntensityLevel.Normal,
        isVerified: true, 
        createdDate: new Date()
      }
      this.dialogRef.close(factor);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
