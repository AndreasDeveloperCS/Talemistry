import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { AddCvDialogComponent } from '../add-cv-dialog/add-cv-dialog.component';
import { PositionData } from '../../models/position-data';
import { FUNCTIONALBLOCK } from '../../../permissions/models/functional-block-enum';
import { OpenPosition } from '../../models/position';
import { ContentService } from '../../../general/services/content.service';
import { CvLoaderService } from '../../services/cv-loader.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { PositionsService } from '../../services/positions.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-opened-position-tiles',
  templateUrl: './opened-position-tiles.component.html',
  styleUrl: './opened-position-tiles.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpenedPositionTilesComponent {
  @Input()
  public set position(value: OpenPosition) {
    this._position = value;
  }
  
  @Input()
  customPosition: OpenPosition = new OpenPosition();

  @ViewChild('pdfTable') cvDiscription: ElementRef | undefined;

  public progress: number = 0;
  public message: any;
  public fileInfo: any;
  public currentFile: undefined;
  public data: any;
  private _position: OpenPosition = new OpenPosition();
  positionData!: PositionData;
  lblPositionTitle = "Position Title";

  public get canEditItem(): boolean {
    return this.authGuard.canEditItem(FUNCTIONALBLOCK.POSITIONS);
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

    this.positionData = new PositionData(this.position);
  }

  async deleteOpenedPosition() {
    this.service.deleteOpenedPosition(this.position._id);
  }

  async editOpenedPosition() {
    this.service.editOpenedPosition(this.position._id);
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
}