import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RolesService } from '../../services/roles.service';
import { Subject, take, takeUntil } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-role-form',
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleFormComponent implements OnInit {
  roleForm: FormGroup;
  maxRegisterValue: number = 0;
  controlButtonContent: string = "";
  isEdit: boolean = false;

  constructor(
    private fb: FormBuilder,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<RoleFormComponent>,
    private rolesService: RolesService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.roleForm = this.fb.group({
      code: [data?.code || '', Validators.required],
      description: [data?.description || '', Validators.required],
      route: [data?.route || '', Validators.required],
      registerValue: [{ value: data?.registerValue || 0, disabled: true }, Validators.required],
      bitValue: [{ value: data?.bitValue || 0, disabled: true }],
      numberValue: [{ value: data?.numberValue || 0, disabled: true }],
      isActive: [data?.isActive]
    });
    if(!data) {
      this.roleForm.get('isActive')?.setValue(true);
    }
    this.isEdit = this.data != undefined;
    this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
  }

  ngOnInit(): void {
    console.log('Max register value:');
    console.log('Role data:', this.data);
    if (!this.data?._id) {

      this.rolesService.getMaxRegisterValue()
        .pipe(take(1))
        .subscribe((maxValue: number) => {
        console.log('Max register value:', maxValue);

        this.maxRegisterValue = (maxValue ?? -1);
        this.roleForm.get('registerValue')?.setValue(this.maxRegisterValue + 1);
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
    const currentValue = this.roleForm.get('registerValue')?.value;
    if (currentValue < this.maxRegisterValue) {
      this.roleForm.get('registerValue')?.setValue(currentValue + 1);
      this.updateBitAndNumberValues();
    }
  }

  decrementRegisterValue(): void {
    const currentValue = this.roleForm.get('registerValue')?.value;
    if (currentValue > this.maxRegisterValue) {
      this.roleForm.get('registerValue')?.setValue(currentValue - 1);
      this.updateBitAndNumberValues();
    }
  }

  updateBitAndNumberValues(): void {
    const registerValue = this.roleForm.get('registerValue')?.value;
    this.roleForm.get('bitValue')?.setValue(Math.pow(2, registerValue).toString(2));
    this.roleForm.get('numberValue')?.setValue(Math.pow(2, registerValue));
    this.cdr.markForCheck();
  }

  toggleRoleActive(): void {
    const current = this.roleForm.get('isActive')?.value;
    this.roleForm.get('isActive')?.setValue(!current);
    console.log('Toggling isActive for roleForm:', this.roleForm.value);
  }  

  isRoleActive() {
    return this.roleForm.get('isActive')?.value;
  }

  save(): void {
    if (this.roleForm.valid) {
      const role = this.roleForm.getRawValue();
      this.dialogRef.close(role);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}