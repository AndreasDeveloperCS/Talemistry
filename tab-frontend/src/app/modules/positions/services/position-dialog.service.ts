import { Injectable, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ComponentType } from "ngx-toastr";
import { take } from "rxjs";
import { ConfirmationDialogComponent } from "../../general/dialogs/confirmation-dialog/confirmation-dialog.component";

export interface CustomDialogOptions {
  panelClass?: string,
  isFullScreen?: boolean,
  data?: any 
}

@Injectable({
  providedIn: 'root'
})
export class PositionDialogHelperService {
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
      maxWidth: window.innerWidth >= 1280 ? 1280 : '95vw',
      minWidth: window.innerWidth >= 400 ? 400 : '95vw',
      maxHeight: '95vh',
      minHeight: isFullScreen ? '95vh' : 'max-content',
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

}