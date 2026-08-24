import { ChangeDetectionStrategy, Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { MeetingPlatfrom } from 'src/app/modules/meetings/models/meeting';
import { SlotPeriod } from 'src/app/modules/meetings/models/schedule';
import { environment } from 'src/environments/environment';
import { MeetingTemplate } from '../../models/meeting-template';

@Component({
  selector: 'app-meeting-template-form',
  templateUrl: './meeting-template-form.component.html',
  styleUrl: './meeting-template-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingTemplateFormComponent implements OnInit {
  @Output() submitTemplate = new EventEmitter<MeetingTemplate>();
  
  templateForm!: FormGroup;

  platforms = Object.entries(MeetingPlatfrom)
  .filter(([key, value]) => typeof value === 'number')
  .map(([key, value]) => ({ name: key, value }));

  slotPeriods = Object.values(SlotPeriod);
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';

  constructor(
    public dialogRef: MatDialogRef<MeetingTemplateFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    private fb: FormBuilder,
    private authService: AuthService,
  ) { 
    console.log('MeetingTemplateFormComponent', this.data);
  }

  ngOnInit(): void {
    this.templateForm = this.fb.group({
      topic: ['', Validators.required],
      agenda: [''],
      platform: [null, Validators.required],
      startDate: [''],
      endDate: [''],
      selectedSlotPeriod: [SlotPeriod.quater, Validators.required],
      includeRecruiter: [true],
      participants: this.fb.array([])
    });
  }

  get participants(): FormArray {
    return this.templateForm.get('participants') as FormArray;
  }

  addInterviewer(): void {
    const interviewerGroup = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
    this.participants.push(interviewerGroup);
  }

  removeInterviewer(index: number): void {
    this.participants.removeAt(index);
  }

  onSubmit(): void {
    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched();
      return;
    }

    const formValue = this.templateForm.value;

    const template: MeetingTemplate = {
      topic: formValue.topic,
      agenda: formValue.agenda,
      positionId: this.data?.positionId,
      startDate: new Date(formValue.startDate),
      endDate: new Date(formValue.endDate),
      selectedSlotPeriod: formValue.selectedSlotPeriod,
      userId: this.userId,
      platform: formValue.platform,
      participants: [...formValue.participants],
      createdBy: this.userId,
      createdDate: new Date(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    if (formValue.includeRecruiter) {
      const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${this.userId}`);
      if (!idToken) {
        return;
      }
      const decodedToken = this.authService.decodeJWTToken(idToken);
      template.participants?.push({
        firstname: decodedToken.user.firstname,
        lastname: decodedToken.user.lastname,
        email: decodedToken.user.email
      });
    }

    console.log('Meeting Template prepared for submission:', template);
    this.submitTemplate.emit(template);
  }

  onCancel() {
    this.dialogRef.close();
  }
}