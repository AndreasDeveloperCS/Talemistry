import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { MeetingScheduleNewComponent } from '../../../meetings/components/meeting-schedule-new/meeting-schedule-new.component';
import { MeetingScheduleComponent } from 'src/app/modules/meetings/components/meeting-schedule/meeting-schedule.component';

@Component({
  selector: 'app-meeting-booking-wrapper',
  templateUrl: './meeting-booking-wrapper.component.html',
  styleUrl: './meeting-booking-wrapper.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingBookingWrapperComponent implements OnInit {
  private static dialogAlreadyOpened = false;

  constructor(
    private router: Router,
    private dialogHelperService: DialogHelperService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    if (MeetingBookingWrapperComponent.dialogAlreadyOpened) {
      return;
    }
    MeetingBookingWrapperComponent.dialogAlreadyOpened = true;

    this.activatedRoute.url
      .pipe(take(1))
      .subscribe(() => {
        this.dialogHelperService.openDialog(MeetingScheduleComponent, () => {
          this.router.navigate(['..'], { relativeTo: this.activatedRoute });
          MeetingBookingWrapperComponent.dialogAlreadyOpened = false;
          this.cdr.markForCheck();
        }, undefined);
      });
  }
}
