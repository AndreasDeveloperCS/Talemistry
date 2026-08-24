import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { take } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';
import { RestMethods } from '../../models/access-type';
import { AccessTypesService } from '../../services/access-types.service';

@Component({
  selector: 'access-type-block-form',
  templateUrl: './access-type-form.component.html',
  styleUrl: './access-type-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessTypeFormComponent implements OnInit {
  accessTypeForm: FormGroup;
  maxRegisterValue: number = 0;
  controlButtonContent: string = "";
  isEdit: boolean = false;
  restMethods = Object.values(RestMethods);

  constructor(
    private fb: FormBuilder,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<AccessTypeFormComponent>,
    private service: AccessTypesService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.accessTypeForm = this.fb.group({
      code: [data?.code || '', Validators.required],
      description: [data?.description || '', Validators.required],
      methods: [data?.methods || [], Validators.required],
      restrictionLevel: [data?.restrictionLevel || RestMethods.GET, Validators.required],
      registerValue: [{ value: data?.registerValue || 0, disabled: true }, Validators.required],
      bitValue: [{ value: data?.bitValue || 0, disabled: true }],
      numberValue: [{ value: data?.numberValue || 0, disabled: true }],
      isActive: [data?.isActive]
    });
    if (!data) {
      this.accessTypeForm.get('isActive')?.setValue(true);
    }
    this.isEdit = this.data != undefined;
    this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
  }

  ngOnInit(): void {
    if (!this.data?._id) {
      this.service.getMaxRegisterValue()
        .pipe(take(1))
        .subscribe((maxValue: number) => {
          this.maxRegisterValue = (maxValue ?? -1);
          this.accessTypeForm.get('registerValue')?.setValue(this.maxRegisterValue + 1);
          this.updateBitAndNumberValues();

        });
    } else {
      this.maxRegisterValue = this.data.registerValue;
      this.updateBitAndNumberValues();
    }
  }

  incrementRegisterValue(): void {
    const currentValue = this.accessTypeForm.get('registerValue')?.value;
    if (currentValue < this.maxRegisterValue + 1) {
      this.accessTypeForm.get('registerValue')?.setValue(currentValue + 1);
      this.updateBitAndNumberValues();
    }
  }

  decrementRegisterValue(): void {
    const currentValue = this.accessTypeForm.get('registerValue')?.value;
    if (currentValue > 0) {
      this.accessTypeForm.get('registerValue')?.setValue(currentValue - 1);
      this.updateBitAndNumberValues();
    }
  }

  updateBitAndNumberValues(): void {
    const registerValue = this.accessTypeForm.get('registerValue')?.value;
    this.accessTypeForm.get('bitValue')?.setValue(Math.pow(2, registerValue).toString(2));
    this.accessTypeForm.get('numberValue')?.setValue(Math.pow(2, registerValue));
    this.cdr.markForCheck();
  }

  toggleAccessTypeActive(): void {
    const current = this.accessTypeForm.get('isActive')?.value;
    this.accessTypeForm.get('isActive')?.setValue(!current);
    console.log('Toggling isActive for blockForm:', this.accessTypeForm.value);
  }

  isAccessTypeActive() {
    return this.accessTypeForm.get('isActive')?.value;
  }

  save(): void {
    if (this.accessTypeForm.valid) {
      const accessType = this.accessTypeForm.getRawValue();
      this.dialogRef.close(accessType);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}