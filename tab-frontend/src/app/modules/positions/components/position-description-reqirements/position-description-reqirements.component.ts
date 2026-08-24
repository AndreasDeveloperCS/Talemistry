import { AfterContentChecked, AfterContentInit, AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Editor, Toolbar } from 'ngx-editor';
import { Subject, take, takeUntil } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';
import { PositionItem } from '../../models/position';
import { PositionSkill, SkillImportance } from '../../models/position-details';
import { PositionsService } from '../../services/positions.service';

@Component({
  selector: 'app-position-description-reqirements',
  templateUrl: './position-description-reqirements.component.html',
  styleUrl: './position-description-reqirements.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDescriptionReqirementsComponent implements OnInit, OnDestroy {
  @Input()
  startIndex: number = 0;

  @Input()
  endIndex: number = 0;

  @Input()
  private _isIncluded: boolean = false;
  
  @Input()
  public set descriptionItem(value: string) {
    if (this._descriptionItem != value) {
      this._descriptionItem = value;
      this.descriptionItemChanged.emit(this._descriptionItem);
    }
  }
  
  @Input()
  set selectedOrder(value: number) {
    this._selectedOrder = value;
    this.selectedOrderChanged.emit(value);
  }
  
  @Input() 
  isLastTab: boolean = false;

  @Input() 
  isFirstTab: boolean = false;

  @Input()
  public set orderPriority(value: number) {
    this.priorityArray = Array.from(new Array(value), (x, i) => i);
  }

  @Output() 
  addTab = new EventEmitter<void>();
  
  @Output() 
  removeTab = new EventEmitter<number>();
  
  @Output()
  htmlChanged: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  isIncludedChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  descriptionItemChanged: EventEmitter<string> = new EventEmitter<string>();
  
  @Output() 
  formStatusChange = new EventEmitter<boolean>();

  @Output() 
  selectedOrderChanged: EventEmitter<number> = new EventEmitter<number>();

  @Input()
  @Output()
  get html(): string {
    return this._html;
  }

  private _requirementSectionContent!: string;
  protected _onDestroy = new Subject<void>();
  _descriptionItem: string = '';
  _html: string = '';
  editor = new Editor();
  isChatGptDialogVisible = false;
  isGeminiDialogVisible = false;
  isMainDialogVisible = true;
  isImageNeeded: boolean = false;
  headerName: string = '';
  positionSkills: PositionSkill[] = [];
  _selectedOrder: number = 0;
  _orderIdPriority: number = 0;
  priorityArray: number[] = [1];
  
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

  skills: Map<string, SkillImportance> = new Map<string, SkillImportance>([
    ['Mandatory requirements', SkillImportance.mandatory],
    ['Desired skills and knowledge', SkillImportance.desired],
    ['Nice to have', SkillImportance.niceToHave],
    ['Extra Points', SkillImportance.optional],
  ]);

  public get descriptionItem(): string {
    return this._descriptionItem;
  }

  public get requirementSectionContent(): string {
    return this._requirementSectionContent;
  }
  public set requirementSectionContent(v: string) {
    this._requirementSectionContent = v;
  }
  
  public get isIncluded(): boolean {
    return this._isIncluded;
  }

  public set isIncluded(value: boolean) {
    this._isIncluded = value;
    this.isIncludedChanged.emit(value);
  }

  public get requirements(): PositionItem[] {
    return this.positionsService.model.requirements.requirementSections;
  }

  get selectedOrder(): number {
    return this._selectedOrder;
  }

  set html(value: string) {
    if (this._html != value) {
      this._html = value;
    }
  }

  constructor(
    public content: ContentService,
    private positionsService: PositionsService,
    private changeDetectorRef: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.editor = new Editor();

    if(this.positionsService.model.requirements.sectionContent === "" 
      && this.positionsService.model.positionDetails.requirements.positionSkills.length > 0) {
      this.positionsService.modelUpdated$
        .pipe(take(1))
        .subscribe((trigger) => {
        if (trigger) {
          this.positionSkills = this.positionsService.model.positionDetails.requirements.positionSkills;
          this.requirementSectionContent = this.positionsService.model.requirements.sectionContent;
          this.headerName = this.positionsService.model.benefits.sectionName;
          this.isIncluded = this.positionsService.model.benefits.isIncluded;
          this.skills.forEach((value, key) => {
            this.isRequirementIncluded(key, value);
          });
          this.primaryInitialization();
          this.emitFormStatus();
          this.changeDetectorRef.markForCheck();
        }
      });
    } else {
      this.requirementSectionContent = this.positionsService.model.requirements.sectionContent;
      this.changeDetectorRef.markForCheck();
    }
  }

  ngOnInit(): void {
    this.positionsService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((trigger) => {
      if (trigger) {
        this.positionsService.model.requirements.sectionContent = this.requirementSectionContent;
        this.headerName = this.positionsService.model.requirements.sectionName;
        this.isIncluded = this.positionsService.model.requirements.isIncluded;
        this.initializeEditorContent();
        this.emitFormStatus();
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.editor.destroy();
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private emitFormStatus() {
    const content = this.positionsService.model.requirements.sectionContent;
    const allSectionsUnincluded = this.positionsService.model.requirements.requirementSections
      .every(section => section.isIncluded === false);
    console.log('allSectionsUnincluded', allSectionsUnincluded);
    const isValid = this.positionsService.isRealText(content) || allSectionsUnincluded;
    console.log('this.positionsService.isRealText(content)', this.positionsService.isRealText(content));
    console.log('Fifth Requirements', isValid);
    this.formStatusChange.emit(isValid);
  }

  headerChange($event: any) {
    this.positionsService.model.requirements.sectionName = this.headerName;
    console.log(this.positionsService.model.requirements.sectionName);
    this.positionsService.notifyUpdate();
  }

  initializeEditorContent() {
    console.log('this.requirementSectionContent', this.requirementSectionContent);
    this.positionsService.model.requirements.sectionContent = this.requirementSectionContent;
  }

  primaryInitialization() {
    this.requirementSectionContent = this.requirements.filter(item => item.isIncluded)
      .map(section => `
      <section id="${section.sectionKey}"> 
        <h2 contenteditable="false" class="readonly-input"><input readonly value="${section.sectionName}" />${section.sectionName}</h2> 
        <div class="editable-area">${section.sectionContent}</div> 
      </section>
            <br/>`)
      .join('');
    this.positionsService.model.requirements.sectionContent = this.requirementSectionContent;
  }

  isRequirementIncluded(sectionName: string, skillImportance: SkillImportance) {
    const index = this.requirements.findIndex(item => item?.sectionName === sectionName);
    this.requirements[index].isIncluded = this.positionSkills.some(skill => skill.skillImportance === skillImportance);
    this.requirementContent(index);
  }

  requirementContent(index: number) {
    const sectionName = this.requirements[index].sectionName;

    const skillImportance = this.skills.get(sectionName);

    if (!skillImportance) {
      console.warn(`Not found skillImportance for section: ${sectionName}`);
      return;
    }

    this.requirements[index].sectionContent = this.positionSkills
      .filter((skill) => skill.skillImportance === skillImportance)
      .map((skill) => skill.skillName)
      .join(`<br/>`);
  }

  parseEditorContent() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.requirementSectionContent, 'text/html');

    this.requirements.forEach((section: PositionItem) => {
      const sectionElement = doc.querySelector(`section[id="${section.sectionKey}"]`);
      if (sectionElement) {
        const editableDiv = sectionElement.querySelector('.editable-area');
        if (editableDiv) {
          section.sectionContent = editableDiv.innerHTML.trim();
        }
      }
    });
  }

  isIncludedChange(event: boolean) {
    this.positionsService.model.requirements.isIncluded = this.isIncluded;
    this.positionsService.notifyUpdate();
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

  editorChange($event: any) {
    this.initializeEditorContent();
    this.positionsService.notifyUpdate();
  }

  convertToHtml(contentArray: any[]): string {
    return contentArray.map(block => this.parseBlock(block)).join('');
  }

  parseBlock(block: any): string {
    if (!block || typeof block !== 'object') return '';

    if (block.type === 'paragraph') {
      return `<p>${block.content?.map((c: any) => c.text || '').join('')}</p>`;
    }
    if (block.type === 'heading') {
      return `<h${block.attrs?.level || 1}>${block.content?.map((c: any) => c.text || '').join('')}</h${block.attrs?.level || 1}>`;
    }
    return '';
  }

  isIncludedFlagChanged($event: any, currentIndex: number) {
    this.positionsService.model.positionElements[(this.startIndex + currentIndex)].isIncluded = $event;
  }
}
