import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, signal, ViewChild } from '@angular/core';

@Component({
  selector: 'app-video-player',
  imports: [],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoPlayerComponent {
  /** Backend endpoint like: http://localhost:3000/videos/sample */
  @Input({ required: true }) src!: string;

  @ViewChild('videoEl', { static: true }) videoEl!: ElementRef<HTMLVideoElement>;

  isLoading = signal(true);
  isBuffering = signal(false);

  private readonly onCanPlay = async () => {
    this.isLoading.set(false);
    try {
      await this.videoEl.nativeElement.play();
    } catch {
      // If autoplay is blocked, leave controls for the user.
    }
  };
  private readonly onWaiting = () => this.isBuffering.set(true);
  private readonly onPlaying = () => this.isBuffering.set(false);


  ngAfterViewInit(): void {
    const video = this.videoEl.nativeElement;
    video.addEventListener('canplay', this.onCanPlay);
    video.addEventListener('waiting', this.onWaiting);
    video.addEventListener('playing', this.onPlaying);
  }

  ngOnDestroy(): void {
    const video = this.videoEl?.nativeElement;
    if (!video) {
      return;
    }

    video.removeEventListener('canplay', this.onCanPlay);
    video.removeEventListener('waiting', this.onWaiting);
    video.removeEventListener('playing', this.onPlaying);
  }
}
