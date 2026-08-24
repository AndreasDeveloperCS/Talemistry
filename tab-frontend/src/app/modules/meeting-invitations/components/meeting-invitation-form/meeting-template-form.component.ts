import { ChangeDetectionStrategy, Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InvitationStatus, MeetingInvitation } from '../../models/meeting-invitation';
import { MeetingPlatfrom } from '../../../meetings/models/meeting';
import { SlotPeriod } from '../../../meetings/models/schedule';
import { environment } from '../../../../../environments/environment';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';

@Component({
  selector: 'app-meeting-invitation-form',
  templateUrl: './meeting-invitation-form.component.html',
  styleUrl: './meeting-invitation-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingInvitationFormComponent implements OnInit {
  @Output() submitInvitation = new EventEmitter<MeetingInvitation>();
  
  invitationForm!: FormGroup;

  platforms = Object.entries(MeetingPlatfrom)
  .filter(([key, value]) => typeof value === 'number')
  .map(([key, value]) => ({ name: key, value }));

  slotPeriods = Object.values(SlotPeriod);
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';

  constructor(
    public dialogRef: MatDialogRef<MeetingInvitationFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    private fb: FormBuilder,
    private authService: AuthService,
  ) { 
    console.log('MeetingInvitationFormComponent', this.data);
  }

  ngOnInit(): void {
    this.invitationForm = this.fb.group({
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
    return this.invitationForm.get('participants') as FormArray;
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
    if (this.invitationForm.invalid) {
      this.invitationForm.markAllAsTouched();
      return;
    }

    const formValue = this.invitationForm.value;

    const invitation: MeetingInvitation = {
      topic: formValue.topic,
      agenda: formValue.agenda,
      positionId: this.data?.positionId,
      recruiterId: this.userId,
      status: InvitationStatus.draft,
      startDate: new Date(formValue.startDate),
      endDate: new Date(formValue.endDate),
      selectedSlotPeriod: formValue.selectedSlotPeriod,
      userId: this.userId,
      platform: formValue.platform,
      participants: [...formValue.participants],
      createdBy: this.userId,
      createdDate: new Date(),
      talentId: undefined, // !
      bookingToken: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    if (formValue.includeRecruiter) {
      const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${this.userId}`);
      if (!idToken) {
        return;
      }
      const decodedToken = this.authService.decodeJWTToken(idToken);
      invitation.participants.push({
        firstname: decodedToken.user.firstname,
        lastname: decodedToken.user.lastname,
        email: decodedToken.user.email
      });
    }

    console.log('Meeting Invitation prepared for submission:', invitation);
    this.submitInvitation.emit(invitation);
  }

  onCancel() {
    this.dialogRef.close();
  }
}