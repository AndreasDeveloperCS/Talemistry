import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { catchError, EMPTY, firstValueFrom, map, of, take, tap } from 'rxjs';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { BaseEntity, OwnerEntity } from 'src/app/modules/general/models/base-entity';
import { Filtering, FilterRule, PaginatedResource, Sorting } from 'src/app/modules/general/services/search-logic.service';
import { ScreeningFormInfo } from 'src/app/modules/position-management/interfaces/screening-form-position-info';
import { IScreeningForm } from 'src/app/modules/position-management/models/screening-form';
import { ScreeningFormsService } from 'src/app/modules/position-management/services/screening-forms.service';
import { STAGES_NAMES } from 'src/app/modules/position-pipelines/models/default-pipeline-stages';
import { environment } from 'src/environments/environment';
import { getPropertyName } from 'src/shared-functions/shared-functions';
import { AssessmentType, NextStageDialogData } from '../../interfaces/next-stage-dialog-info';
import { ScreeningBuilderComponent } from 'src/app/modules/position-management/components/screening-builder/screening-builder.component';
import { ScreeningFormComponent } from 'src/app/modules/position-management/components/screening-form/screening-form.component';
import { MeetingTemplate } from 'src/app/modules/meeting-invitations/models/meeting-template';
import { MeetingTemplatesService } from 'src/app/modules/meeting-invitations/services/meeting-templates.service';
import { MeetingTemplateFormComponent } from 'src/app/modules/meeting-invitations/components/meeting-template-form/meeting-template-form.component';
import { InvitationStatus, MeetingInvitation } from 'src/app/modules/meeting-invitations/models/meeting-invitation';
import { SlotDuration } from 'src/app/modules/schedule/models/schedule-default-settings';
import { MeetingPlatfrom } from 'src/app/modules/meetings/models/meeting';
import { MeetingInvitationsService } from 'src/app/modules/meeting-invitations/services/meeting-invitations.service';
import { MeetingTemplateCardComponent } from 'src/app/modules/meeting-invitations/components/meeting-template-card/meeting-template-card.component';

@Component({
  selector: 'app-next-stage-dialog',
  templateUrl: './next-stage-dialog.component.html',
  styleUrl: './next-stage-dialog.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NextStageDialogComponent {
  StagesNames = STAGES_NAMES; 
  selectedTemplateId: string | null = null;
  selectedMeetingTemplate: MeetingTemplate | null = null;
  selectedScreeningPositionId: string | null = null;  
  assessmentType: AssessmentType = AssessmentType.TEST;
  assessmentInterviewLinkId: string = 'room-123';
  userId = sessionStorage.getItem(`${environment.storage.userId}`);
  currentScreeningForm: IScreeningForm | null = null;
  screenings: ScreeningFormInfo[] = [];
  screeningLoading = false;
  totalScreenings = 0;
  sorting: Sorting = {
    property: getPropertyName<BaseEntity>(e => e.createdDate),
    direction: 'DESC'
  };
  filtering: Filtering = [];
  pageSize: number = 10;
  pageIndex: number = 0;
  hasCurrentScreening = false;
  showScreeningSelector = false;
  meetingTemplates: MeetingTemplate[] = [];
  bookingToken: string = '';

  constructor(
    private dialogRef: MatDialogRef<NextStageDialogComponent>,
    private screeningFormsService: ScreeningFormsService,
    private meetingTemplateService: MeetingTemplatesService,
    private meetingInvitationsService: MeetingInvitationsService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: NextStageDialogData
  ) {
    console.log('NextStageDialog initialized with data:', data);
  }

  ngOnInit() {
    //this.deleteScreening('696a11a45f1e0a2c780de023');
    if (this.data.stage === STAGES_NAMES.SCREENING) {
      this.getCurrentPositionScreening();
    }
    if (this.data.stage === STAGES_NAMES.INTERVIEW) {
      this.getMeetingTemplates();
    }
  }

  getMeetingTemplates() {
    if(this.data.positionId) {
      this.meetingTemplateService.getByPositionId(this.data.positionId, true)
      .pipe(take(1)).subscribe({
        next: (res: MeetingTemplate[]) => {
          console.log('MeetingTemplate res', res);
          if(res) {
            this.meetingTemplates = res;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error getting data', err);
          this.cdr.markForCheck();
        },
      });
    }
  }

  openCreateMeetingTemplate(): void {
    const dialogRef = this.dialog.open(MeetingTemplateFormComponent, {
      panelClass: 'panel-class-dialog',
      data: { positionId: this.data.positionId }
    });

    dialogRef.componentInstance.submitTemplate.pipe(take(1)).subscribe((template: MeetingTemplate) => {
      console.log('Parent received template:', template);

      this.meetingTemplateService
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

  getCurrentPositionScreening() {
    if(!this.data.positionId) {
      return;
    }
    this.screeningFormsService
    .getFormByPositionId(this.data.positionId, true)
    .pipe(
      take(1),
      tap((res: IScreeningForm) => {
        console.log('Screening form', res);
        if (res) {
          this.currentScreeningForm = res;
          this.selectedScreeningPositionId = res.positionId?.toString() || null;
          this.hasCurrentScreening = true;
          this.showScreeningSelector = false;
        } else {
          this.hasCurrentScreening = false;
          this.showScreeningSelector = true;
          this.loadScreenings();
        }
        this.cdr.markForCheck();
      }),
      catchError((err) => {
        if (err.status === 403) {
          this.cdr.markForCheck();
        }
        return EMPTY;
      })
    ).subscribe();
  }

  loadScreenings() {
    const exists = this.filtering.some(f => f.property === 'userId');

    if (!exists) {
      this.filtering.push({
        property: getPropertyName<OwnerEntity>((e: OwnerEntity) => e.userId),
        rule: FilterRule.EQUALS,
        value: this.userId
      });
    }
    this.screeningLoading = true;

    this.screeningFormsService.getAllFormPositionInfoAsync(this.pageSize, this.pageIndex, this.sorting, this.filtering, true, false).pipe(take(1))
      .subscribe({
        next: (res: PaginatedResource<ScreeningFormInfo>) => {
          if(res && res.items && res.totalItems > 0) {
            console.log('Screening forms loaded:', res);
            this.screenings = res.items;
            this.totalScreenings = res.totalItems;
            this.selectedScreeningPositionId = this.screenings.length > 0 ? this.screenings[0].positionId : null;
          }
          this.screeningLoading = false;
          this.showScreeningSelector = true
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Error loading screening forms:', error);
          this.screeningLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  useOldScreening() {
    console.log('createScreeningForm');
    const selectedScreening = this.screenings.find(
      s => s.positionId?.toString() === this.selectedScreeningPositionId?.toString()
    );
    const screeningForm: IScreeningForm = {
      positionId: this.data.positionId,
      isVerified: true,
      userId: this.userId!,
      createdBy: this.userId!,
      createdDate: new Date(),
      questions: selectedScreening?.questions || [],
    };
    this.screeningFormsService.createAsync(screeningForm, true, false)
      .pipe(take(1)).subscribe({
        next: (res) => {
          if(res) {
            console.log('Screening form', res);
            this.screeningFormsService.refreshDataBehaviorSubject.next(true);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "Screening form has been created!" }
            });
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error creating screening form', err);
          this.dialog.open(WarningsErrorsDialogComponent, {
            data: { message: "Error creating screening form!" }
          });
          this.cdr.markForCheck();
        },
      });
  }

  // 🔥 MAIN CONFIRM
  async confirm() {
    const result: any = { confirmed: true };

    switch (this.data.stage) {
      case STAGES_NAMES.INTERVIEW:
        result.bookingToken = await firstValueFrom(
          this.getInterviewBookingToken()
        );
        break;

      case STAGES_NAMES.SCREENING:
        result.screeningId = this.selectedScreeningPositionId;
        console.log('Selected screening ID:', result.screeningId);
        break;

      case STAGES_NAMES.ASSESSMENT:
        result.assessment = {
          type: this.assessmentType,
          linkId: this.assessmentInterviewLinkId
        };
        break;
    }

    this.dialogRef.close(result);
  }

  cancel() {
    this.dialogRef.close({ confirmed: false });
  }

  getInterviewBookingToken() {
    console.log('Creating meeting invitation with template', this.selectedMeetingTemplate);
    const meetingInvitation: MeetingInvitation = {
      positionId: this.data.positionId,
      recruiterId: this.selectedMeetingTemplate?.userId || this.userId!,
      userId: this.userId!,
      templateId: this.selectedMeetingTemplate?._id || null,
      talentId: this.data.candidate.talentId,
      topic: this.selectedMeetingTemplate?.topic || `Interview for ${this.data.positionTitle}`,
      agenda: this.selectedMeetingTemplate?.agenda || '',
      bookingToken: crypto.randomUUID(),
      platform:this.selectedMeetingTemplate?.platform || MeetingPlatfrom.GOOGLE_MEET,
      startDate: this.selectedMeetingTemplate?.startDate || new Date(),
      endDate: this.selectedMeetingTemplate?.endDate || new Date(),
      timeZone: this.selectedMeetingTemplate?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      selectedSlotPeriod: this.selectedMeetingTemplate?.selectedSlotPeriod || SlotDuration.half,
      participants: this.selectedMeetingTemplate?.participants || [],
      status: InvitationStatus.sent,
      createdBy: this.userId!,
      createdDate: new Date(),
    }

    return this.meetingInvitationsService
    .createAsync(meetingInvitation, true, false)
    .pipe(
      take(1),
      tap((res: MeetingInvitation) => {
        console.log('Meeting Invitation created successfully', res);
        this.cdr.markForCheck();
      }),
      catchError((err) => {
        console.error('Error creating meeting template', err);
        this.dialog.open(WarningsErrorsDialogComponent, {
          data: { message: 'Error creating meeting template.' }
        });
        return of(null);
      }),
      map(res => res?.bookingToken || null)
    );
  }

  openCreateScreening() {
    const dialogRef = this.dialog.open(ScreeningBuilderComponent, {
      panelClass: 'panel-class-dialog',
      maxWidth: '95vw',
      maxHeight: '95vh',
      minWidth: '90vw',
      minHeight: '90vh',
      data: { positionId: this.data.positionId, positionTitle: this.data.positionTitle }
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe((createdForm: ScreeningFormInfo) => {
      console.log('Create screening dialog closed with result:', createdForm);
      if (createdForm) {
        //this.loadScreenings(); // 🔥 refresh immediately
        this.selectedScreeningPositionId = createdForm.positionId;
        createdForm.positionTitle = this.data?.positionTitle;
        this.screenings.push(createdForm);
        this.selectedTemplateId = createdForm._id; 
        this.cdr.markForCheck();
      }
    });
  }

  openScreeningPreview() {
    const dialogRef = this.dialog.open(ScreeningFormComponent, {
      panelClass: 'general-panel-class-dialog',
      data: { positionId: this.selectedScreeningPositionId}
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe((res: any) => {
      console.log('Create screening dialog closed with result:', res);
      //this.loadScreenings(); 
    });
  }

  openMeetingTemplatePreview() {
    console.log('Opening meeting template preview for template:', this.selectedMeetingTemplate);
    const dialogRef = this.dialog.open(MeetingTemplateCardComponent, {
      panelClass: 'general-panel-class-dialog',
      data: { template: this.selectedMeetingTemplate}
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe((res: any) => {
      console.log('Create meeting template dialog closed with result:', res);
      //this.loadScreenings(); 
    });
  }

  deleteScreening(screeningId: string) {
    this.screeningFormsService
      .deleteAsync(screeningId, true, false)
      .pipe(take(1))
      .subscribe({
        next: (deleted) => {
          console.log('Screening deleted', deleted);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error updating screening', err);
          this.cdr.markForCheck();
        },
    });
  }

  openTestTaskDialog(event: MouseEvent) {
    console.log('Opening test task dialog', this.assessmentType);
    event.stopPropagation(); // 🔥 prevents selecting card accidentally
    // open dialog
  }
}