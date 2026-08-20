import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { OpenPosition } from '../../models/position';
import { CvLoaderService } from '../../services/cv-loader.service';
import { PositionsService } from '../../services/positions.service';
import { AddCvDialogComponent } from '../add-cv-dialog/add-cv-dialog.component';
import { FUNCTIONALBLOCK } from '../../../permissions/models/functional-block-enum';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-opened-position-plate-view',
  templateUrl: './opened-position-plate-view.component.html',
  styleUrl: './opened-position-plate-view.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpenedPositionPlateViewComponent {
  @Input()
  public set position(value: OpenPosition) {
    this._position = value;
  }

  @Input()
  customPosition: OpenPosition = new OpenPosition();

  @Output()
  positionsListUpdated: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('pdfTable') cvDiscription: ElementRef | undefined;

  public progress: number = 0;
  public message: any;
  public fileInfo: any;
  public currentFile: undefined;  
  private _position: OpenPosition = new OpenPosition();
  lblPositionTitle = "Position Title";

  public get canEditItem(): boolean {
    return this.authGuard.canEditItem(FUNCTIONALBLOCK.POSITIONS);
  }
  public get isAuthorizedInterview(): boolean {
    return this.authGuard.canViewShared(FUNCTIONALBLOCK.POSITIONS);
  }

  get routerLink() {
    return `${this.position._id}`;
  }

  public set positionTitle(value: string) {
    this._position.title = value;
  }

  public get positionTitle(): string {
    return this._position.title;
  }

  public get position(): OpenPosition {
    return this._position;
  }

  constructor(
    public content: ContentService,
    private router: Router,
    public cvLoader: CvLoaderService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    public dialogHelper: DialogHelperService,
    public authGuard: AuthGuardService,
    private service: PositionsService) {

    if (this.position && !this.position.titleCode && this.position._id) {
      this.position.titleCode = 'HRP-' + this.position?._id?.slice(-8)?.toUpperCase();
    }

    if (this.position && !this.position.titleCode && this.position._id) {
      this.position.titleCode = 'HRP-' + this.position?._id?.slice(-8)?.toUpperCase();
    }
  }

  ngOnInit(): void {
    if (this.position && !this.position?.titleCode && this.position?._id) {
      this.position.titleCode = 'HRP-' + this.position?._id?.slice(-8)?.toUpperCase();
    }
  }

  async deleteOpenedPosition() {
    this.service.deleteOpenedPosition(this.position._id);
    this.positionsListUpdated.emit(true);
  }

  async editOpenedPosition(positionId: string) {
    this.service.editOpenedPosition(positionId);
    this.positionsListUpdated.emit(true);
  }

  async valueChanged(id: any) {
    this.position.isVerified = !this.position.isVerified;
    await this.service.patchAsync(this.position._id, this.position, "isVerified", this.position.isVerified, true);
  }

  navigateToPosition(_id: any) {
    this.router.navigate([environment.routes.positions, _id]);
  }

  apply() {

    const dialogRef = this.dialog.open(AddCvDialogComponent, {
      panelClass: 'general-panel-class-dialog',
      restoreFocus: false,
      disableClose: true,
      data: this.position
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(async data => {
      try {
        if (!data?.fileInfo || !this.position?._id || this.position?._id == '') {
          return;
        }
        this.cvLoader.upload(data, data.candidateInfoData);
        this.cdr.markForCheck();
      } catch (ex) {
        console.error('upload all', ex);
        this.cdr.markForCheck();
      }
    });
  }

  getFirstElement(limit: number = 0) {
    return limit > 0 && this.position.positionElements.length > 0 ? [this.position.positionElements[0]] : this.position.positionElements;
  }

  truncateContent(content: string, limit: number = 0): string {
    return content;
  }
}
