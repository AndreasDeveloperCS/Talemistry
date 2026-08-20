import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, Observable, of, Subscription, take, tap } from 'rxjs';
import { TableTemplateComponent } from 'src/app/modules/general/components/table-template/table-template.component';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { Sorting } from 'src/app/modules/general/services/search-logic.service';
import { getPropertyName } from 'src/shared-functions/shared-functions';
import { IEnrichedVideoChatRoom, VideoChatRoom } from '../../models/video-chat-room';
import { VideoChatRoomService } from '../../services/video-chat-room.service';
import { VideoRoomFormComponent } from '../video-room-form/video-room-form.component';
import { VideoChatRoomParticipantService } from '../../services/video-chat-room-participant.service';

@Component({
  selector: 'app-video-rooms',
  templateUrl: './video-rooms.component.html',
  styleUrl: './video-rooms.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoRoomsComponent extends TableTemplateComponent<IEnrichedVideoChatRoom> implements OnDestroy {
  override currentComponentName = this.constructor.name;
  override selectedPageSize = 20;
  private sub?: Subscription;
  public selectedChatRoom?: VideoChatRoom;
  newRoomName = '';
  videoChatOpen = false;
  joinRoomId = '';
  warningMessage: string = '';
  isLoadingRooms: boolean = false;
  roomsTotalNumber: number = 0;

  get totalParticipants(): number {
    return (this.dataItems || []).reduce((sum, room) => sum + (room?.participants?.length || 0), 0);
  }

  public override sorting: Sorting = {
    property: getPropertyName<VideoChatRoom>((e: VideoChatRoom) => e.createdDate),
    direction: 'DESC'
  }

  public override sortingProcessed: Sorting = {
    property: getPropertyName<VideoChatRoom>((e: VideoChatRoom) => e.createdDate),
    direction: "DESC"
  }

  constructor(private videoChatRoomService: VideoChatRoomService,
    public dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    injector: Injector) {
    super(videoChatRoomService, injector);
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.sub?.unsubscribe();
  }

  onRoomsScroll(event: Event): void {
    if (this.isLoadingRooms) {
      return;
    }

    const element = event.target as HTMLElement;

    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;

    if (atBottom) {
      this.loadExistingRooms().subscribe();
    }
  }

  loadExistingRooms(): Observable<any> {
    if (this.roomsTotalNumber > 0 && this.roomsTotalNumber <= this.dataItems.length) {
      return of(null);
    }

    this.isLoadingRooms = true;
    if (this.pageIndex === 0) {
      this.pageIndex++;
    }

    console.log('Page index', this.pageIndex);
    return this.videoChatRoomService
      .getAllAsync(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering, true, true).pipe(
        take(1),
        tap(res => {
          if (res && res.totalItems > 0) {
            console.log('Video room info', res);
            this.roomsTotalNumber = res.totalItems;
            this.pageIndex++;
            this.isLoadingRooms = false;
            const newRooms = res.items;
            this.dataItems = [...this.dataItems, ...newRooms];

            this.cdr.markForCheck();
          } else {
            this.isLoadingRooms = false;
            this.cdr.markForCheck();
          }
        }),
        catchError(err => {
          console.error('Error getting video rooms', err);
          this.isLoadingRooms = false;
          this.cdr.markForCheck();
          return of(null);
        })
      );
  }

  createVideoChatRoom(): void {
    this.openVideoChatRoomDialog();
  }

  editVideoChatRoom(room: VideoChatRoom): void {
    this.openVideoChatRoomDialog(room);
  }

  deleteVideoChatRoom(room: VideoChatRoom): void {
    this.videoChatRoomService.deleteAsync(room._id, true, true).pipe(take(1))
      .subscribe({
        next: (res) => {
          console.log('Video Chat Room has been deleted', res);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting Video Chat Room', err);
          this.cdr.markForCheck();
        },
      })
  }

  private openVideoChatRoomDialog(room?: VideoChatRoom): void {
    const dialogRef = this.dialog.open(VideoRoomFormComponent, {
      panelClass: 'panel-class-dialog',
      data: { room },
    });

    dialogRef.componentInstance.submitVideoChatRoom.subscribe((videoChatRoom: VideoChatRoom) => {
      const isEdit = !!videoChatRoom?._id;
      console.log('Parent received videoChatRoom:', { isEdit, videoChatRoom });

      const request$ = isEdit
        ? this.videoChatRoomService.updateAsync(videoChatRoom, true, false)
        : this.videoChatRoomService.createAsync(videoChatRoom, true, false);

      request$
        .pipe(take(1))
        .subscribe({
          next: (res) => {
            console.log('Video Chat Room res', res);
            if (res) {
              if (isEdit) {
                const idx = this.dataItems.findIndex((r) => r?._id === res?._id);
                if (idx >= 0) {
                  this.dataItems[idx] = res;
                  this.crudService.refreshDataBehaviorSubject.next(true);
                  this.cdr.markForCheck();
                }
              } else {
                this.dataItems.push(res);
                this.crudService.refreshDataBehaviorSubject.next(true);
              }

              const message = isEdit ? 'Video Chat Room has been updated!' : 'Video Chat Room has been created!';
              const notificationRef = this.dialog.open(NotificationWindowComponent, {
                data: { message }
              });

              // Close the edit dialog immediately on success so the user cannot
              // accidentally re-submit while the notification is visible.
              dialogRef.close();
              setTimeout(() => {
                notificationRef.close();
                this.cdr.markForCheck();
              }, 2000);
            }
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error(isEdit ? 'Error updating Video Chat Room' : 'Error creating Video Chat Room', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: isEdit ? 'Error updating Video Chat Room.' : 'Error creating Video Chat Room.' }
            });
            this.cdr.markForCheck();
          },
        });
    });
  }

  joinRoom(room: VideoChatRoom) {
    this.router.navigate(['/recruitment/communication/room', room._id, 'video-chat']);
  }

  joinRoomById() {
    const found = this.dataItems.find(r => r._id == this.joinRoomId);
    if (found) {
      this.joinRoom(found);
    } else {
      console.log('The room was not found!');
      this.warningMessage = 'Room not found, staying in lobby.';
    }
  }
}