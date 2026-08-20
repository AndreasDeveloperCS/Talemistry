import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { PositionData } from '../../models/position-data';
import { PositionDialogHelperService } from '../../services/position-dialog.service';
import { AddCvDialogComponent } from '../add-cv-dialog/add-cv-dialog.component';
import { FUNCTIONALBLOCK } from '../../../permissions/models/functional-block-enum';
import { OpenPosition, PositionItem } from '../../models/position';
import { ContentService } from '../../../general/services/content.service';
import { CvLoaderService } from '../../services/cv-loader.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { PositionsService } from '../../services/positions.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-opened-position-full',
  templateUrl: './opened-position-full.component.html',
  styleUrl: './opened-position-full.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpenedPositionFullComponent {

  @ViewChild('pdfTable')
  cvDiscription: ElementRef | undefined;

  public progress: number = 0;
  public message: any;
  public fileInfo: any;
  public currentFile: undefined;
  public data: any;
  summaryContent: string = '';
  positionData!: PositionData;

  public get canEditItem(): boolean {
    return this.authGuard.canEditItem(FUNCTIONALBLOCK.POSITIONS, this.position);
  }

  lblPositionTitle = "Position Title";

  get routerLink() {
    return `${this.position._id}`;
  }

  public set positionTitle(value: string) {
    this._position.title = value;
  }

  public get positionTitle(): string {
    return this._position.title;
  }

  private _position: OpenPosition = new OpenPosition();

  @Output()
  positionsListUpdated: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input()
  public set position(value: OpenPosition) {
    this._position = value;
  }

  public get position(): OpenPosition {
    return this._position;
  }

  @Input()
  OpenPosition: OpenPosition = new OpenPosition();

  constructor(
    public content: ContentService,
    private router: Router,
    public cvLoader: CvLoaderService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    public dialogHelper: DialogHelperService,
    public positionDialogHelper: PositionDialogHelperService,
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
    this.positionsListUpdated.emit(true);
  }

  async editOpenedPosition() {
    this.service.editOpenedPosition(this.position._id);
    this.positionsListUpdated.emit(true);
  }

  async valueChanged(id: any) {
    this.position.isVerified = !this.position.isVerified;
    await this.service.patchAsync(this.position._id, this.position, "isVerified", this.position.isVerified, true);
  }

  navigateToPosition() {
    this.router.navigate([environment.routes.positions, this.position._id]);
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
        console.error('Error upload all', ex);
        this.cdr.markForCheck();
      }
    });
  }

  getFirstElement(limit: number = 0) {
    return limit > 0 && this.position.positionElements.length > 0 ? [this.position.positionElements[0]] : this.position.positionElements;
  }

  hasValidSummary(): boolean {
    if (this.position.summary.sectionContent.length > 0) {
      this.summaryContent = this.position.summary.sectionContent;
      return true;
    }

    const summaryElement = this.position.positionElements.find((el: PositionItem) => el.sectionName === 'Summary');
    if (summaryElement && summaryElement.sectionContent.length > 0) {
      this.summaryContent = summaryElement.sectionContent;
      return true;
    }

    return false;
  }

  getSummaryContent(): string {
    return this.truncateContent(this.summaryContent);
  }

  truncateContent(content: string, limit: number = 0): string {
    if (!content) {
      return '';
    }

    let updated = content.replace(
      /<h2([^>]*)>(.*?)<\/h2>/g,
      '<h3 class="custom-h3"$1>$2</h3>'
    );

    updated = content.replace(
      /<h4([^>]*)>(.*?)<\/h4>/g,
      '<h3 class="custom-h3"$1>$2</h3>'
    );

    return updated;
  }
}
