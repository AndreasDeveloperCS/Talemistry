import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, take, takeUntil } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';
import { HttpService } from '../../../general/services/http.service';
import { getItem, OpenPosition, PositionItem, TabItem } from '../../models/position';
import { PositionValidationService } from '../../services/position-validation.service';
import { PositionsService } from '../../services/positions.service';
import { OpenPositionStages } from '../../models/open-position-stages';

@Component({
  selector: 'app-position-page-dialog',
  templateUrl: './position-page-dialog.component.html',
  styleUrl: './position-page-dialog.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionPageDialogComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  notificationMessages: string[] = [];
  isPositionTitleFormValid = false;
  controlButtonContent: string = "";
  isEdit: boolean = false;
  _tabs: TabItem[] = [];
  isStepTitleValid = false;
  isStepGeneralValid = false;
  isStepSkillsValid = false;
  isStepDescriptionValid = false;
  isStepResponsibilitiesValid = false;
  isStepRequirementsValid = false;
  isStepBenefitsValid = false;
  isStepSummaryValid = false;
  isAiMode: boolean = false;
  isPositionAiGenerated: boolean = false;
  currentStep: number = 0;
  selected: FormControl = new FormControl(0);

  stepDetailsFull = [
    { icon: 'workspace_premium', label: OpenPositionStages.Title },
    { icon: 'description', label: OpenPositionStages.General },
    { icon: 'badge', label: OpenPositionStages.Skills },
    { icon: 'text_snippet', label: OpenPositionStages.Description },
    { icon: 'work', label: OpenPositionStages.Responsibilities },
    { icon: 'playlist_add_check', label: OpenPositionStages.Requirements },
    { icon: 'emoji_events', label: OpenPositionStages.Benefits },
    { icon: 'dashboard', label: OpenPositionStages.Summary },
    { icon: 'check_circle_outline', label: OpenPositionStages.Success }
  ];

  stepDetailsShort = [
    { icon: 'workspace_premium', label: OpenPositionStages.Title },
    { icon: 'dashboard', label: OpenPositionStages.Summary },
    { icon: 'badge', label: OpenPositionStages.Skills },
    { icon: 'description', label: OpenPositionStages.General },
    { icon: 'check_circle_outline', label: OpenPositionStages.Success }
  ];

  steps = this.isShortFormat ? this.stepDetailsShort : this.stepDetailsFull;
  totalSteps = this.isShortFormat ? this.stepDetailsShort.length : this.stepDetailsFull.length;

  private stepValidationMap: Record<StepLabel, () => boolean> = {
    Title: () => this.isStepTitleValid,
    General: () => this.isStepGeneralValid,
    Skills: () => this.isStepSkillsValid,
    Description: () => this.isStepDescriptionValid,
    Responsibilities: () => this.isStepResponsibilitiesValid,
    Requirements: () => this.isStepRequirementsValid,
    Benefits: () => this.isStepBenefitsValid,
    Summary: () => this.isStepSummaryValid,
    Success: () => true
  };

  public set tabs(value: TabItem[]) {
    this._tabs = value;
  }

  public get tabs(): TabItem[] {
    return this._tabs;
  }

  get isShortFormat(): boolean {
    return this.isAiMode || this.isPositionAiGenerated;
  }

  constructor(
    public positionsService: PositionsService,
    public httpService: HttpService,
    private cdr: ChangeDetectorRef,
    public content: ContentService,
    private positionValidationService: PositionValidationService,
    public dialogRef: MatDialogRef<PositionPageDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: OpenPosition
  ) {

    Object.setPrototypeOf(data, OpenPosition.prototype);
    this.isEdit = this.data && !!this.data._id;
    if(this.isEdit) {
      this.isStepTitleValid = true;
      this.isStepGeneralValid = true;
      this.isStepSkillsValid = true;
      this.isStepDescriptionValid = true;
      this.isStepResponsibilitiesValid = true;
      this.isStepRequirementsValid = true;
      this.isStepBenefitsValid = true;
      this.isStepSummaryValid = true;
    }
    this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
    //this.checkDetailsTab();
  }

  ngOnInit(): void {
    this.selected = new FormControl(this.tabs[0]?.orderId - 1);
    this.tabs.forEach(tab => tab.isIncluded = true);

    this.positionsService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((updated) => {
        if (updated) {
          this.data = this.positionsService.model;
        }
        this.cdr.markForCheck();
      });
    console.log('Open Position ngOnInit this.data', this.data);
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onStepTitleStatusChange(isValid: boolean) {
    this.isStepTitleValid = isValid;
  }

  onStepGeneralStatusChange(isValid: boolean) {
    this.isStepGeneralValid = isValid;
  }

  onStepSkillsStatusChange(isValid: boolean) {
    this.isStepSkillsValid = isValid;
  }

  onStepDescriptionStatusChange(isValid: boolean) {
    this.isStepDescriptionValid = isValid;
  }

  onStepResponsibilitiesStatusChange(isValid: boolean) {
    this.isStepResponsibilitiesValid = isValid;
  }

  onStepRequirementsStatusChange(isValid: boolean) {
    this.isStepRequirementsValid = isValid;
  }

  onStepBenefitsStatusChange(isValid: boolean) {
    this.isStepBenefitsValid = isValid;
  }

  onStepSummaryStatusChange(isValid: boolean) {
    this.isStepSummaryValid = isValid;
  }

  isStepValid(stepIndex: number): boolean {
    const step = this.steps[stepIndex];
    if (!step) {
      return true;
    }
    return this.stepValidationMap[step.label as StepLabel]();
  }

  isStepClickable(stepIndex: number): boolean {
    for (let i = 0; i < stepIndex; i++) {
      if (!this.isStepValid(i)) {
        return false;
      }
    }
    return true;
  }

  goToStep(stepIndex: number): void {
    if (this.isStepClickable(stepIndex)) {
      this.currentStep = stepIndex;
    }
  }

  goToNextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      if (this.isPositionAiGenerated) {
        this.autoValidateCurrentStep();
      }
    }
  }

  autoValidateCurrentStep() {
    const label = this.steps[this.currentStep].label;

    if (label === OpenPositionStages.General) {
      this.isStepGeneralValid = true;
    }
    if (label === OpenPositionStages.Skills) {
      this.isStepSkillsValid = true;
    }
    if (label === OpenPositionStages.Summary) {
      this.isStepSummaryValid = true;
    }
  }

  goToPreviousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  private updateSteps(): void {
    const short = this.isShortFormat;
    this.steps = short ? this.stepDetailsShort : this.stepDetailsFull;
    console.log('updateSteps steps', this.steps);
    this.totalSteps = this.steps.length;
    if (this.currentStep >= this.totalSteps) {
      this.currentStep = this.totalSteps - 1;
    }
    console.log('updateSteps currentStep', this.currentStep);
  }

  onAiModeActive(isActive: boolean) {
    this.isAiMode = isActive;
    this.updateSteps();
  }

  onPositionAiGenerated(isGen: boolean) {
    this.isPositionAiGenerated = isGen;
    this.updateSteps();
  }

  getProgressWidth(): number {
    if (this.totalSteps <= 1) return 5;

    const stepRatio = this.currentStep / (this.totalSteps - 1);
    const baseProgress = stepRatio * 90 + 5; // 5% min, 95% max
    return Math.min(baseProgress, 95);
  }

  getTrackLineWidth(): number {
    if (this.totalSteps <= 1) return 0;
    return (this.currentStep / (this.totalSteps - 1)) * 100;
  }

  async onSave() {
    this.goToNextStep();

    this.positionsService.modelUpdated$
      .pipe(take(1))
      .subscribe((updated) => {
        if (updated) {
          console.log('this.positionsService.model', this.positionsService.model);
          this.data = this.positionsService.model;
          this.positionsService.model = new OpenPosition();
          if (this.isEdit) {
            this.positionsService.updateAsync(this.data, true).pipe(take(1)).subscribe({
              next: (saved: OpenPosition) => {
                console.log('Saved', saved);
                this.cdr.markForCheck();
              }, error: (error) => {
                console.error('Error updating the position', error);
                this.cdr.markForCheck();
              }
            });
          }
          else {
            console.log('Start creating position...', this.data);
            this.positionsService.createAsync(this.data, true, false).pipe(take(1)).subscribe({
              next: (saved: OpenPosition) => {
                console.log('Createdposition', saved);
                this.positionsService.refreshDataBehaviorSubject.next(true);
                this.cdr.markForCheck();
              }, error: (error) => {
                console.error('Error creating the position', error);
                this.cdr.markForCheck();
              }
            });
          }
          console.log("End save ", this.data);
        }
      });
  }

  validateContent(position: OpenPosition): boolean {
    const validationResult = this.positionValidationService.validate(position);
    if (!validationResult[0]) {
    }
    return validationResult[0];
  }

  isUpdateValid(items: OpenPosition[]): boolean {
    return this.isEdit && items && items?.length == 1 && items[0]._id == this.data._id;
  }

  manageNotificationMessage(message: string) {
    if (!this.notificationMessages.includes(message)) {
      this.notificationMessages.push(message);
      setTimeout(() => {
        const index = this.notificationMessages.indexOf(message, 0);
        if (index > -1) {
          this.notificationMessages.splice(index, 1);
        }
        this.cdr.markForCheck();
      }, 10000);
    }
  }

  closeTheDialog() {
    this.dialogRef.close('addAnotherPosition');
  }

  onCancel() {
    this.positionsService.model = new OpenPosition();
    this.dialogRef.close();
  }

  addTab() {
    const newIndex = this.getMax(this.data.positionAlternativeElements);
    this.data.positionAlternativeElements.push(getItem('New Section', newIndex));
    this.selected.setValue(this.data.positionAlternativeElements.length - 1);
  }

  getMax(positionAlternativeElements: PositionItem[]) {
    return positionAlternativeElements.length;
  }

  getSectionName(tab: any) {
    return tab != undefined ? tab.sectionName : '';
  }

  setValue(selected: any, $event: any) {
    selected.setValue($event);
  }

  async updateName(newName: string, item: TabItem) {
    if (item && item.sectionName !== newName) {
      item.sectionName = newName;
    }
  }

  async updateIsIncludedFlag(isIncludedFlag: boolean, item: TabItem) {

    if (item.isIncluded !== isIncludedFlag) {
      item.isIncluded = isIncludedFlag;
    }
  }

  async updateContent(content: string, item: TabItem) {
    if (item.sectionContent !== content) {
      item.sectionContent = content;
    }
  }

  updateOrder(newOrderId: number, item: TabItem) {
    if (item && item.orderId > newOrderId) {

      this.data.positionAlternativeElements.forEach((element: any) => {
        if (
          element &&
          item.orderId > element.orderId &&
          element?.orderId >= newOrderId
        ) {
          ++element.orderId;
        }
      });
      item.orderId = newOrderId;
    }
    if (item && item.orderId < newOrderId) {
      this.data.positionAlternativeElements.forEach((element: any) => {
        if (
          element &&
          item.orderId < element.orderId &&
          element.orderId <= newOrderId
        ) {
          --element.orderId;
        }
      });
      item.orderId = newOrderId;
    }
  }

  removeTab(index: number) {

    if (index === 0) {
      return;
    }
    delete this.data.positionAlternativeElements[index];
    if (index > -1) {
      this.data.positionAlternativeElements.splice(index, 1); 
    }
  }

  updateSelectedIndex() {
    this.selected.setValue(this.selected.value);
  }
}

type StepLabel =
  | 'Title'
  | 'General'
  | 'Skills'
  | 'Description'
  | 'Responsibilities'
  | 'Requirements'
  | 'Benefits'
  | 'Summary'
  | 'Success';