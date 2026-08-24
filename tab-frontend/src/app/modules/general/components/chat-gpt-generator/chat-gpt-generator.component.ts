import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, Optional, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Editor } from 'ngx-editor';
import { Subject, take, takeUntil } from 'rxjs';
import { ContentService } from 'src/app/modules/general/services/content.service';
import { PositionsService } from 'src/app/modules/positions/services/positions.service';
import { ChatGptService } from '../../services/chat-gpt.service';

@Component({
  selector: 'app-chat-gpt-generator',
  templateUrl: './chat-gpt-generator.component.html',
  styleUrl: './chat-gpt-generator.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatGptGeneratorComponent implements OnDestroy {
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

  protected _onDestroy = new Subject<void>();
  public generatedForm!: FormGroup<any>;
  html: string = '';
  editor = new Editor();
  request: string = '';
  maxTokens: number = 60;
  positionTitle: string = '';
  loading: boolean = false;
  shortDescriptionExample: string = 'We are looking for the motivated software developer for the project with cutting edge of technologies into the team of professionals as soon as possible. The domain of project is related to the area of entertainment';

  constructor(
    @Optional() public dialogRef: MatDialogRef<ChatGptGeneratorComponent>,
    private chatGptService: ChatGptService,
    private cdr: ChangeDetectorRef,
    private positionService: PositionsService,
    public content: ContentService,
    private formBuilder: FormBuilder) {
    this.editor = new Editor();
  }

  ngOnInit() {
    this.generatedForm = this.formBuilder.group({
      title: ['', Validators.required],
    });

    this.positionService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((updated) => {

        if (updated) {
          this.positionTitle = this.positionService.model.title;
        }

        if (this.isRequestNeeded) {
          // this.request = `You are a recruiter hiring an expert ${this.positionTitle}. Generate a concise ${this.blockName} (max 3 sentences, total under 40 words). Max-tokens: ${this.maxTokens} Follow this style: ${this.shortDescriptionExample}.`;
          this.request = `You are a recruiter hiring an expert ${this.positionTitle}. Generate a concise ${this.blockName} (max 3 sentences, total under 40 words). Max-tokens: ${this.maxTokens}.`;
        }

        this.generatedForm.patchValue({
          title: this.request,
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
    this.loading = true;
    const titleValue = this.generatedForm.get('title')?.value;
    if (titleValue.length > 0) {
      this.chatGptService.generateChatGptContent(titleValue, this.isImageNeeded).pipe(take(1)).subscribe({
        next: (response) => {
          // console.log('Generated position:', response);
          if (response.images) {
            this.html = response.article + response.images.map((image: any) => `<br><img src="${image}" />`).join('');
          }
          else {
            this.html = response.article;
          }
          this.loading = false;
          this.cdr.markForCheck();
        }, error: (err) => {
          this.html = 'Error generating position post';
          console.error('Error generating position post:', err);
          this.loading = false;
          this.cdr.markForCheck();
        }
    });
    }
  }

  closeChatGptDialog() {
    this.close.emit();
  }

  openChatGptFullScreenDialog() {
    this.openFullScreen.emit();
  }

  closeChatGptFullScreenDialog() {
    this.closeFullScreen.emit();
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
