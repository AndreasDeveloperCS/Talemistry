import { Injectable, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ComponentType } from "ngx-toastr";
import { take } from "rxjs";
import { ConfirmationDialogComponent } from "../dialogs/confirmation-dialog/confirmation-dialog.component";
import { ConfirmRequestDialogComponent } from "../dialogs/confirm-request-dialog/confirm-request-dialog.component";
export interface CustomDialogOptions {
  panelClass?: string,
  isFullScreen?: boolean,
  data?: any
}
@Injectable({
  providedIn: 'root'
})
export class DialogHelperService implements OnDestroy {
  panelClassLink: string = ''; 

  constructor(public dialog: MatDialog) { }

  ngOnDestroy(): void { }

  openDialog<T, D = any, R = any>(component: ComponentType<T>,
    callback: (entity: any) => void,
    customDialogOptions?: CustomDialogOptions) {
    const message = "Success!";
    const panelClass = customDialogOptions?.panelClass ?? 'general-panel-class-dialog';
    const isFullScreen = customDialogOptions?.isFullScreen ?? false;

    const dialogRef = this.dialog.open(component, {
      // width: 'max-content',
      // height: 'max-content',
      maxWidth: window.innerWidth >= 1280 ? 1280 : '98vw',
      minWidth: window.innerWidth >= 400 ? 400 : '98vw',
      // height: isFullScreen ? '98vh' : 'max-content',
      maxHeight: '98vh',
      minHeight: isFullScreen ? '98vh' : 'max-content',
      panelClass: panelClass,
      restoreFocus: false,
      disableClose: true,
      data: customDialogOptions?.data
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(callback);
  }

  confirmationDialog(callback: (flag: boolean) => void) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      restoreFocus: false,
      disableClose: true,
      panelClass: 'panel-class-dialog',
      data: {
        message: "Are you sure?"
      }
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(callback);
  }

  confirmRequestDialog(
    callback: (flag: boolean) => void,
    message: string = 'Are you sure?'
  ) {
    const dialogRef = this.dialog.open(ConfirmRequestDialogComponent, {
      restoreFocus: false,
      disableClose: true,
      panelClass: 'panel-class-dialog',
      data: {
        message
      }
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(callback);
  }

}