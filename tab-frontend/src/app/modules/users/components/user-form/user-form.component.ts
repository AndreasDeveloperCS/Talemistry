import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ContentService } from '../../../general/services/content.service';
import { User } from '../../models/user';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFormComponent {
  userForm: FormGroup;
  private phoneRegx = /^[+]?[\d]{0,3}[\s]?[(]?[\d]{1,3}[)]?[\s]?[\d\s]{7,12}$/;
  isEdit: boolean = false;
  controlButtonContent: string = "";
  userRoles: any[] = [];

  constructor(
    private fb: FormBuilder,
    public content: ContentService,
    private dialogRef: MatDialogRef<UserFormComponent>,
    @Inject(MAT_DIALOG_DATA) 
    public data: User
  ) {
    console.log('UserFormComponent constructor', data);
    console.log(data?.role);
    this.userForm = this.fb.group({
      firstname: [data?.firstname || '', Validators.required],
      lastname: [data?.lastname || '', Validators.required],
      email: [data?.email || '', [Validators.required, Validators.email]],
      phone: [data?.phone || '', [Validators.pattern(this.phoneRegx)]],
      role: [data?.role || [], Validators.required],
      //roles: this.fb.array(data?.role?.length ? data.role.map((role: Role) => this.fb.control(role.description, Validators.required)) : [this.fb.control('', Validators.required)])
    });
    if (data?.role) {
      this.userRoles = data.role;
    }
    this.isEdit = this.data != undefined;
    this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
  }

  get roles(): FormArray {
    return this.userForm.get('roles') as FormArray;
  }

  save(): void {
    console.log('SAVE() user', this.userForm, this.userForm.valid, this.validateForm(this.userForm.value));

    if (this.validateForm(this.userForm.value)) {
      //const user = this.userForm.getRawValue();
      const user: User = {
        firstname: this.userForm.value.firstname,
        lastname: this.userForm.value.lastname,
        fullName: `${this.userForm.value.firstname} ${this.userForm.value.lastname}`,
        email: this.userForm.value.email,
        phone: this.userForm.value.phone,
        role: this.userForm.value.role,
        createdDate: new Date()
      }
      console.log('SAVE() user', user);
      this.dialogRef.close(user);
    }
  }

  validateForm(value: any): boolean {
    console.log('validateForm', value);
    let isValid = true;
    if (value.firstname === '') {
      this.userForm.get('firstname')?.setErrors({ required: true });
      isValid = false;
    }
    if (value.lastname === '') {
      this.userForm.get('lastname')?.setErrors({ required: true });
      isValid = false;
    }
    if (value.email === '') {
      this.userForm.get('email')?.setErrors({ required: true });
      isValid = false;
    }
    if (value.phone === '') {
      this.userForm.get('phone')?.setErrors({ required: true });
      isValid = false;
    }
    if (value.role.length === 0) {
      this.userForm.get('role')?.setErrors({ required: true });
      isValid = false;
    }
    return isValid;
  }

  changeSelectedRole(roles: any[]) {
    console.log(roles);
    this.userForm.value.role = roles;
    console.log('this.userForm.value.role', this.userForm.value.role);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}