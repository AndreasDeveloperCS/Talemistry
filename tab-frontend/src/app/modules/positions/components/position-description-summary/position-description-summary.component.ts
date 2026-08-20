import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Editor, Toolbar } from 'ngx-editor';
import { Subject, take, takeUntil } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';
import { PositionsService } from '../../services/positions.service';

@Component({
  selector: 'app-position-description-summary',
  templateUrl: './position-description-summary.component.html',
  styleUrl: './position-description-summary.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDescriptionSummaryComponent implements OnInit, OnDestroy {
  @Input()
  private _isIncluded: boolean = true;

  @Output() 
  formStatusChange = new EventEmitter<boolean>();

  @Output() 
  isIncludedChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  private _summarySectionContent!: string;
  protected _onDestroy = new Subject<void>();
  editor = new Editor();
  headerName: string = '';
  shortProjectDescription: any = '';
  shortProjectDescriptionSection: any = '';
  jobResponsibilitiesSection: any = '';
  jobResponsibilitiesSectionSection: any = '';
  requirements: any = '';
  requirementsSection: any = '';
  benefits: any = '';

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

  public get summarySectionContent(): string {
    return this._summarySectionContent;
  }

  public set summarySectionContent(v: string) {
    this._summarySectionContent = v;
  }
  
  public get isIncluded(): boolean {
    return this._isIncluded;
  }

  public set isIncluded(value: boolean) {
    this._isIncluded = value;
    this.isIncludedChanged.emit(value);
  }

  constructor(public content: ContentService, 
    private positionService: PositionsService,
    private cdr: ChangeDetectorRef,
  ) {
    this.editor = new Editor();
    if(this.positionService.model.summary.sectionContent === "") {
      this.positionService.modelUpdated$
        .pipe(take(1))
        .subscribe((trigger) => {
        if (trigger) {
          // TODO add check of isIncluded Flag
          this.shortProjectDescription = this.positionService.model.projectDescription.sectionContent;
          this.jobResponsibilitiesSection = this.positionService.model.jobResponsibilities.sectionContent;
          this.requirements = this.positionService.model.requirements.sectionContent;
          this.benefits = this.positionService.model.benefits.sectionContent;
          this.primaryInitialization();
          this.emitFormStatus();
          this.cdr.markForCheck();
        }
      });
    } else {
      this.summarySectionContent = this.positionService.model.summary.sectionContent;
      this.cdr.markForCheck();
    }
  }

  ngOnInit(): void {
    this.positionService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((trigger) => {
      if (trigger) {
        this.summarySectionContent = this.positionService.model.summary.sectionContent;
        this.headerName = this.positionService.model.summary.sectionName;
        this.isIncluded = this.positionService.model.summary.isIncluded;
        this.initializeEditorContent();
        this.emitFormStatus();
        this.cdr.markForCheck();
      }
    });
  }
  
  ngOnDestroy(): void {
    this.editor.destroy();
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private emitFormStatus() {
    const content = this.positionService.model.summary.sectionContent;
    const isValid = this.positionService.isRealText(content)
      || !this.positionService.model.summary.isIncluded;
    console.log('Seventh Summary', isValid);
    this.formStatusChange.emit(isValid);
  }

  primaryInitialization() {
    const shortDesc = this.positionService.model.projectDescription.isIncluded ? this.cleanHtml(this.shortProjectDescription) : "";
    const jobResp = this.positionService.model.jobResponsibilities.isIncluded ? this.cleanHtml(this.jobResponsibilitiesSection) : "";
    const reqs = this.positionService.model.requirements.isIncluded ? this.cleanHtml(this.requirements) : "";
    const bens = this.positionService.model.benefits.isIncluded ? this.cleanHtml(this.benefits) : "";

    this.positionService.model.summary.sectionContent = `
      <section id="shortProjectDescription"> 
        ${shortDesc !== '' ? `<h2>${this.positionService.model.projectDescription.sectionName}</h2>` : ''} 
        ${shortDesc}
      </section>
      <section id="jobResponsibilities"> 
        ${jobResp !== '' ? `<h2>${this.positionService.model.jobResponsibilities.sectionName}</h2>` : ''}
        ${jobResp}
      </section>
      <section id="requirements"> 
        ${reqs !== '' ? `<h2>${this.positionService.model.requirements.sectionName}</h2>` : ''}
        ${reqs}
      </section>
      <section id="benefits"> 
        ${bens !== '' ? `<h2>${this.positionService.model.benefits.sectionName}</h2>` : ''}
        ${bens}
      </section>
    `;
  }

  initializeEditorContent() {
    console.log('this.summarySectionContent', this.summarySectionContent);
    this.positionService.model.summary.sectionContent = this.summarySectionContent;
  }

  cleanHtml(content: string | undefined): string {
    if (!content || content === 'undefined') {
      return '';
    }
    return content.replace(/<p>\s*<\/p>/g, '').replace(/<p>undefined<\/p>/g, '').trim();
  }

  editorChange($event: any) {
    this.initializeEditorContent();
    this.positionService.notifyUpdate();
  }

  headerChange($event: any) {
    this.positionService.model.summary.sectionName = this.headerName;
    console.log(this.positionService.model.summary.sectionName);
    this.positionService.notifyUpdate();
  }

  isIncludedChange($event: any) {
    this.positionService.model.summary.isIncluded = this.isIncluded;
    console.log(this.positionService.model.summary.isIncluded);
    this.positionService.notifyUpdate();
  }
}