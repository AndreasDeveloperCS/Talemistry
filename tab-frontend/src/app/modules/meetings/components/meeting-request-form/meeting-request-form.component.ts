import { formatDate } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Guid } from 'guid-typescript';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../authentication/services/auth.service';
import { ContentService } from '../../../general/services/content.service';
import { MeetingPlatfrom, ParticipantInfo } from '../../models/meeting';
import { MeetingBookingRequestForm, MeetingParticipantForm } from '../../models/meting-booking-request';
import { MeetingService } from '../../services/meeting.service';
import { MeetingInvitation } from 'src/app/modules/meeting-invitations/models/meeting-invitation';

@Component({
  selector: 'app-meeting-request-form',
  templateUrl: './meeting-request-form.component.html',
  styleUrl: './meeting-request-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingRequestFormComponent implements AfterViewInit {
  private _invitation?: MeetingInvitation;

  @Input()
  set invitation(value: MeetingInvitation | undefined) {
    this._invitation = value;
    if (value) {
      console.log('Invitation received:', value);
      this.initializeInvitationData(value);
    }
  }

  get invitation(): MeetingInvitation | undefined {
    return this._invitation;
  }

  MeetingPlatfrom: typeof MeetingPlatfrom = MeetingPlatfrom;
  form: FormGroup<MeetingBookingRequestForm>;
  formMeetingParticipants: FormGroup<MeetingParticipantForm>[] = [];
  isEvrykaLinkCopied: boolean = false;
  meetingIdEvryka: Guid = Guid.create();
  selectedPlatforms: MeetingPlatfrom[] = [];
  selectedPlatform: MeetingPlatfrom | null = null;
  googleMeetLabel: string = 'Google Meet';
  teamsLabel: string = 'Microsoft Teams';
  zoomLabel: string = 'Zoom';
  evrykaLabel: string = 'Evryka';
  googleMeetLink: string = 'https://meet.google.com';
  teamsLink: string = 'https://teams.microsoft.com';
  zoomLink: string = 'https://zoom.us';
  evrykaLink: string = 'https://tap.evryka.org/talent/communication/video-chat';

  get formattedDate() {
    return formatDate(this.service.model.timeSlot.startTime, 'MMM d, y - HH:mm', 'en-US');
  }

  get meetingDuration(): string {
    const str = this.service.model.timeSlot.duration?.toString() ?? '';

    // Match h and m values
    const match = str.match(/(\d+)h\s+(\d+)m/);

    if (!match) return '';

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}min`);

    return parts.join(' ');
  }

  constructor(
    public service: MeetingService,
    public content: ContentService,
    private changeDetectorRef: ChangeDetectorRef,
    public mainAuthService: AuthService,
    private formBuilder: FormBuilder
  ) {
    console.log('MeetingRequestFormComponent initialized with invitation:', this.invitation);
    this.form = formBuilder.group<MeetingBookingRequestForm>({
      topic: new FormControl('', [Validators.required]),
      agenda: new FormControl('', [Validators.required]),
      participants: new FormControl([], [Validators.required, Validators.minLength(1)]),
      duration: new FormControl(0, [Validators.required]),
      meetingLinkEvryka: new FormControl(''),
      meetingLinkGoogleMeets: new FormControl(''),
      meetingLinkTeams: new FormControl(''),
      meetingLinkZoom: new FormControl(''),
      timeZone: new FormControl(''),
    });
  }

  ngOnInit() {
    this.setCurrentUser();
    this.changeDetectorRef.markForCheck();
  }

  ngAfterViewInit(): void {
    this.changeDetectorRef.detectChanges();
  }

  private initializeInvitationData(invitation: MeetingInvitation) {
    console.log(invitation);
    this.isEvrykaLinkCopied = false;
    this.service.model.platform = MeetingPlatfrom.GOOGLE_MEET;
    this.service.model.meetingLinkGoogleMeets.hangoutLink = this.googleMeetLink;
    this.selectedPlatform = this.invitation?.platform || MeetingPlatfrom.GOOGLE_MEET;
    // this.setCurrentUser();
    this.changeDetectorRef.markForCheck();
  }

  setCurrentUser() {
    this.formMeetingParticipants = [];
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    if (userId) {
      const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`);
      if (idToken) {
        this.service.model.participants = [];
        const user = this.mainAuthService.decodeJWTToken(idToken).user;
        console.log('user', user);

        this.service.model.participants.push({
          email: user.email || '',
          firstname: user.firstname || '',
          lastname: user.lastname || ''
        });

        this.service.validateAndEmit();

        this.formMeetingParticipants.push(this.formBuilder.group<MeetingParticipantForm>({
          firstname: new FormControl(user.firstname || '', [Validators.required]),
          lastname: new FormControl(user.lastname || '', [Validators.required]),
          email: new FormControl(user.email || '', [Validators.required, Validators.email]),
        }));

        this.formMeetingParticipants.push(this.getParticipantForm());
        //this.addParticipant();
      }
      this.service.model.topic = this.getTopic(userId, this.service.model.participants);
      this.service.model.agenda = this.getAgenda();
      this.service.validateAndEmit();
    }
    else {
      this.formMeetingParticipants.push(this.getParticipantForm());
      this.service.model.topic = this.getTopic(userId, this.service.model.participants);
      this.service.model.agenda = this.getAgenda();
      this.service.model.platform = this.invitation?.platform || MeetingPlatfrom.GOOGLE_MEET;
      this.selectPlatform(this.service.model.platform);
      this.changeDetectorRef.markForCheck();
      this.service.validateAndEmit();
    }
    console.log('Invitation in form component', this.invitation);
    console.log('MODEL after setting user', this.service.model);
    this.changeDetectorRef.markForCheck();
  }

  getAgenda(): string {
    return this.invitation?.agenda 
      || `- Introduction \r\n- Opportunities discussion \r\n- Collaboration plan\n`;
  }

  getTopic(userId: string | null, participants: ParticipantInfo[]): string {
    if (this.invitation?.topic) return this.invitation.topic;

    if (userId && participants.length > 0) {
      return `[EVRYKA] ${participants[0].firstname} ${participants[0].lastname} - Introduction meeting`;
    }

    return `[EVRYKA] Introduction meeting`;
  }

  getParticipantForm(): FormGroup<MeetingParticipantForm> {
    return this.formBuilder.group<MeetingParticipantForm>({
      firstname: new FormControl('', [Validators.required]),
      lastname: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  togglePlatform(platform: MeetingPlatfrom) {
    const index = this.selectedPlatforms.indexOf(platform);
    if (index === -1) {
      this.selectedPlatforms.push(platform);
    }
    else {
      this.selectedPlatforms.splice(index, 1);
    }
  }

  selectPlatform(platform: MeetingPlatfrom) {
    if (this.selectedPlatform === platform) {
      this.selectedPlatform = null;
      this.service.model.platform = undefined;

      switch (platform) {
        case MeetingPlatfrom.EVRYKA:
          this.service.model.meetingLinkEvryka = '';
          break;
        case MeetingPlatfrom.GOOGLE_MEET:
          this.service.model.meetingLinkGoogleMeets.hangoutLink = '';
          break;
        case MeetingPlatfrom.TEAMS:
          this.service.model.meetingLinkTeams.joinUrl = '';
          break;
        case MeetingPlatfrom.ZOOM:
          this.service.model.meetingLinkZoom.join_url = '';
          break;
      }
    } else {
      this.selectedPlatform = platform;
      this.service.model.platform = platform;

      switch (platform) {
        case MeetingPlatfrom.EVRYKA:
          //this.meetingIdEvryka = Guid.create();
          this.service.model.meetingLinkEvryka = `${this.evrykaLink}`;
          this.isEvrykaLinkCopied = false;
          this.service.model.meetingLinkGoogleMeets.hangoutLink = '';
          this.service.model.meetingLinkTeams.joinUrl = '';
          this.service.model.meetingLinkZoom.join_url = '';
          break;
        case MeetingPlatfrom.GOOGLE_MEET:
          this.service.model.meetingLinkGoogleMeets.hangoutLink = this.googleMeetLink;
          this.service.model.meetingLinkEvryka = '';
          this.service.model.meetingLinkTeams.joinUrl = '';
          this.service.model.meetingLinkZoom.join_url = '';
          break;
        case MeetingPlatfrom.TEAMS:
          this.service.model.meetingLinkTeams.joinUrl = this.teamsLink;
          this.service.model.meetingLinkEvryka = '';
          this.service.model.meetingLinkGoogleMeets.hangoutLink = '';
          this.service.model.meetingLinkZoom.join_url = '';
          break;
        case MeetingPlatfrom.ZOOM:
          this.service.model.meetingLinkZoom.join_url = this.zoomLink;
          this.service.model.meetingLinkEvryka = '';
          this.service.model.meetingLinkGoogleMeets.hangoutLink = '';
          this.service.model.meetingLinkTeams.joinUrl = '';
          break;
      }
    }
    console.log('LINKS:', this.service.model);
    this.changeDetectorRef.markForCheck();
    this.service.validateAndEmit();
  }

  onInputChange() {
    this.service.validateAndEmit();
  }

  addParticipant() {
    this.service.model.participants.push({
      email: '',
      firstname: '',
      lastname: ''
    });
    this.service.validateAndEmit();
    this.formMeetingParticipants.push(this.getParticipantForm());
  }

  removeParticipant(participant: ParticipantInfo, index: number) {
    if (this.service.model.participants.length > 1) {
      this.service.model.participants.splice(this.service.model.participants.indexOf(participant), 1);
    }
    if (this.formMeetingParticipants.length > 1) {
      this.formMeetingParticipants.splice(index, 1);
    }
    this.service.validateAndEmit();
  }
}