import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FunctionalBlocksService } from '../../services/functional-blocks.service';
import { Subject, take, takeUntil } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-functional-block-form',
  templateUrl: './functional-block-form.component.html',
  styleUrl: './functional-block-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FunctionalBlockFormComponent implements OnInit {

  blockForm: FormGroup;
  maxRegisterValue: number = 0;
  controlButtonContent: string = "";
  isEdit: boolean = false;

  constructor(
    private fb: FormBuilder,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<FunctionalBlockFormComponent>,
    private service: FunctionalBlocksService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.blockForm = this.fb.group({
      code: [data?.code || '', Validators.required],
      description: [data?.description || '', Validators.required],
      endpointRoute: [data?.endpointRoute || '', Validators.required],
      registerValue: [{ value: data?.registerValue || 0, disabled: true }, Validators.required],
      bitValue: [{ value: data?.bitValue || 0, disabled: true }],
      numberValue: [{ value: data?.numberValue || 0, disabled: true }],
      isActive: [data?.isActive]
    });
    if(!data) {
      this.blockForm.get('isActive')?.setValue(true);
    }
    this.isEdit = this.data != undefined;
    this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
  }

  ngOnInit(): void {
    console.log('Max register value:');
    console.log('Block data:', this.data);
    if (!this.data?._id) {

      this.service.getMaxRegisterValue()
        .pipe(take(1))
        .subscribe((maxValue: number) => {
        console.log('Max register value inside request:', maxValue);

        this.maxRegisterValue = maxValue ?? -1;
        this.blockForm.get('registerValue')?.setValue(this.maxRegisterValue + 1);
        this.updateBitAndNumberValues();
        this.cdr.markForCheck();
      });
    } else {
      this.maxRegisterValue = this.data.registerValue;
      this.updateBitAndNumberValues();
      this.cdr.markForCheck();
    }
  }

  incrementRegisterValue(): void {
    const currentValue = this.blockForm.get('registerValue')?.value;
    if (currentValue < this.maxRegisterValue) {
      this.blockForm.get('registerValue')?.setValue(currentValue + 1);
      this.updateBitAndNumberValues();
    }
  }

  decrementRegisterValue(): void {
    const currentValue = this.blockForm.get('registerValue')?.value;
    if (currentValue > 0) {
      this.blockForm.get('registerValue')?.setValue(currentValue - 1);
      this.updateBitAndNumberValues();
    }
  }

  updateBitAndNumberValues(): void {
    const registerValue = this.blockForm.get('registerValue')?.value;
    this.blockForm.get('bitValue')?.setValue(Math.pow(2, registerValue).toString(2));
    this.blockForm.get('numberValue')?.setValue(Math.pow(2, registerValue));
    this.cdr.markForCheck();
  }

  toggleBlockActive(): void {
    const current = this.blockForm.get('isActive')?.value;
    this.blockForm.get('isActive')?.setValue(!current);
    console.log('Toggling isActive for blockForm:', this.blockForm.value);
  }  

  isBlockActive() {
    return this.blockForm.get('isActive')?.value;
  }

  save(): void {
    if (this.blockForm.valid) {
      const block = this.blockForm.getRawValue();
      this.dialogRef.close(block);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}