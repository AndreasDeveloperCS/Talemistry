import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NotificationWindowComponent } from '../../../general/dialogs/notification-window/notification-window.component';
import { FileData } from '../../../general/models/file-data';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { CoverLetterInfo } from '../../models/cover-letter';
import { CoverLetterDataInternalEnvelope } from '../../models/cv-item';
import { CandidateInfoConverterService } from '../../services/candidate-info-converter.service';
import { CoverLetterService } from '../../services/cover-letter.service';
import { CoverLetterAttachDialogComponent } from '../cover-letter-attach-dialog/cover-letter-attach-dialog.component';

@Component({
  selector: 'app-import-cover-letter',
  templateUrl: './import-cover-letter.component.html',
  styleUrl: './import-cover-letter.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportCoverLetterComponent implements OnInit, OnDestroy {
  @Input()
  buttonCaption!: string;

  @Input()
  placeholderInputSelectAttachments!: string;

  public coverLetterTextControl: FormControl = new FormControl('');
  public inputFileTypes = ['.doc', '.docx', '.rtf', '.pdf', '.png', ',jpg', '.jpeg'];
  public fileName = '';

  protected _onDestroy = new Subject<void>();
  private selectedFile!: File;
  includeAttachment: boolean = true;
  title!: string;
  fileData!: FileData;
  userId: string | undefined;

  public get selectedFileName() {
    return this.fileName == '' || this.fileName == undefined ? this.placeholderInputSelectAttachments : this.fileName;
  }

  public set selectedFileName(value) {
    this.fileName = value;
  }

  public get extensions() {
    return `${this.inputFileTypes}`;
  }

  constructor(
    public coverLetterService: CoverLetterService,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private dialogHelperService: DialogHelperService,
    private infoConverterService: CandidateInfoConverterService
  ) {
    this.title = this.content.txtCoverLetter;
  }

  ngOnInit(): void {
    this.coverLetterService.isMainEmmitter
      .pipe(takeUntil(this._onDestroy))
      .subscribe((mainCoverLetter: CoverLetterInfo) => {
        if (mainCoverLetter) {
          this.coverLetterService.coverLetterModel = mainCoverLetter;
          this.selectedFileName = this.coverLetterService.coverLetterModel?.originalName ?? '';
          this.cdr.markForCheck();
        }
      })
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  update() {
    const callbackLong = async (cvData: CoverLetterDataInternalEnvelope) => {

      if (!cvData) {
        console.error('CoverLetterAttachDialogComponent returned empty entity. Why?');
        return;
      }

      if (!this.coverLetterService.coverLetterModel) {
        this.coverLetterService.coverLetterModel = new CoverLetterInfo();
      }
      this.coverLetterService.coverLetterModel.coverLetterText = cvData.info.coverLetterText;

      if (cvData.coverLetterFileData && cvData.info.isFile) {
        console.log('Before info', cvData.info);
        this.coverLetterService.upload(cvData.info, this.fileData, true);
      }
      this.coverLetterService.updateAsync(cvData.info);
    }

    const cvDataEnvelope: CoverLetterDataInternalEnvelope = {
      coverLetterFileData: this.fileData,
      info: this.coverLetterService.coverLetterModel
    }

    this.cdr.markForCheck();

    this.dialogHelperService.openDialog(CoverLetterAttachDialogComponent, callbackLong, { panelClass: 'general-panel-class-dialog', data: cvDataEnvelope });
  }

  new() {
    const callbackLong = async (cvData: CoverLetterDataInternalEnvelope) => {

      if (!cvData) {
        return;
      }
      if (this.coverLetterService.coverLetterModel) {
        this.coverLetterService.coverLetterModel.coverLetterText = cvData.info.coverLetterText;
      }

      if (cvData.coverLetterFileData && !this.fileData && (cvData.info.withCoverLetterAttachment || cvData.info.isFile)) {
        this.dialogHelperService.openDialog(NotificationWindowComponent, () => { },
          { data: 'Please select Cover Letter attachment file or switch off the toggle button.' });
      }
      this.coverLetterService.upload(cvData.info, this.fileData);
    }

    const cvDataEnvelope: CoverLetterDataInternalEnvelope = {
      coverLetterFileData: this.fileData,
      info: this.infoConverterService.getInfoCoverLetterEnvelope(this.coverLetterService.coverLetterModel?.coverLetterText, this.fileData)
    }
    this.cdr.markForCheck();
    this.dialogHelperService.openDialog(CoverLetterAttachDialogComponent, callbackLong, { panelClass: 'general-panel-class-dialog', data: cvDataEnvelope });
  }

  onFileSelected(event: any) {

    const inputNode: any = event.srcElement;

    if (typeof (FileReader) !== 'undefined') {

      const reader = new FileReader();

      reader.onload = (node: any) => {

        this.fileData = {
          file: node.target.result,
          fileInfo: inputNode.files[0],
          fileName: inputNode.files[0].name
        };

        const callbackLong = async (cvData: CoverLetterDataInternalEnvelope) => {
          if (cvData) {
            this.coverLetterService.upload(cvData.info, this.fileData);
          } else {
            console.log('CoverLetterAttachDialogComponent returned empty entity. Why?');
          }
        }

        const cvDataEnvelope: CoverLetterDataInternalEnvelope = {
          coverLetterFileData: this.fileData,
          info: this.infoConverterService.getInfoCoverLetterEnvelope(this.coverLetterService.coverLetterModel?.coverLetterText, this.fileData)
        }

        this.dialogHelperService.openDialog(CoverLetterAttachDialogComponent, callbackLong, { data: cvDataEnvelope });
      };
      this.cdr.markForCheck();
      reader.readAsText(inputNode.files[0]);
    }
  }
}
