import { ChangeDetectionStrategy, Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { VideoChatRoom, VideoChatRoomType } from '../../models/video-chat-room';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';

@Component({
  selector: 'app-video-room-form',
  templateUrl: './video-room-form.component.html',
  styleUrl: './video-room-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoRoomFormComponent implements OnInit {
  @Output() submitVideoChatRoom = new EventEmitter<VideoChatRoom>();

  videoChatRoomForm!: FormGroup;
  types = Object.values(VideoChatRoomType);
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  submitAttempted = false;
  isSubmitting = false;

  private editingRoomId?: any;
  get isEditMode(): boolean {
    return !!this.editingRoomId;
  }

  private toBoolean(value: unknown): boolean {
    if (value === true || value === false) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return false;
      if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
      if (['false', '0', 'no', 'off'].includes(normalized)) return false;
      return false;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    return false;
  }

  constructor(
    public dialogRef: MatDialogRef<VideoRoomFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    console.log('MeetingInvitationFormComponent', this.data);
  }

  ngOnInit(): void {
    this.videoChatRoomForm = this.fb.group({
      name: ['', Validators.required],
      type: [VideoChatRoomType.DIRECT, Validators.required],
      isOpenMeeting: [false],
      participants: this.fb.array([])
    });

    const room: VideoChatRoom | undefined = this.data?.room;
    if (room?._id) {
      this.editingRoomId = room._id;
      this.prefillFromRoom(room);
    } else {
      this.setCurrentUserEmail();
    }

    // Enforce direct-meeting participant count in the form.
    this.videoChatRoomForm.get('type')?.valueChanges.subscribe((nextType) => {
      if (nextType === VideoChatRoomType.DIRECT) {
        while (this.participants.length < 2) this.addParticipant();
        while (this.participants.length > 2) this.removeParticipant(this.participants.length - 1);
      }
      // Only group rooms use isOpenMeeting.
      if (nextType !== VideoChatRoomType.GROUP) {
        this.videoChatRoomForm.get('isOpenMeeting')?.setValue(false, { emitEvent: false });
      }
    });

    // Default: direct meetings prompt for a second participant.
    if (this.videoChatRoomForm.get('type')?.value === VideoChatRoomType.DIRECT && this.participants.length < 2) {
      this.addParticipant();
    }
  }

  private prefillFromRoom(room: VideoChatRoom): void {
    const participants = Array.isArray(room?.participants) ? room.participants : [];
    const emails = participants
      .map((p: any) => String(p?.email ?? '').trim())
      .filter(Boolean);

    // Reset participants array
    while (this.participants.length > 0) this.participants.removeAt(0);

    for (const email of emails) {
      this.participants.push(
        this.fb.group({
          email: [email, [Validators.required, Validators.email]]
        })
      );
    }

    // For edit, ensure at least one participant input exists.
    if (this.participants.length === 0) {
      this.addParticipant();
    }

    this.videoChatRoomForm.patchValue({
      name: room?.name ?? '',
      type: room?.type ?? VideoChatRoomType.DIRECT,
      isOpenMeeting: this.toBoolean(room?.isOpenMeeting),
    }, { emitEvent: false });

    // For direct meetings, force exactly 2 participant fields.
    if (room?.type === VideoChatRoomType.DIRECT) {
      while (this.participants.length < 2) this.addParticipant();
      while (this.participants.length > 2) this.removeParticipant(this.participants.length - 1);
    }
  }

  setCurrentUserEmail() {
    const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${this.userId}`);
    if (!idToken) {
      return;
    }
    const decodedToken = this.authService.decodeJWTToken(idToken);
    const email = decodedToken.user.email;

    this.participants.push(
      this.fb.group({
        email: [email, [Validators.required, Validators.email]]
      })
    );
  }

  get participants(): FormArray {
    return this.videoChatRoomForm.get('participants') as FormArray;
  }

  get isGroupType(): boolean {
    return this.videoChatRoomForm?.get('type')?.value === VideoChatRoomType.GROUP;
  }

  get hasDirectParticipantCountError(): boolean {
    const currentType = this.videoChatRoomForm?.get('type')?.value;
    return currentType === VideoChatRoomType.DIRECT && this.participants.length !== 2;
  }

  get isSubmitDisabled(): boolean {
    if (!this.videoChatRoomForm) return true;
    if (this.isSubmitting) return true;
    if (this.isGroupType) return false;
    return this.videoChatRoomForm.invalid || this.hasDirectParticipantCountError;
  }

  get showInvalidInfo(): boolean {
    return !!this.videoChatRoomForm
      && (this.videoChatRoomForm.invalid || this.hasDirectParticipantCountError)
      && (this.submitAttempted || this.videoChatRoomForm.touched || this.videoChatRoomForm.dirty);
  }

  get invalidInfoMessage(): string {
    if (!this.videoChatRoomForm) return 'Please complete required fields.';

    if (this.hasDirectParticipantCountError) {
      return 'Direct meeting requires exactly 2 participants.';
    }

    const nameControl = this.videoChatRoomForm.get('name');
    if (nameControl?.invalid) {
      return 'Please enter room name.';
    }

    if (this.participants?.controls?.some((control: any) => control?.invalid)) {
      return 'Please add valid participant email(s).';
    }

    return 'Please complete required fields.';
  }

  addParticipant(): void {
    const currentType = this.videoChatRoomForm.get('type')?.value;
    if (currentType === VideoChatRoomType.DIRECT && this.participants.length >= 2) {
      return;
    }
    const participant = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.participants.push(participant);
  }

  removeParticipant(index: number): void {
    this.participants.removeAt(index);
  }

  onSubmit(): void {
    this.submitAttempted = true;

    if (this.isSubmitting) return;

    if (this.videoChatRoomForm.invalid || this.hasDirectParticipantCountError) {
      this.videoChatRoomForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const formValue = this.videoChatRoomForm.value;

    const videoChatRoom: VideoChatRoom = {
      _id: this.editingRoomId,
      name: formValue.name,
      type: formValue.type,
      isVerified: true,
      participants: [...formValue.participants],
      isOpenMeeting: formValue.type === VideoChatRoomType.GROUP ? !!formValue.isOpenMeeting : false,
      userId: this.userId,
      createdBy: this.userId,
      createdDate: new Date(),
    };

    console.log('Video Chat Room prepared for submission:', videoChatRoom);
    this.submitVideoChatRoom.emit(videoChatRoom);
  }

  onCancel() {
    this.dialogRef.close();
  }
}
