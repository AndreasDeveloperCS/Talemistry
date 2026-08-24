import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, startWith, Subscription } from 'rxjs';
import { RemotePeerStream, RTCAdvancedService } from '../../modules/interviews/services/RTC-advanced.service';
import { VideoCallDockService, VideoCallDockState } from '../../modules/interviews/services/video-call-dock.service';

@Component({
    selector: 'app-video-call-dock',
    templateUrl: './video-call-dock.component.html',
    styleUrl: './video-call-dock.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCallDockComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('previewVideo', { static: false })
    set previewVideoElement(ref: ElementRef<HTMLVideoElement> | undefined) {
        this.previewVideoRef = ref;
        this.scheduleViewSync();
    }

    @ViewChild('previewAudio', { static: false })
    set previewAudioElement(ref: ElementRef<HTMLAudioElement> | undefined) {
        this.previewAudioRef = ref;
        this.scheduleViewSync();
    }

    dockState: VideoCallDockState;
    isVisible = false;
    hasVideoPreview = false;
    previewLabel = 'Click to return to the call';
    dockOffsetX = 0;
    dockOffsetY = 0;
    isDragging = false;

    private readonly subscriptions = new Subscription();
    private currentUrl = '';
    private previewVideoRef?: ElementRef<HTMLVideoElement>;
    private previewAudioRef?: ElementRef<HTMLAudioElement>;
    private remoteStreams: RemotePeerStream[] = [];
    private localStream: MediaStream | null = null;
    private destroyed = false;
    private dragPointerId?: number;
    private dragStartClientX = 0;
    private dragStartClientY = 0;
    private dragOriginX = 0;
    private dragOriginY = 0;
    private dragDistance = 0;
    private suppressRestoreUntil = 0;
    private activeDragHandle?: HTMLElement;
    private viewSyncQueued = false;
    private readonly onWindowPointerMove = (event: PointerEvent) => this.handleWindowPointerMove(event);
    private readonly onWindowPointerUp = (event: PointerEvent) => this.handleWindowPointerUp(event);

    constructor(
        private readonly router: Router,
        private readonly cdr: ChangeDetectorRef,
        private readonly rtcAdvanced: RTCAdvancedService,
        private readonly videoCallDock: VideoCallDockService,
    ) {
        this.dockState = this.videoCallDock.snapshot;
    }

    ngOnInit(): void {
        this.subscriptions.add(
            this.videoCallDock.state$.subscribe((state) => {
                this.dockState = state;
                this.updateVisibility();
                this.refreshDockMedia();
                this.cdr.markForCheck();
            })
        );

        this.subscriptions.add(
            this.router.events.pipe(
                filter((event) => event instanceof NavigationEnd),
                startWith(null),
            ).subscribe(() => {
                this.currentUrl = this.router.url;
                this.updateVisibility();
                this.refreshDockMedia();
                this.cdr.markForCheck();
            })
        );

        this.subscriptions.add(
            this.rtcAdvanced.getRemoteStreams$().subscribe((streams) => {
                this.remoteStreams = streams ?? [];
                this.refreshDockMedia();
                this.cdr.markForCheck();
            })
        );

        this.subscriptions.add(
            this.rtcAdvanced.getLocalStream$().subscribe((stream) => {
                this.localStream = stream;
                this.refreshDockMedia();
                this.cdr.markForCheck();
            })
        );
    }

    ngAfterViewInit(): void {
        this.refreshDockMedia();
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        this.subscriptions.unsubscribe();
        this.removeWindowDragListeners();
        this.clampDockOffset();
        this.clearMediaBindings();
    }

    restoreCall(): void {
        const targetUrl = String(this.dockState.returnUrl || '').trim();
        if (!targetUrl) {
            return;
        }

        void this.router.navigateByUrl(targetUrl);
    }

    handleRestoreClick(event?: Event): void {
        event?.stopPropagation();
        if (this.isDragging || Date.now() < this.suppressRestoreUntil) {
            return;
        }

        this.restoreCall();
    }

    endCall(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        this.videoCallDock.requestEndCall();
    }

    onDragHandlePointerDown(event: PointerEvent): void {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
        this.dragPointerId = event.pointerId;
        this.dragStartClientX = event.clientX;
        this.dragStartClientY = event.clientY;
        this.dragOriginX = this.dockOffsetX;
        this.dragOriginY = this.dockOffsetY;
        this.dragDistance = 0;
        this.activeDragHandle = event.currentTarget as HTMLElement;

        try {
            this.activeDragHandle?.setPointerCapture?.(event.pointerId);
        } catch {
            // best-effort
        }

        window.addEventListener('pointermove', this.onWindowPointerMove);
        window.addEventListener('pointerup', this.onWindowPointerUp);
        window.addEventListener('pointercancel', this.onWindowPointerUp);
        this.cdr.markForCheck();
    }

    get dockTransform(): string {
        return `translate3d(${this.dockOffsetX}px, ${this.dockOffsetY}px, 0)`;
    }

    private updateVisibility(): void {
        const targetUrl = String(this.dockState.returnUrl || '').trim();
        const currentBase = this.normalizeUrl(this.currentUrl);
        const targetBase = this.normalizeUrl(targetUrl);
        this.isVisible = !!this.dockState.active && !!targetBase && currentBase !== targetBase;

        if (this.isVisible) {
            this.clampDockOffset();
        }
    }

    private refreshDockMedia(): void {
        if (!this.previewVideoRef?.nativeElement || !this.previewAudioRef?.nativeElement) {
            return;
        }

        if (!this.isVisible || !this.dockState.active) {
            this.hasVideoPreview = false;
            this.previewLabel = 'Click to return to the call';
            this.clearMediaBindings();
            return;
        }

        const preview = this.selectPreviewStream();
        const audio = this.selectAudioStream();

        this.hasVideoPreview = !!preview;
        this.previewLabel = this.resolvePreviewLabel(preview);

        const videoElement = this.previewVideoRef.nativeElement;
        videoElement.srcObject = preview?.stream ?? null;
        videoElement.muted = true;
        videoElement.volume = 0;

        const audioElement = this.previewAudioRef.nativeElement;
        audioElement.srcObject = audio?.stream ?? null;
        audioElement.muted = !this.dockState.speakersEnabled;
        audioElement.volume = this.dockState.speakersEnabled ? 1 : 0;

        if (preview?.stream) {
            void videoElement.play().catch(() => undefined);
        } else {
            try {
                videoElement.pause();
            } catch {
                // best-effort
            }
        }

        if (audio?.stream && this.dockState.speakersEnabled) {
            void audioElement.play().catch(() => undefined);
        } else {
            try {
                audioElement.pause();
            } catch {
                // best-effort
            }
        }
    }

    private clearMediaBindings(): void {
        const mediaElements = [this.previewVideoRef?.nativeElement, this.previewAudioRef?.nativeElement].filter(Boolean) as HTMLMediaElement[];

        for (const element of mediaElements) {
            try {
                element.pause();
            } catch {
                // best-effort
            }

            try {
                element.srcObject = null;
            } catch {
                // best-effort
            }
        }
    }

    private selectPreviewStream(): RemotePeerStream | { stream: MediaStream; displayName?: string; isLocal: boolean } | undefined {
        const remoteCamera = this.remoteStreams.find((stream) => this.hasLiveVideo(stream.stream) && !stream.isScreen);
        if (remoteCamera) {
            return { ...remoteCamera, isLocal: false };
        }

        if (this.localStream && this.hasLiveVideo(this.localStream)) {
            return {
                stream: this.localStream,
                displayName: 'You',
                isLocal: true,
            };
        }

        const remoteScreen = this.remoteStreams.find((stream) => this.hasLiveVideo(stream.stream));
        if (remoteScreen) {
            return { ...remoteScreen, isLocal: false };
        }

        return undefined;
    }

    private selectAudioStream(): RemotePeerStream | undefined {
        return this.remoteStreams.find((stream) => this.hasLiveAudio(stream.stream));
    }

    private resolvePreviewLabel(preview: RemotePeerStream | { stream: MediaStream; displayName?: string; isLocal: boolean } | undefined): string {
        if (!preview) {
            return 'Click to return to the call';
        }

        const displayName = String(preview.displayName || '').trim();
        if (displayName) {
            return displayName;
        }

        return 'isLocal' in preview && preview.isLocal ? 'You' : 'Live call preview';
    }

    private hasLiveVideo(stream: MediaStream | null | undefined): boolean {
        return !!stream?.getVideoTracks().some((track) => track.readyState === 'live');
    }

    private hasLiveAudio(stream: MediaStream | null | undefined): boolean {
        return !!stream?.getAudioTracks().some((track) => track.readyState === 'live');
    }

    private normalizeUrl(url: string): string {
        return String(url || '').split('?')[0].trim().toLowerCase();
    }

    private scheduleViewSync(): void {
        if (this.viewSyncQueued) {
            return;
        }

        this.viewSyncQueued = true;
        queueMicrotask(() => {
            this.viewSyncQueued = false;
            if (this.destroyed) {
                return;
            }

            this.refreshDockMedia();
            if (this.isVisible) {
                this.clampDockOffset();
            }
            this.cdr.markForCheck();
        });
    }

    private handleWindowPointerMove(event: PointerEvent): void {
        if (!this.isDragging || event.pointerId !== this.dragPointerId) {
            return;
        }

        const deltaX = event.clientX - this.dragStartClientX;
        const deltaY = event.clientY - this.dragStartClientY;
        this.dragDistance = Math.max(this.dragDistance, Math.hypot(deltaX, deltaY));
        this.dockOffsetX = this.dragOriginX + deltaX;
        this.dockOffsetY = this.dragOriginY + deltaY;
        this.cdr.markForCheck();
    }

    private handleWindowPointerUp(event: PointerEvent): void {
        if (event.pointerId !== this.dragPointerId) {
            return;
        }

        try {
            this.activeDragHandle?.releasePointerCapture?.(event.pointerId);
        } catch {
            // best-effort
        }

        this.isDragging = false;
        this.dragPointerId = undefined;
        this.activeDragHandle = undefined;
        this.removeWindowDragListeners();
        this.clampDockOffset();

        if (this.dragDistance > 6) {
            this.suppressRestoreUntil = Date.now() + 160;
        }

        this.cdr.markForCheck();
    }

    private clampDockOffset(): void {
        if (typeof window === 'undefined') {
            return;
        }

        const dockElement = this.previewVideoRef?.nativeElement?.closest('.video-call-dock') as HTMLElement | null;
        if (!dockElement) {
            return;
        }

        const rect = dockElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 12;

        let nextOffsetX = this.dockOffsetX;
        let nextOffsetY = this.dockOffsetY;

        if (rect.left < margin) {
            nextOffsetX += margin - rect.left;
        } else if (rect.right > viewportWidth - margin) {
            nextOffsetX -= rect.right - (viewportWidth - margin);
        }

        if (rect.top < margin) {
            nextOffsetY += margin - rect.top;
        } else if (rect.bottom > viewportHeight - margin) {
            nextOffsetY -= rect.bottom - (viewportHeight - margin);
        }

        this.dockOffsetX = nextOffsetX;
        this.dockOffsetY = nextOffsetY;
    }

    private removeWindowDragListeners(): void {
        window.removeEventListener('pointermove', this.onWindowPointerMove);
        window.removeEventListener('pointerup', this.onWindowPointerUp);
        window.removeEventListener('pointercancel', this.onWindowPointerUp);
    }
}