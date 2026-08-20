import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { RTCService } from '../../services/RTC.service';

@Component({
  selector: 'app-interview-call',
  standalone: false,
  templateUrl: './interview-call.component.html',
  styleUrl: './interview-call.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewCallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo', { static: true }) localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideoRef!: ElementRef<HTMLVideoElement>;
  private subs: Subscription[] = [];
  remoteStreams: MediaStream[] = [];
  roomId = 'interview-123';
  audioOn = true;
  videoOn = true;

  constructor(private rtc: RTCService) { }

  async ngOnInit() {
    await this.rtc.connect();
    const local = await this.rtc.initLocalMedia({ audio: true, video: true });
    this.localVideoRef.nativeElement.srcObject = local;

    this.subs.push(
      this.rtc.getRemoteStreams$().subscribe((streams) => {
        this.remoteStreams = streams;
      })
    );

    this.rtc.joinRoom(this.roomId);
  }
  
  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.rtc.leaveRoom();
  }

  toggleAudio() {
    this.audioOn = !this.audioOn;
    this.rtc.toggleAudio(this.audioOn);
  }

  toggleVideo() {
    this.videoOn = !this.videoOn;
    this.rtc.toggleVideo(this.videoOn);
  }

  async screenshare() { await this.rtc.startScreenShare(); }
}
