import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageCroppedEvent, ImageCropperComponent, LoadedImage } from 'ngx-image-cropper';

@Component({
  selector: 'app-image-cropper-dialog',
  imports: [MatIconModule, ImageCropperComponent],
  templateUrl: './image-cropper-dialog.component.html',
  styleUrl: './image-cropper-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageCropperDialogComponent implements OnInit {

  imageChangedEvent: Event | null = null;
  croppedImage: SafeUrl = '';
  safeUrl: SafeUrl = '';

  croppedImageBlob: Blob | null | undefined;
  isDisabled: boolean = true;
  selectedFileInfo: any;

  constructor(
    private dialog: MatDialogRef<ImageCropperDialogComponent>,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: {
      file?: any;
      fileInfo?: any;
      fileName?: any;
      profileInfo?: any;
      imageEvent: Event;
    }) { }

  ngOnInit(): void {
    this.selectedFileInfo = this.data.fileInfo;

    if (this.data.imageEvent) {
      this.imageChangedEvent = this.data.imageEvent;
    }
    if (this.data.file) {
      this.createFakeChangeEvent(this.data.fileInfo);
    }
  }

  createFakeChangeEvent(file: File) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const input = document.createElement('input');
    input.type = 'file';
    input.files = dataTransfer.files;

    const event = new Event('change');
    Object.defineProperty(event, 'target', { writable: false, value: input });

    this.fileChangeEvent(event);
  }

  fileChangeEvent(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      const fileList: FileList = (input as any).files
      if (fileList && fileList.length > 0) {
        this.selectedFileInfo = fileList[0];
        this.imageChangedEvent = event;
      }
    }
  }

  onClose() {
    this.dialog.close();
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl as string);
    this.croppedImageBlob = event.blob;
    this.isDisabled = false;
  }

  imageLoaded(image: LoadedImage) {
    // show cropper
  }

  cropperReady() {

  }

  loadImageFailed() {
    // show message
  }

  upload() {
    if (this.croppedImageBlob) {
      const fileName = this.data?.file?.name || 'photo.png';
      const fileType = this.data?.file?.type || 'image/png';

      const croppedFile = new File([this.croppedImageBlob], fileName, {
        type: fileType,
        lastModified: new Date().getTime()
      });

      this.dialog.close({
        imageinfo: this.selectedFileInfo,
        image: croppedFile
      });
    }
  }

  targetAspectRatio: number = 1;
}
