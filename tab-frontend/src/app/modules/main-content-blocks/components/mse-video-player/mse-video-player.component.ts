import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';

@Component({
  selector: 'app-mse-video-player',
  imports: [],
  standalone: true,
  templateUrl: './mse-video-player.component.html',
  styleUrl: './mse-video-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MseVideoPlayerComponent {
  @Input({ required: true }) src!: string; // e.g., http://localhost:3000/videos/sample
  @ViewChild('v', { static: true }) v!: ElementRef<HTMLVideoElement>;
  private readonly chunkSize = 1_000_000;
  private mediaSource?: MediaSource;
  private sourceBuffer?: SourceBuffer;
  private objectUrl?: string;
  private destroyed = false;
  private streamSessionId = 0;
  private fetchController?: AbortController;
  private sourceOpenHandler?: EventListener;


  async ngAfterViewInit(): Promise<void> {
    await this.initializeStream();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && !changes['src'].firstChange && this.v) {
      void this.initializeStream();
    }
  }

  private async initializeStream(): Promise<void> {
    if (this.destroyed || !this.v) {
      return;
    }

    const sessionId = ++this.streamSessionId;
    this.cleanupStream();

    const mediaSource = new MediaSource();
    this.mediaSource = mediaSource;
    const url = URL.createObjectURL(mediaSource);
    this.objectUrl = url;
    const video = this.v.nativeElement;
    video.src = url;

    this.sourceOpenHandler = () => {
      void this.startStreaming(mediaSource, video, sessionId);
    };

    mediaSource.addEventListener('sourceopen', this.sourceOpenHandler, { once: true });
  }

  private async startStreaming(mediaSource: MediaSource, video: HTMLVideoElement, sessionId: number): Promise<void> {
    const mime = this.getSupportedMimeType();
    if (!mime) {
      console.error('No supported MSE mime type found for MP4 playback');
      return;
    }

    if (this.destroyed || sessionId !== this.streamSessionId || mediaSource.readyState !== 'open') {
      return;
    }

    const sourceBuffer = mediaSource.addSourceBuffer(mime);
    this.sourceBuffer = sourceBuffer;

    let start = 0;

    try {
      while (!this.destroyed && sessionId === this.streamSessionId) {
        const chunk = await this.fetchChunk(start, sessionId);
        if (!chunk) {
          return;
        }

        if (chunk.byteLength === 0) {
          break;
        }

        await this.appendChunk(sourceBuffer, chunk.buffer, sessionId);
        start += chunk.byteLength;

        if (video.paused) {
          video.play().catch(() => {});
        }

        if (chunk.reachedEnd) {
          break;
        }
      }

      if (!this.destroyed && sessionId === this.streamSessionId && mediaSource.readyState === 'open') {
        mediaSource.endOfStream();
      }
    } catch (error) {
      if (this.isAbortError(error) || this.destroyed || sessionId !== this.streamSessionId) {
        return;
      }

      if (mediaSource.readyState === 'open') {
        try {
          mediaSource.endOfStream('network');
        } catch {
        }
      }

      console.error('Failed to stream video through MSE', error);
    }
  }

  private async fetchChunk(start: number, sessionId: number): Promise<{ buffer: ArrayBuffer; byteLength: number; reachedEnd: boolean; } | null> {
    if (this.destroyed || sessionId !== this.streamSessionId) {
      return null;
    }

    const end = start + this.chunkSize - 1;
    const controller = new AbortController();
    this.fetchController = controller;

    const response = await fetch(this.src, {
      headers: { Range: `bytes=${start}-${end}` },
      signal: controller.signal,
    });

    if (!response.ok && response.status !== 206) {
      throw new Error(`Bad response while fetching video chunk: ${response.status}`);
    }

    if (response.status === 200 && start > 0) {
      throw new Error('Video endpoint does not support range requests');
    }

    const buffer = await response.arrayBuffer();
    const byteLength = buffer.byteLength;
    const totalBytes = this.getTotalBytes(response, start, byteLength);
    const reachedEnd = byteLength < this.chunkSize || (totalBytes !== null && start + byteLength >= totalBytes);

    return {
      buffer,
      byteLength,
      reachedEnd,
    };
  }

  private async appendChunk(sourceBuffer: SourceBuffer, buffer: ArrayBuffer, sessionId: number): Promise<void> {
    if (this.destroyed || sessionId !== this.streamSessionId || this.mediaSource?.readyState !== 'open') {
      return;
    }

    if (sourceBuffer.updating) {
      await this.waitForUpdateEnd(sourceBuffer);
    }

    await new Promise<void>((resolve, reject) => {
      const onUpdateEnd = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error('SourceBuffer append failed'));
      };

      const cleanup = () => {
        sourceBuffer.removeEventListener('updateend', onUpdateEnd);
        sourceBuffer.removeEventListener('error', onError);
      };

      sourceBuffer.addEventListener('updateend', onUpdateEnd, { once: true });
      sourceBuffer.addEventListener('error', onError, { once: true });

      try {
        sourceBuffer.appendBuffer(buffer);
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }

  private waitForUpdateEnd(sourceBuffer: SourceBuffer): Promise<void> {
    if (!sourceBuffer.updating) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const onUpdateEnd = () => {
        sourceBuffer.removeEventListener('updateend', onUpdateEnd);
        resolve();
      };

      sourceBuffer.addEventListener('updateend', onUpdateEnd, { once: true });
    });
  }

  private getSupportedMimeType(): string | null {
    const candidates = [
      'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
      'video/mp4; codecs="avc1.4D401E, mp4a.40.2"',
      'video/mp4; codecs="avc1.64001F, mp4a.40.2"',
      'video/mp4',
    ];

    return candidates.find((candidate) => MediaSource.isTypeSupported(candidate)) ?? null;
  }

  private getTotalBytes(response: Response, start: number, byteLength: number): number | null {
    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      const match = /bytes\s+\d+-\d+\/(\d+|\*)/i.exec(contentRange);
      if (match && match[1] !== '*') {
        return Number(match[1]);
      }
    }

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      return response.status === 200 ? Number(contentLength) : start + byteLength;
    }

    return null;
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
  }

  private cleanupStream(): void {
    this.fetchController?.abort();
    this.fetchController = undefined;

    if (this.mediaSource && this.sourceOpenHandler) {
      this.mediaSource.removeEventListener('sourceopen', this.sourceOpenHandler);
    }

    if (this.sourceBuffer?.updating) {
      try {
        this.sourceBuffer.abort();
      } catch {
      }
    }

    this.sourceBuffer = undefined;
    this.sourceOpenHandler = undefined;
    this.mediaSource = undefined;

    const video = this.v?.nativeElement;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.streamSessionId += 1;
    this.cleanupStream();
  }
}
