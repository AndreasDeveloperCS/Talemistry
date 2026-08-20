import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoInterviewService } from '../../services/video-interview.service';
import { v4 as uuidv4 } from 'uuid';
import { VideoRecordService } from '../../services/video-records.service';
import { take } from 'rxjs';
import { RecordingState } from '../../models/recording-states.enum';

@Component({
  selector: 'app-video-interview',
  standalone: false,
  templateUrl: './video-interview.component.html',
  styleUrl: './video-interview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoInterviewComponent implements OnInit, OnDestroy {
  @Input()
  questionText: string = 'Tell us about yourself';

  @Input()
  interviewId?: string = 'INTERVIEW_ID_123';

  @Input()
  maxDuration: number = 120;

  @Output() videoRecorded = new EventEmitter<{ videoKey: string; duration: number; }>();

  private mediaRecorder?: MediaRecorder;
  private stream?: MediaStream;
  private chunkIndex = 0;
  private recordingId = '';
  private timerId: any;
  private _errorOverlayEl?: HTMLElement | null = null;
  private roomId: string | null = null;

  isRecording: boolean = false;
  showCountdown: boolean = false;
  countdownValue: number = 3;
  RecordingState = RecordingState;
  recordingState: RecordingState = RecordingState.Idle;
  defaultInstruction!: string;
  remainingSeconds!: number;
  elapsedSeconds = 0;

  get MIN_DURATION(): number {
    return Math.ceil(this.remainingSeconds / 2);
  }

  get canStopRecording(): boolean {
    return this.elapsedSeconds >= this.MIN_DURATION;
  }

  constructor(private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private videoUploadService: VideoRecordService,
    private vi: VideoInterviewService) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.roomId = id || this.route.snapshot.queryParamMap.get('room') || 'default-room';

    const url = window.location.origin;
    this.vi.connect(url + '/video-interview');
    this.vi.join(this.roomId);
    this.defaultInstruction = `Record a video answer up to ${this.maxDuration} seconds. Click 'Start Recording' to see the question.`;
    this.remainingSeconds = this.maxDuration;
  }

  ngOnDestroy(): void {
    if (this.roomId) {
      this.vi.leave(this.roomId);
    }
    this.vi.disconnect();
    this.stopTimer();
    this.stream?.getTracks().forEach(t => t.stop());
  }

  async onStart() {
    if (this.recordingState === RecordingState.Recording) {
      return;
    }
    if (this.isRecording) {
      return;
    }

    this.recordingId = uuidv4();
    this.chunkIndex = 0;
    this.remainingSeconds = 120;

    try {
      // Request media with advanced audio constraints to prevent distortion and echo
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,        // Eliminate echo/aliasing
          noiseSuppression: true,        // Reduce background noise
          autoGainControl: true,         // Prevent volume distortion
          sampleRate: 48000,             // High-quality audio sampling
          channelCount: 1                // Mono for interviews (reduces bandwidth)
        }
      });

      const videoElement = document.querySelector('video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = this.stream;
        // CRITICAL: Mute local video element to prevent echo/feedback loop
        videoElement.muted = true;
        videoElement.volume = 0;
      }

      // Basic device checks
      const audioTracks = this.stream.getAudioTracks();
      const videoTracks = this.stream.getVideoTracks();

      if (!audioTracks || audioTracks.length === 0) {
        this.showErrorModal('No microphone found. Please attach a microphone and try again.');
        return;
      }

      if (!videoTracks || videoTracks.length === 0) {
        this.showErrorModal('No camera found. Please attach a camera and try again.');
        return;
      }

      // Apply additional audio processing constraints to active tracks
      audioTracks.forEach(track => {
        const capabilities = track.getCapabilities();
        const constraints: any = {};

        // Apply echo cancellation if supported
        if ('echoCancellation' in capabilities) {
          constraints.echoCancellation = true;
        }
        // Apply noise suppression if supported
        if ('noiseSuppression' in capabilities) {
          constraints.noiseSuppression = true;
        }
        // Apply auto gain control if supported
        if ('autoGainControl' in capabilities) {
          constraints.autoGainControl = true;
        }

        if (Object.keys(constraints).length > 0) {
          track.applyConstraints(constraints).catch(err => {
            console.warn('Could not apply audio constraints:', err);
          });
        }
      });

      await this.startMediaRecorder();
      this.startTimer();
      this.recordingState = RecordingState.Recording;
      this.isRecording = true;
    } catch (err) {
      console.error('Error accessing camera/mic', err);
      this.handleGetUserMediaError(err as any);
      this.resetRecording();
    }
  }

  private resetRecording() {
    this.recordingState = RecordingState.Idle;
    this.isRecording = false;
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = undefined;
  }

  onStop() {
    if (this.recordingState !== RecordingState.Recording ||
      !this.canStopRecording) {
      return;
    }

    this.recordingState = RecordingState.Finished;

    if (!this.isRecording) {
      return;
    }
    this.isRecording = false;
    this.stopTimer();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // stop tracks
    this.stream?.getTracks().forEach(t => t.stop());
  }

  private startTimer() {
    this.stopTimer();
    this.timerId = setInterval(() => {
      this.elapsedSeconds++;
      this.remainingSeconds = this.maxDuration - this.elapsedSeconds;
      if (this.remainingSeconds <= 0) {
        this.onStop();
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  private stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private submitRecording(videoKey: string) {
    this.videoRecorded.emit({
      videoKey,
      duration: this.elapsedSeconds
    });
  }

  private startMediaRecorder() {
    if (!this.stream) {
      return;
    }

    // Try a list of mime types and pick the first supported one.
    // Prefer Opus codec for superior audio quality and compression
    const candidates = [
      'video/webm;codecs=vp9,opus',      // VP9 + Opus (best quality)
      'video/webm;codecs=vp8,opus',      // VP8 + Opus (widely supported)
      'video/webm;codecs=h264,opus',     // H.264 + Opus
      'video/webm;codecs=vp8',
      'video/webm',
      ''
    ];

    let chosenOptions: any = undefined;
    for (const t of candidates) {
      try {
        if (!t) {
          // try without specifying mimeType
          chosenOptions = undefined;
          break;
        }
        if ((MediaRecorder as any).isTypeSupported && (MediaRecorder as any).isTypeSupported(t)) {
          // Use higher bitrate for better audio quality (reduces distortion)
          chosenOptions = {
            mimeType: t,
            audioBitsPerSecond: 128000,  // 128 kbps for clear voice
            videoBitsPerSecond: 2500000  // 2.5 Mbps for good video
          };
          console.log(`✅ Using MediaRecorder format: ${t}`);
          break;
        }
      } catch (e) {
        // isTypeSupported could throw in some browsers; ignore and continue
      }
    }

    try {
      this.mediaRecorder = chosenOptions ? new MediaRecorder(this.stream, chosenOptions) : new MediaRecorder(this.stream);
    } catch (err) {
      console.error('MediaRecorder creation failed', err);
      // Try creating without mimeType as a last resort
      try {
        this.mediaRecorder = new MediaRecorder(this.stream as MediaStream);
      } catch (err2) {
        console.error('MediaRecorder fallback failed', err2);
        this.showErrorModal('Unable to start recording. Your browser may not support the required codecs, or the microphone/camera is in use by another application. Try closing other apps or use a different browser.');
        // stop local tracks we acquired
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = undefined;
        return;
      }
    }

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (!event.data || event.data.size === 0) {
        return;
      }

      // When state is 'inactive', this is the last chunk after .stop()
      const isLast = this.mediaRecorder?.state === 'inactive';

      console.log('ondataavailable', event.data);

      this.videoUploadService
        .uploadChunk(
          this.recordingId,
          this.chunkIndex++,
          event.data,
          isLast,
          this.interviewId
        ).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('Video upload res', res);
            if (isLast) {
              const finalVideoKey = res.s3Url ?? this.recordingId;

              this.submitRecording(finalVideoKey);
              this.recordingState = RecordingState.Finished;
            }
            this.cdr.markForCheck();
          },
          error: (err: any) => {
            console.error('Chunk upload error', err);
            this.cdr.markForCheck();
          }
        });
    };

    this.mediaRecorder.onerror = (e) => {
      console.error('MediaRecorder error', e);
      this.showErrorModal('Recording error occurred. Your microphone or camera may be busy or unsupported.');
      this.onStop();
    };

    this.mediaRecorder.start(1000); // emit chunks every 1000 ms
  }

  private handleGetUserMediaError(err: any) {
    const name = err && err.name ? err.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      this.showErrorModal('Permission denied. Please allow camera and microphone access in your browser and try again.');
    } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      this.showErrorModal('No camera or microphone found that matches the requested constraints. Check your device connections.');
    } else if (name === 'NotReadableError' || name === 'TrackStartError') {
      this.showErrorModal('Camera or microphone is already in use by another application. Close other apps and try again.');
    } else {
      this.showErrorModal('Error accessing camera or microphone: ' + (err && err.message ? err.message : String(err)));
    }
  }

  private showErrorModal(message: string) {
    // Remove any existing overlay
    this.removeErrorModal();

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '2147483647';
    overlay.style.background = 'rgba(0,0,0,0.6)';

    const box = document.createElement('div');
    box.style.background = '#fff';
    box.style.padding = '20px';
    box.style.borderRadius = '8px';
    box.style.maxWidth = '560px';
    box.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
    box.style.color = '#111';
    box.style.fontFamily = 'Arial, Helvetica, sans-serif';
    box.style.textAlign = 'left';

    const p = document.createElement('div');
    p.style.marginBottom = '12px';
    p.textContent = message;

    const btn = document.createElement('button');
    btn.textContent = 'Close';
    btn.style.marginTop = '8px';
    btn.style.padding = '8px 12px';
    btn.style.border = 'none';
    btn.style.background = '#1976d2';
    btn.style.color = '#fff';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';

    btn.onclick = () => this.removeErrorModal();

    box.appendChild(p);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    this._errorOverlayEl = overlay;
  }

  private removeErrorModal() {
    if (this._errorOverlayEl && this._errorOverlayEl.parentElement) {
      this._errorOverlayEl.parentElement.removeChild(this._errorOverlayEl);
    }
    this._errorOverlayEl = null;
  }

  startCountdown() {
    if (this.recordingState !== RecordingState.Idle) {
      return;
    }

    this.recordingState = RecordingState.Countdown;

    this.showCountdown = true;
    this.countdownValue = 3;

    const interval = setInterval(() => {
      this.countdownValue--;

      if (this.countdownValue === 0) {
        clearInterval(interval);
        this.showCountdown = false;
        this.recordingState = RecordingState.Starting;
        this.onStart();
      }

      this.cdr.markForCheck();
    }, 1000);
  }
}
