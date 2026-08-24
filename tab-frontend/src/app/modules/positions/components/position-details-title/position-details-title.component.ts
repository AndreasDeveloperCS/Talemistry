import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';
import { OpenPosition } from '../../models/position';
import { PositionsService } from '../../services/positions.service';

@Component({
  selector: 'app-position-details-title',
  templateUrl: './position-details-title.component.html',
  styleUrl: './position-details-title.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDetailsTitleComponent implements OnInit, OnDestroy {
  @Output()
  formStatusChange = new EventEmitter<boolean>();

  @Output()
  aiModeActive = new EventEmitter<boolean>();

  @Output()
  positionAiGenerated = new EventEmitter<boolean>();
  
  protected _onDestroy = new Subject<void>();
  positionTitleForm: FormGroup;
  hideMainBlock = false;
  isPositionAiGenerated: boolean = false;
  titleInput: string = '';

  constructor(
    public positionsService: PositionsService,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: OpenPosition) {
    this.positionTitleForm = this.formBuilder.group({
      title: [this.positionsService.model.title || '', [Validators.required, Validators.minLength(3)]],
    });
    this.titleInput = this.positionsService.model.title;
  }

  ngOnInit(): void {
    this.positionTitleForm.valueChanges
      .pipe(takeUntil(this._onDestroy)).subscribe((value: any) => {
        this.positionsService.model.title = value.title;
        this.positionsService.notifyUpdate();
        this.titleInput = value.title;
        this.positionsService.updateForm({
          title: value.title,
        });
        this.cdr.markForCheck();
      });

    this.positionsService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((updated) => {
        if (updated) {
          this.data = this.positionsService.model;
          this.titleInput = this.positionsService.model.title;
        }
        this.emitFormStatus();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private emitFormStatus() {
    const isValid = this.positionTitleForm.valid;
    console.log('Zero Title', isValid);
    this.formStatusChange.emit(isValid);
  }

  onAiModeChanged(isActive: boolean) {
    this.hideMainBlock = isActive;
    this.aiModeActive.emit(isActive);
  }

  onPositionAiGenerated(isPositionAiGenerated: boolean) {
    this.isPositionAiGenerated = isPositionAiGenerated;
    this.positionAiGenerated.emit(isPositionAiGenerated);
  }

  onFormChanged(isChanged: any) {
    this.titleInput = this.positionsService.model.title;
    this.positionsService.updateForm({
      title: this.positionsService.model.title,
    });
    this.positionsService.notifyUpdate();
    this.emitFormStatus();
  }
}
