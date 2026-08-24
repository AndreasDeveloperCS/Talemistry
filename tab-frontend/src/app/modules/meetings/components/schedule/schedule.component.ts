import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { MeetingScheduleComponent } from '../meeting-schedule/meeting-schedule.component';
import { MeetingInvitationsService } from 'src/app/modules/meeting-invitations/services/meeting-invitations.service';
import { MeetingInvitation } from 'src/app/modules/meeting-invitations/models/meeting-invitation';

@Component({
  selector: 'app-booking-schedule',
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingScheduleComponent implements OnInit {
  private static dialogAlreadyOpened = false;
  bookingToken: string = '';

  constructor(
    private router: Router,
    private dialogHelperService: DialogHelperService,
    private activatedRoute: ActivatedRoute,
    private meetingInvitationService: MeetingInvitationsService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    const url = this.router.url; 
    console.log('Current URL:', url);
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    this.bookingToken = lastPart;
    console.log('Booking Token:', this.bookingToken);

    if (BookingScheduleComponent.dialogAlreadyOpened) {
      return;
    }
    BookingScheduleComponent.dialogAlreadyOpened = true;

    this.meetingInvitationService.getByBookingToken(this.bookingToken)
      .pipe(take(1))
      .subscribe({
        next: (invitation: MeetingInvitation) => {
          if (!invitation) {
            console.error('No meeting invitation found for token:', this.bookingToken);
            this.router.navigate(['/']);
            return;
          }
          console.log('Meeting invitation found:', invitation);
          this.activatedRoute.url
          .pipe(take(1))
          .subscribe(() => {
            console.log('Schedule dialog opened');
            this.dialogHelperService.openDialog(MeetingScheduleComponent, () => {
              window.location.href = '/';
              BookingScheduleComponent.dialogAlreadyOpened = false;
              this.cdr.markForCheck();
            }, { data: { userId: invitation.userId, invitation: invitation } });
          });
        },
        error: (err) => {
          console.error('Error fetching meeting invitation:', err);
          this.router.navigate(['/']);
        }
      });
  }
}
