import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { MeetingTemplate } from '../../models/meeting-template';
import { MeetingTemplatesService } from '../../services/meeting-templates.service';
import { MeetingTemplateFormComponent } from '../meeting-template-form/meeting-template-form.component';

@Component({
  selector: 'app-meeting-template-management',
  templateUrl: './meeting-template-management.component.html',
  styleUrl: './meeting-template-management.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingTemplateManagementComponent implements OnInit, OnChanges {
  @Input()
  positionId!: string;

  meetingTemplates: MeetingTemplate[] = [];
  isLoading: boolean = false;

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private meetingTemplatesService: MeetingTemplatesService,
  ) {}

  ngOnInit() {
    this.getFormByPositionId(this.positionId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['positionId']?.currentValue) {
      this.positionId = changes['positionId'].currentValue;
      this.getFormByPositionId(changes['positionId'].currentValue);
    }
  }

  getFormByPositionId(positionId: string) {
    if(positionId) {
      this.isLoading = true;
      this.meetingTemplatesService.getByPositionId(positionId, true)
      .pipe(take(1)).subscribe({
        next: (res: MeetingTemplate[]) => {
          console.log('MeetingTemplate res', res);
          if(res) {
            this.meetingTemplates = res;
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error getting data', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  createMeetingTemplate(): void {
    const dialogRef = this.dialog.open(MeetingTemplateFormComponent, {
      panelClass: 'panel-class-dialog',
      data: { positionId: this.positionId }
    });

    dialogRef.componentInstance.submitTemplate.pipe(take(1)).subscribe((template: MeetingTemplate) => {
      console.log('Parent received template:', template);

      this.meetingTemplatesService
        .createAsync(template, true, false)
        .pipe(take(1))
        .subscribe({
          next: (res) => {
            console.log('Meeting Template created successfully', res);
            if(res) {
              this.meetingTemplates.push(res);
              const notificationRef = this.dialog.open(NotificationWindowComponent, {
                data: { message: 'Meeting Template has been created!' }
              });

              setTimeout(() => {
                dialogRef.close();
                notificationRef.close();
                this.cdr.markForCheck();
              }, 3000);
            }
          },
          error: (err) => {
            console.error('Error creating meeting template', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: 'Error creating meeting template.' }
            });
            dialogRef.close();
            this.cdr.markForCheck();
          },
        });
    });
  }

  onDeleteTemplate(id: string) {
    if(id) {
      this.meetingTemplatesService.deleteAsync(id, true, false)
        .pipe(take(1)).subscribe({
          next: (res) => {
            if(res) {
              console.log('Deleted meeting template', res);
              this.meetingTemplates = this.meetingTemplates.filter(t => t._id !== id);
              this.dialog.open(NotificationWindowComponent, {
                data: { message: 'Meeting Template has been deleted!' }
              });
              this.cdr.markForCheck();
            }
          },
          error: (err) => {
            console.error('Error deleting meeting template', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: 'Error deleting meeting template.' }
            });
            this.cdr.markForCheck();
          },
        });
      }
  }
}
