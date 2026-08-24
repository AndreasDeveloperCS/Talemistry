import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Editor, Toolbar } from 'ngx-editor';
import { Subject, take, takeUntil } from 'rxjs';
import { PositionBenefit } from '../../../position-benefits/models/position-benefit';
import { PositionsService } from '../../services/positions.service';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-position-description-benefits',
  templateUrl: './position-description-benefits.component.html',
  styleUrl: './position-description-benefits.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PositionDescriptionBenefitsComponent implements OnInit, OnDestroy {
  @Input()
  private _isIncluded: boolean = true;
  
  @Input()
  public set descriptionItem(value: string) {
    if (this._descriptionItem != value) {
      this._descriptionItem = value;
      this.descriptionItemChanged.emit(this._descriptionItem);
    }
  }

  @Output() 
  formStatusChange = new EventEmitter<boolean>();

  @Output()
  descriptionItemChanged: EventEmitter<string> = new EventEmitter<string>();

  private _benefitSectionContent!: string;
  protected _onDestroy = new Subject<void>();
  editor = new Editor();
  isChatGptDialogVisible = false;
  isGeminiDialogVisible = false;
  isMainDialogVisible = true;
  isImageNeeded: boolean = false;
  _descriptionItem: string = '';
  benefitsSectionKey: string = '';
  headerName: string = '';
  positionBenefits: PositionBenefit[] = [];

  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  public get isIncluded(): boolean {
    return this._isIncluded;
  }

  public get benefitSectionContent(): string {
    return this._benefitSectionContent;
  }

  public set benefitSectionContent(v: string) {
    this._benefitSectionContent = v;
  }

  public get descriptionItem(): string {
    return this._descriptionItem;
  }

  public set isIncluded(value: boolean) {
    this._isIncluded = value;
  }

  constructor(
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private positionService: PositionsService,
    private fb: FormBuilder
  ) {
    this.editor = new Editor();
    this.benefitsSectionKey = this.positionService.model.benefits.sectionKey;
    if(this.positionService.model.benefits.sectionContent === "" 
      && this.positionService.model.positionDetails.conditions.benefits.length > 0) {
      this.positionService.modelUpdated$
        .pipe(take(1))
        .subscribe((trigger) => {
        if (trigger) {
          this.positionBenefits = this.positionService.model.positionDetails.conditions.benefits;
          this.benefitSectionContent = this.positionService.model.benefits.sectionContent;
          this.headerName = this.positionService.model.benefits.sectionName;
          this.isIncluded = this.positionService.model.benefits.isIncluded;
          this.primaryInitialization();
          this.emitFormStatus();
          this.cdr.markForCheck();
        }
      });
    } else {
      this.benefitSectionContent = this.positionService.model.benefits.sectionContent;
      this.cdr.markForCheck();
    }
  }

  ngOnInit(): void {
    this.positionService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((trigger) => {
      if (trigger) {
        this.positionService.model.benefits.sectionContent = this.benefitSectionContent;
        this.headerName = this.positionService.model.benefits.sectionName;
        this.isIncluded = this.positionService.model.benefits.isIncluded;
        this.initializeEditorContent();
        this.emitFormStatus();
      }
      this.cdr.markForCheck();
    });
  }
  
  ngOnDestroy(): void {
    this.editor.destroy();
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private emitFormStatus() {
    const content = this.positionService.model.benefits.sectionContent;
    const isValid = this.positionService.isRealText(content)
      || !this.positionService.model.benefits.isIncluded;
    console.log('Sixth Benefits', isValid);
    this.formStatusChange.emit(isValid);
  }

  primaryInitialization() {
    const listItems = this.positionBenefits
      .map(section => `
        <li>
          <div class="editable-area">${section.benefit}</div>
        </li>`)
      .join('');
  
    this.benefitSectionContent = `
      <section id="${this.benefitsSectionKey}">
        <ul>
          ${listItems}
        </ul>
      </section>
    `;
  }  

  initializeEditorContent() {
    console.log('this.benefitSectionContent', this.benefitSectionContent);
    this.positionService.model.benefits.sectionContent = this.benefitSectionContent;
  }

  benefitsContent() {
    this.benefitSectionContent = this.positionBenefits
      .map((benefit) => benefit.benefit)
      .join(`<br/>`);
  }

  editorChange($event: any) {
    this.initializeEditorContent();
    this.positionService.notifyUpdate();
  }

  headerChange($event: any) {
    this.positionService.model.benefits.sectionName = this.headerName;
    console.log(this.positionService.model.benefits.sectionName);
    this.positionService.notifyUpdate();
  }

  isIncludedChange($event: any) {
    this.positionService.model.benefits.isIncluded = this.isIncluded;
    console.log(this.positionService.model.benefits.isIncluded);
    this.positionService.notifyUpdate();
  }

  openChatGptDialog() {
    this.isChatGptDialogVisible = true;
  }

  handleCloseChatGptDialog() {
    this.isChatGptDialogVisible = false;
    this.isMainDialogVisible = true;
  }

  openGeminiDialog() {
    this.isGeminiDialogVisible = true;
  }

  handleCloseGeminiDialog() {
    this.isGeminiDialogVisible = false;
    this.isMainDialogVisible = true;
  }

  handleOpenChatGptFullScreenDialog() {
    this.isMainDialogVisible = false;
    this.isChatGptDialogVisible = true;
    this.isGeminiDialogVisible = false;
  }

  handleCloseChatGptFullScreenDialog() {
    this.isMainDialogVisible = true;
  }

  handleOpenGeminiFullScreenDialog() {
    this.isMainDialogVisible = false;
    this.isChatGptDialogVisible = false;
    this.isGeminiDialogVisible = true;
  }

  handleCloseGeminiFullScreenDialog() {
    this.isMainDialogVisible = true;
  }
}