import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { MeetingScheduleNewComponent } from '../meeting-schedule-new/meeting-schedule-new.component';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { MeetingScheduleComponent } from '../meeting-schedule/meeting-schedule.component';

@Component({
  selector: 'app-schedule-demo-wrapper',
  templateUrl: './schedule-demo-wrapper.component.html',
  styleUrl: './schedule-demo-wrapper.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleDemoWrapperComponent implements OnInit {
  private static dialogAlreadyOpened = false;

  constructor(
    private router: Router,
    private dialogHelperService: DialogHelperService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    if (ScheduleDemoWrapperComponent.dialogAlreadyOpened) {
      return;
    }
    ScheduleDemoWrapperComponent.dialogAlreadyOpened = true;

    this.activatedRoute.queryParams.pipe(take(1)).subscribe(params => {
      const returnUrl = params['returnUrl'] || '/';
      this.dialogHelperService.openDialog(MeetingScheduleComponent, () => {
        this.router.navigateByUrl(returnUrl);
        ScheduleDemoWrapperComponent.dialogAlreadyOpened = false;
        this.cdr.markForCheck();
      });
    });
  }
}
