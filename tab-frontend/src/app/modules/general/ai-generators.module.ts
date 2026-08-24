import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NgxEditorModule } from 'ngx-editor';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ChatGptGeneratorComponent } from './components/chat-gpt-generator/chat-gpt-generator.component';
import { GeminiGeneratorComponent } from './components/gemini-generator/gemini-generator.component';

@NgModule({
  declarations: [
    ChatGptGeneratorComponent,
    GeminiGeneratorComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    NgxEditorModule,
    LoadingSpinnerComponent,
  ],
  exports: [
    ChatGptGeneratorComponent,
    GeminiGeneratorComponent,
  ],
})
export class AiGeneratorsModule { }