import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Editor, Toolbar } from 'ngx-editor';
import { Subject, takeUntil } from 'rxjs';
import { PositionsService } from '../../services/positions.service';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-position-description-generic',
  templateUrl: './position-description-generic.component.html',
  styleUrl: './position-description-generic.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDescriptionGenericComponent implements OnInit, OnDestroy {
  @Input()
  private _isIncluded: boolean = true;

  @Input()
  public set descriptionItem(value: string) {
    if (this._descriptionItem != value) {
      this._descriptionItem = value;
    }
  }
  
  @Output() 
  formStatusChange = new EventEmitter<boolean>();

  @Output() 
  descriptionItemChanged: EventEmitter<string> = new EventEmitter<string>();

  private _sectionContent!: string;
  protected _onDestroy = new Subject<void>();
  _descriptionItem: string = '';
  headerName: string = '';
  isChatGptDialogVisible = false;
  isGeminiDialogVisible = false;
  isMainDialogVisible = true;
  isImageNeeded: boolean = false;
  editor = new Editor();
  
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

  public get descriptionItem(): string {
    return this._descriptionItem;
  }

  public get isIncluded(): boolean {
    return this._isIncluded;
  }

  public set isIncluded(value: boolean) {
    this._isIncluded = value;
  }

  public get sectionContent(): string {
    return this._sectionContent;
  }
  public set sectionContent(value: string) {
    this._sectionContent = value;
  }

  constructor(
    public content: ContentService,
    public positionsService: PositionsService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.positionsService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((trigger) => {
      if (trigger) {
        switch (this.descriptionItem) {
          case this.content.txtProjectDescription:
            this.sectionContent = this.positionsService.model.projectDescription.sectionContent;
            this.headerName = this.positionsService.model.projectDescription.sectionName;
            this.isIncluded = this.positionsService.model.projectDescription.isIncluded;
            console.log(this.sectionContent, this.headerName, this.isIncluded);
            this.changeDetectorRef.markForCheck();
            break;
          case this.content.txtResponsibilities:
            this.sectionContent = this.positionsService.model.jobResponsibilities.sectionContent;
            this.headerName = this.positionsService.model.jobResponsibilities.sectionName;
            this.isIncluded = this.positionsService.model.jobResponsibilities.isIncluded;
            console.log(this.sectionContent, this.headerName, this.isIncluded);
            this.changeDetectorRef.markForCheck();
            break;
          default:
            console.warn(`Unknown section: ${this.descriptionItem}`);
            this.changeDetectorRef.markForCheck();
            return;
        }
      }
      this.initializeEditorContent();
      this.emitFormStatus();
      this.changeDetectorRef.markForCheck();
    });
  }
  
  ngOnDestroy(): void {
    this.editor.destroy();
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private emitFormStatus() {
    let isValid = false;
    let content = '';
    switch (this.descriptionItem) {
      case this.content.txtProjectDescription:
        content = this.positionsService.model.projectDescription.sectionContent;
        isValid = this.positionsService.isRealText(content) 
          || !this.positionsService.model.projectDescription.isIncluded;
        break;
      case this.content.txtResponsibilities:
        content = this.positionsService.model.jobResponsibilities.sectionContent;
          isValid = this.positionsService.isRealText(content) 
          || !this.positionsService.model.jobResponsibilities.isIncluded;
        break;
      default:
        console.warn(`Unknown section: ${this.descriptionItem}`);
        return;
    }
    console.log('Third/Fourth', isValid);
    this.formStatusChange.emit(isValid);
  }

  initializeEditorContent() {
    switch (this.descriptionItem) {
      case this.content.txtProjectDescription:
        this.positionsService.model.projectDescription.sectionContent = this.sectionContent;
        console.log(this.positionsService.model.projectDescription.sectionContent);
        break;
      case this.content.txtResponsibilities:
        this.positionsService.model.jobResponsibilities.sectionContent = this.sectionContent;
        console.log(this.positionsService.model.jobResponsibilities.sectionContent);
        break;
      default:
        console.warn(`Unknown section: ${this.descriptionItem}`);
        return;
    }
  } 

  editorChange($event: any) {
    this.initializeEditorContent();
    this.positionsService.notifyUpdate();
  }

  headerChange($event: any) {
    switch (this.descriptionItem) {
      case this.content.txtProjectDescription:
        this.positionsService.model.projectDescription.sectionName = this.headerName;
        console.log(this.positionsService.model.projectDescription.sectionName);
        break;
      case this.content.txtResponsibilities:
        this.positionsService.model.jobResponsibilities.sectionName = this.headerName;
        console.log(this.positionsService.model.jobResponsibilities.sectionName);
        break;
      default:
        console.warn(`Unknown section: ${this.descriptionItem}`);
        return;
    }
    this.positionsService.notifyUpdate();
  }

  isIncludedChange($event: any) {
    switch (this.descriptionItem) {
      case this.content.txtProjectDescription:
        this.positionsService.model.projectDescription.isIncluded = this.isIncluded;
        console.log(this.positionsService.model.projectDescription.isIncluded);
        break;
      case this.content.txtResponsibilities:
        this.positionsService.model.jobResponsibilities.isIncluded = this.isIncluded;
        console.log(this.positionsService.model.jobResponsibilities.isIncluded);
        break;
      default:
        console.warn(`Unknown section: ${this.descriptionItem}`);
        return;
    }
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
}