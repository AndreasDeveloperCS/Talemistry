import { formatDate } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Guid } from 'guid-typescript';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../authentication/services/auth.service';
import { TimeSpan } from '../../../general/models/time-span';
import { ContentService } from '../../../general/services/content.service';
import { MeetingPlatfrom, ParticipantInfo } from '../../models/meeting';
import { MeetingBookingRequestForm, MeetingParticipantForm } from '../../models/meting-booking-request';
import { TimeSlot } from '../../models/schedule';
import { MeetingService } from '../../services/meeting.service';

@Component({
  selector: 'app-meeting-booking-request-form',
  templateUrl: './meeting-booking-request-form.component.html',
  styleUrl: './meeting-booking-request-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingBookingRequestFormComponent implements AfterViewInit {
  @Input()
  selectedTimeSlot!: TimeSlot;

  MeetingPlatfrom: typeof MeetingPlatfrom = MeetingPlatfrom;
  form: FormGroup<MeetingBookingRequestForm>;
  isPanelParticipantsOpen: boolean = true;

  formMeetingParticipants: FormGroup<MeetingParticipantForm>[] = [];
  isEvrykaLinkCopied: boolean = false;
  meetingIdEvryka: Guid = Guid.create();

  selectedPlatforms: MeetingPlatfrom[] = [];
  selectedPlatform: MeetingPlatfrom | null = null;

  googleMeetLabel: string = 'Google Meet';
  teamsLabel: string = 'Microsoft Teams';
  zoomLabel: string = 'Zoom';
  evrykaLabel: string = 'Evryka';

  constructor(
    public service: MeetingService,
    public content: ContentService,
    private changeDetectorRef: ChangeDetectorRef,
    public mainAuthService: AuthService,
    private formBuilder: FormBuilder
  ) {
    this.form = formBuilder.group<MeetingBookingRequestForm>({
      topic: new FormControl('', [Validators.required]),
      agenda: new FormControl('', [Validators.required]),
      date: new FormControl(new Date(), [Validators.required]),
      startTime: new FormControl(new Date(), [Validators.required]),
      endTime: new FormControl(new Date(), [Validators.required]),
      participants: new FormControl([], [Validators.required, Validators.minLength(1)]),
      duration: new FormControl(0, [Validators.required]),
      meetingLinkEvryka: new FormControl(''),
      meetingLinkGoogleMeets: new FormControl(''),
      meetingLinkTeams: new FormControl(''),
      meetingLinkZoom: new FormControl(''),
      timeZone: new FormControl(''),
    });
    this.isEvrykaLinkCopied = false;
    this.service.model.platform = MeetingPlatfrom.GOOGLE_MEET;
    this.service.model.meetingLinkGoogleMeets.hangoutLink = '';
    this.selectedPlatform = MeetingPlatfrom.GOOGLE_MEET;
    this.setCurrentUser();
  }

  ngAfterViewInit(): void {
    this.changeDetectorRef.detectChanges();
  }

  setCurrentUser() {
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
        this.addParticipant();
      }
      this.service.model.topic = this.getTopic(userId, this.service.model.participants);
      this.service.model.agenda = this.getAgenda();
      this.service.validateAndEmit();
    }
    else {
      this.formMeetingParticipants.push(this.getParticipantForm());
      this.service.model.topic = this.getTopic(userId, this.service.model.participants);
      this.service.model.agenda = this.getAgenda();
      this.service.validateAndEmit();
    }
  }

  getAgenda() {
    return `- Introduction \r\n- Opportunities discussion \r\n- Collaboration plan\n`;
  }

  getTopic(userId: string | null, participants: ParticipantInfo[]): string {
    return userId && participants.length > 0 ? `[EVRYKA] ${participants[0].firstname} ${participants[0].lastname} - Introduction meeting` : `[EVRYKA] Introduction meeting`;
  }

  getParticipantForm(): FormGroup<MeetingParticipantForm> {
    return this.formBuilder.group<MeetingParticipantForm>({
      firstname: new FormControl('', [Validators.required]),
      lastname: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  onPanelToggle(isOpen: boolean) {
    this.isPanelParticipantsOpen = isOpen;
  }

  private formatEventDate(topic: string, date: Date, duration: TimeSpan, link: string) {
    const endDate = new Date(date.getTime());
    endDate.setHours(date.getHours() + duration.hours);
    endDate.setMinutes(date.getMinutes() + duration.minutes)

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    };

    const timeOption: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    const formattedDate = date.toLocaleDateString('en-US', dateOptions);
    const startTime = date.toLocaleTimeString('en-US', timeOption);
    const endTime = endDate.toLocaleTimeString('en-US', timeOption)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const month = date.toLocaleTimeString('en-Us', { month: 'short' }).toUpperCase(); // e.g., "FEB"
    const day = String(date.getDate()).padStart(2, '0');

    // return `Topic: ${topic} \r\n${formattedDate} · ${startTime} - ${endTime} \r\nTime Zone:  ${timeZone} \r\nLink: ${link} `;
    return `🗓 Meeting Invitation \r\n
  🔹 Topic: ${topic}\r\n
  🗓  Date: ${formattedDate}\r\n
  ⏰ Time: ${startTime} - ${endTime}\r\n
  🌍 Time Zone: ${timeZone}\r\n
  🔗 Join here: ${link}`;

  }

  calendarGetIcon(month: string, day: string) {

    return `<svg width="120" height="140" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="140" rx="10" fill="#ff4f4f"/>

    <!-- Calendar Header -->
    <rect x="0" y="0" width="120" height="35" rx="10" fill="#d63031"/>

    <!-- Header Text (Month) -->
    <text x="50%" y="25" font-size="16" font-weight="bold" text-anchor="middle" fill="white">${month}</text>

    <!-- Date Circle -->
    <circle cx="60" cy="80" r="30" fill="white"/>

    <!-- Date Number -->
    <text x="50%" y="90" font-size="32" font-weight="bold" text-anchor="middle" fill="#d63031">${day}</text>
</svg>`
  }
  copyToClipboard(link: string, date: Date, duration: TimeSpan, timeZone: any, topic: string) {
    const copyText = this.formatEventDate(topic, date, duration, link);
    navigator.clipboard.writeText(copyText).then(() => {
      // console.log('Link copied to clipboard');
      this.isEvrykaLinkCopied = true;
    }, () => {
      // console.log('Error copying link to clipboard');
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
      // Deselect the current platform
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
          this.meetingIdEvryka = Guid.create();
          this.service.model.meetingLinkEvryka = `https://videochat.evryka.org/join/${this.meetingIdEvryka}`;//'https://evryka.com';
          this.isEvrykaLinkCopied = false;
          this.service.model.meetingLinkGoogleMeets.hangoutLink = '';
          this.service.model.meetingLinkTeams.joinUrl = '';
          this.service.model.meetingLinkZoom.join_url = '';
          break;
        case MeetingPlatfrom.GOOGLE_MEET:
          this.service.model.meetingLinkGoogleMeets.hangoutLink = 'https://meet.google.com';
          this.service.model.meetingLinkEvryka = '';
          this.service.model.meetingLinkTeams.joinUrl = '';
          this.service.model.meetingLinkZoom.join_url = '';
          break;
        case MeetingPlatfrom.TEAMS:
          this.service.model.meetingLinkTeams.joinUrl = 'https://teams.microsoft.com';
          this.service.model.meetingLinkEvryka = '';
          this.service.model.meetingLinkGoogleMeets.hangoutLink = '';
          this.service.model.meetingLinkZoom.join_url = '';
          break;
        case MeetingPlatfrom.ZOOM:
          this.service.model.meetingLinkZoom.join_url = 'https://zoom.us';
          this.service.model.meetingLinkEvryka = '';
          this.service.model.meetingLinkGoogleMeets.hangoutLink = '';
          this.service.model.meetingLinkTeams.joinUrl = '';
          break;
      }
    }
    console.log('LINKS:', this.service.model);
    this.service.validateAndEmit();
  }

  onSubmit() {
    // console.log('MeetingBookingRequestFormComponent');
  }

  onInputChange() {
    this.service.validateAndEmit();
    // console.log('MeetingBookingRequestFormComponent');
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

  get formattedDate() {
    return formatDate(this.service.model.timeSlot.startTime, 'MMM d, y - HH:mm', 'en-US');
    // return formatDate(this.selectedTimeSlot.startTime, 'MMM d, y - HH:mm', 'en-US');
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
