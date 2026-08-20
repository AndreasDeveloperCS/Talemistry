import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Editor } from 'ngx-editor';
import { Subject, take, takeUntil } from 'rxjs';
import { ContentService } from 'src/app/modules/general/services/content.service';
import { PositionsService } from 'src/app/modules/positions/services/positions.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-gemini-generator',
  templateUrl: './gemini-generator.component.html',
  styleUrl: './gemini-generator.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeminiGeneratorComponent implements OnDestroy {
  @Input() 
  isImageNeeded!: boolean;

  @Input() 
  blockName: string = '';

  @Input() 
  additionalInfo: string = '';

  @Input() 
  isRequestNeeded: boolean = true;

  @Output() close = new EventEmitter<void>();
  @Output() openFullScreen = new EventEmitter<void>();
  @Output() closeFullScreen = new EventEmitter<void>();

  public generatedForm: FormGroup<any>;
  protected _onDestroy = new Subject<void>();

  html: string = '';
  editor = new Editor();
  request: any;
  maxTokens: number = 60;
  positionTitle: string = '';
  shortDescriptionExample: string = 'We are looking for the motivated software developer for the project with cutting edge of technologies into the team of professionals as soon as possible. The domain of project is related to the area of entertainment';
  requestData = { title: 'Sample Post', content: 'This is a sample content' };

  constructor(
    public dialogRef: MatDialogRef<GeminiGeneratorComponent>,
    private geminiService: GeminiService,
    public cdr: ChangeDetectorRef,
    public content: ContentService,
    private positionService: PositionsService,
    private formBuilder: FormBuilder) {
    this.editor = new Editor();
    this.generatedForm = this.formBuilder.group<any>({
      title: new FormControl('', [Validators.required]),
      // hashtag: new FormControl('', [Validators.required])
    });
  }

  ngOnInit() {
    this.positionService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((updated) => {
      if (updated) {
        this.positionTitle = this.positionService.model.title;
      }
      if (this.isRequestNeeded) {
        this.request = `You are a recruiter hiring an expert ${this.positionTitle}. Generate a concise ${this.blockName} (max 3 sentences, total under 40 words). Max-tokens: ${this.maxTokens} Follow this style: ${this.shortDescriptionExample}.`;
      }
      this.generatedForm = this.formBuilder.group<any>({
        title: new FormControl(this.request, [Validators.required]),
      });
      this.cdr.markForCheck();
    });
  }
  
  ngOnDestroy() {
    this.editor.destroy();
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  editorChange(event: any) {
    this.html = event;
  }

  generateDescription() {
    const titleValue = this.generatedForm.get('title')?.value;
    // console.log('Title:', titleValue);
    if (titleValue.length > 0) {
      this.geminiService.generateGeminiPost(titleValue)
        .pipe(take(1)).subscribe({
        next: (response) => {
          // console.log('Generated Gemini description:', response);
          const articleText = response.article || '';
          const imagesHtml = Array.isArray(response.imageUrl)
            ? response.imageUrl.map((image: any) => `<br><img src="${image}" />`).join('')
            : '';

          this.html = articleText + imagesHtml;
          this.cdr.markForCheck();
        }, error: (err) => {
          console.error('Error generating Gemini description:', err);
          this.cdr.markForCheck();
        }
      });
    }
  }

  continueEditing() {
    if (this.html.length > 0) {
      this.requestData.content = this.html;
      this.requestData.title = this.generatedForm.get('title')?.value;
      this.closeDialog();
    }
    else return;
  }

  closeGeminiDialog() {
    this.close.emit();
  }

  openGeminiFullScreenDialog() {
    this.openFullScreen.emit();
  }

  closeGeminiFullScreenDialog() {
    this.closeFullScreen.emit();
  }

  closeDialog() {
    this.dialogRef.close(this.requestData);
  }
}
