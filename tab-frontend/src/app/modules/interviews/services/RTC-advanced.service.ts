import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { environment } from "../../../../environments/environment";
import { PeerState } from "../models/peer-state";
import io from 'socket.io-client';

type Socket = ReturnType<typeof io>;

type MediaProfile = 'high' | 'low';

interface PeerConnection {
    id: string;
    pc: RTCPeerConnection;
    streams: MediaStream[];
    // Persist sender references so we can reuse transceivers via replaceTrack()
    // (prevents duplicated outgoing tracks when camera/screen is toggled or re-attached).
    cameraVideoSender?: RTCRtpSender;
    screenVideoSender?: RTCRtpSender;
    // If a browser fires ontrack with empty event.streams, we group tracks here.
    defaultRemoteStream?: MediaStream;
    makingOffer?: boolean;
    ignoreOffer?: boolean;
    polite?: boolean;

    // Negotiation reliability: when tracks are added/removed while signalingState is not "stable",
    // we queue a renegotiation attempt and retry once stable.
    negotiationPending?: boolean;
    negotiationScheduled?: boolean;
    negotiationAttempts?: number;
    negotiationTimer?: any;

    // Per-peer outbound video policy (mesh): allow prioritizing one peer.
    videoProfile?: MediaProfile;

    // Per-peer outbound audio policy.
    audioProfile?: MediaProfile;

    // Per-peer outbound screen-share video policy.
    screenVideoProfile?: MediaProfile;

    // ICE candidates can arrive before remoteDescription is set.
    // Queue and flush once signaling is ready.
    pendingRemoteCandidates?: RTCIceCandidateInit[];

    iceRestartPending?: boolean;
    iceRestartTimer?: any;
}

interface IceServerConfig {
    urls: string | string[];
    username?: string;
    credential?: string;
}

interface RTCConfig {
    iceServers: IceServerConfig[];
    iceTransportPolicy?: 'all' | 'relay';
}

export interface RemotePeerStream {
    peerId: string;
    userId?: string;
    profileId?: string;
    clientId?: string;
    streamId: string;
    stream: MediaStream;
    isScreen: boolean;
    displayName?: string;
}

export interface RoomPresenceParticipant {
    participantKey: string;
    socketId?: string;
    userId?: string;
    profileId?: string;
    clientId?: string;
    email?: string;
    displayName?: string;
    role?: string;
    invited: boolean;
    inRoom: boolean;
    online: boolean;
    audioEnabled: boolean;
    videoEnabled: boolean;
    isSelf: boolean;
}

export interface RoomPresenceState {
    roomId: string;
    connectedCount: number;
    onlineCount: number;
    participants: RoomPresenceParticipant[];
}

@Injectable({ providedIn: 'root' })
export class RTCAdvancedService {
    private readonly audioInputDeviceStorageKey = 'rtc.audioInputDeviceId';
    private readonly videoInputDeviceStorageKey = 'rtc.videoInputDeviceId';

    private normalizeSocketBase(value: unknown): string {
        try {
            const raw = String(value ?? '').trim();
            if (!raw) return '';

            if (/^https?:\/\//i.test(raw)) {
                return new URL(raw).origin.replace(/\/+$/, '');
            }

            if (typeof window !== 'undefined' && window?.location?.origin) {
                return new URL(raw, window.location.origin).origin.replace(/\/+$/, '');
            }

            return raw.replace(/\/+$/, '');
        } catch {
            return String(value ?? '').trim().replace(/\/+$/, '');
        }
    }

    private getSocketBaseCandidates(): string[] {
        const candidates: string[] = [];
        const pushCandidate = (value: unknown) => {
            const normalized = this.normalizeSocketBase(value);
            if (normalized && !candidates.includes(normalized)) {
                candidates.push(normalized);
            }
        };

        const sameOriginBase = (() => {
            try {
                return (typeof window !== 'undefined' && window?.location?.origin)
                    ? String(window.location.origin).trim()
                    : '';
            } catch {
                return '';
            }
        })();

        pushCandidate(environment.wsBase);
        pushCandidate(sameOriginBase);
        pushCandidate((environment as any).baseUrl);
        pushCandidate((environment as any).sourceUrl);
        pushCandidate((environment as any).apiUrl);

        return candidates;
    }

    private buildHighQualityMicConstraints(): any {
        // Best-effort high quality mic capture.
        // Browsers ignore unsupported constraints; keep this permissive (ideal) to avoid failures.
        return {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },

            // Mono is typically best for AEC/NS and avoids odd stereo artifacts.
            channelCount: { ideal: 1 },

            // Hint towards the WebRTC-native processing sample rate.
            sampleRate: { ideal: 48000 },
            sampleSize: { ideal: 16 },

            // Reduce local loopback paths that can worsen echo in some implementations.
            // Not supported everywhere.
            suppressLocalAudioPlayback: { ideal: true },

            // Chrome/Edge feature; ignored where unsupported.
            voiceIsolation: { ideal: true },

            // Legacy / Chromium-specific constraints (harmless when ignored).
            googEchoCancellation: { ideal: true },
            googEchoCancellation2: { ideal: true },
            googDAEchoCancellation: { ideal: true },
            googAutoGainControl: { ideal: true },
            googAutoGainControl2: { ideal: true },
            googNoiseSuppression: { ideal: true },
            googNoiseSuppression2: { ideal: true },
            googHighpassFilter: { ideal: true },
            googTypingNoiseDetection: { ideal: true },
        };
    }

    private participantIdentityKey(
        userId?: string,
        profileId?: string,
        clientId?: string,
        displayName?: string,
    ): string {
        const pid = String(profileId ?? '').trim();
        if (pid) return `profile:${pid}`;
        const uid = String(userId ?? '').trim();
        if (uid) return `user:${uid}`;
        const cid = String(clientId ?? '').trim();
        if (cid) return `client:${cid}`;
        const name = String(displayName ?? '').trim();
        if (name) return `name:${name.toLowerCase()}`;
        return '';
    }

    getIceServerConfig(): IceServerConfig[] {
        // Single source of truth: backend .env via `get-ice-servers` socket event.
        // Keep frontend fallback empty to avoid drifting from server configuration.
        return [];
    }

    private socket?: Socket;
    private roomId?: string;
    private localSocketId?: string;
    private displayName?: string;
    private localUserId?: string;
    private localProfileId?: string;
    private localClientId?: string;
    private localUserEmail?: string;
    private roomJoinToken?: string;
    private reconnecting = false;

    private getOrCreateRtcClientId(): string {
        // MUST use sessionStorage (per-tab) so each browser tab/profile gets a unique clientId.
        // localStorage is shared across tabs at the same origin, which causes two different profiles
        // of the same user to obtain the same synthesized profileId and get falsely kicked by the gateway.
        const key = 'rtc.clientId';
        try {
            const existing = String(sessionStorage.getItem(key) ?? '').trim();
            if (existing) return existing;

            const generated = (globalThis as any)?.crypto?.randomUUID?.()
                ?? `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
            sessionStorage.setItem(key, String(generated));
            return String(generated);
        } catch {
            return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        }
    }

    private iceServersFetched = false;
    private iceServersFetchPromise?: Promise<void>;

    private usingGoogleStunFallback = false;

    isUsingGoogleStunFallback(): boolean {
        return !!this.usingGoogleStunFallback;
    }

    private async waitForSignalingState(pc: RTCPeerConnection, expected: RTCSignalingState, timeoutMs: number): Promise<boolean> {
        if (pc.signalingState === expected) return true;
        const start = Date.now();
        return await new Promise<boolean>((resolve) => {
            let done = false;
            const finish = (ok: boolean) => {
                if (done) return;
                done = true;
                pc.removeEventListener('signalingstatechange', onChange);
                clearInterval(timer);
                resolve(ok);
            };
            const onChange = () => {
                if (pc.signalingState === expected) finish(true);
            };
            pc.addEventListener('signalingstatechange', onChange);
            const timer = setInterval(() => {
                if (pc.signalingState === expected) return finish(true);
                if (Date.now() - start >= timeoutMs) return finish(false);
            }, 50);
        });
    }

    private normalizeIceUrls(servers: IceServerConfig[]): string[] {
        return servers
            .flatMap((s: any) => Array.isArray(s?.urls) ? s.urls : [s?.urls])
            .filter((u: any) => typeof u === 'string')
            .map((u: string) => u.trim())
            .filter(Boolean);
    }

    private async preflightPrimaryStunWorks(timeoutMs: number = 2000): Promise<boolean> {
        try {
            const urls = this.normalizeIceUrls(this.customIceServers);
            const stunUrls = urls.filter((u) => u.toLowerCase().startsWith('stun:'));
            if (!stunUrls.length) return true; // no STUN to test

            // Test only STUN to avoid TURN producing relay candidates that hide STUN failure.
            const testServers: RTCIceServer[] = stunUrls.map((u) => ({ urls: u } as any));
            const pc = new RTCPeerConnection({ iceServers: testServers } as any);

            let hasSrflx = false;

            pc.onicecandidate = (e) => {
                const c: any = e.candidate as any;
                if (!c) return;
                if (c.type === 'srflx') {
                    hasSrflx = true;
                }
            };

            pc.createDataChannel('stun-preflight');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                if (hasSrflx) {
                    try { pc.close(); } catch { }
                    return true;
                }
                // Exit early if gathering is done.
                if (pc.iceGatheringState === 'complete') break;
                await new Promise((r) => setTimeout(r, 50));
            }

            try { pc.close(); } catch { }
            return hasSrflx;
        } catch {
            // If preflight itself fails, treat as not working so we can enable fallback.
            return false;
        }
    }

    private localCameraStream?: MediaStream;
    private localScreenStream?: MediaStream;

    // ── Persistent audio/video state ────────────────────────────────────────
    // These survive hard page refreshes via sessionStorage.
    // The service restores them at construction time so that connect()/joinRoom()
    // inherit the correct mute/video-off flags from the start.
    private audioEnabled = RTCAdvancedService.restoreFlag('rtc.audioEnabled', true);
    private videoEnabled = RTCAdvancedService.restoreFlag('rtc.videoEnabled', true);
    private preferredAudioInputDeviceId = RTCAdvancedService.restoreText('rtc.audioInputDeviceId');
    private preferredVideoInputDeviceId = RTCAdvancedService.restoreText('rtc.videoInputDeviceId');

    private static restoreFlag(key: string, fallback: boolean): boolean {
        try {
            const raw = sessionStorage.getItem(key);
            if (raw === null) return fallback;
            return raw !== '0' && raw !== 'false';
        } catch {
            return fallback;
        }
    }

    private static restoreText(key: string): string | undefined {
        try {
            const raw = String(sessionStorage.getItem(key) ?? '').trim();
            return raw || undefined;
        } catch {
            return undefined;
        }
    }

    private persistAudioEnabled(): void {
        try { sessionStorage.setItem('rtc.audioEnabled', this.audioEnabled ? '1' : '0'); } catch { }
    }

    private persistVideoEnabled(): void {
        try { sessionStorage.setItem('rtc.videoEnabled', this.videoEnabled ? '1' : '0'); } catch { }
    }

    isAudioEnabled(): boolean {
        return this.audioEnabled;
    }

    isVideoEnabled(): boolean {
        return this.videoEnabled;
    }

    setPreferredMediaState(audioEnabled: boolean, videoEnabled: boolean): void {
        this.audioEnabled = !!audioEnabled;
        this.videoEnabled = !!videoEnabled;
        this.persistAudioEnabled();
        this.persistVideoEnabled();
    }

    getPreferredAudioInputDeviceId(): string | undefined {
        return this.preferredAudioInputDeviceId;
    }

    getPreferredVideoInputDeviceId(): string | undefined {
        return this.preferredVideoInputDeviceId;
    }

    setPreferredInputDevices(options: { audioInputDeviceId?: string; videoInputDeviceId?: string; }): void {
        const nextAudio = String(options.audioInputDeviceId ?? '').trim() || undefined;
        const nextVideo = String(options.videoInputDeviceId ?? '').trim() || undefined;

        this.preferredAudioInputDeviceId = nextAudio;
        this.preferredVideoInputDeviceId = nextVideo;

        try {
            if (nextAudio) sessionStorage.setItem(this.audioInputDeviceStorageKey, nextAudio);
            else sessionStorage.removeItem(this.audioInputDeviceStorageKey);

            if (nextVideo) sessionStorage.setItem(this.videoInputDeviceStorageKey, nextVideo);
            else sessionStorage.removeItem(this.videoInputDeviceStorageKey);
        } catch {
            // best-effort
        }
    }

    private buildRequestedLocalMediaConstraints(): MediaStreamConstraints | null {
        if (!this.audioEnabled && !this.videoEnabled) {
            return null;
        }

        const audioConstraint = this.audioEnabled
            ? {
                ...(this.buildHighQualityMicConstraints() as Record<string, unknown>),
                ...(this.preferredAudioInputDeviceId ? { deviceId: { exact: this.preferredAudioInputDeviceId } } : {}),
            }
            : false;

        const videoConstraint = this.videoEnabled
            ? (this.preferredVideoInputDeviceId
                ? { deviceId: { exact: this.preferredVideoInputDeviceId } }
                : true)
            : false;

        return {
            video: videoConstraint,
            audio: audioConstraint as any,
        };
    }

    private ensureLocalStreamContainer(): MediaStream {
        if (!this.localCameraStream) {
            this.localCameraStream = new MediaStream();
        }

        return this.localCameraStream;
    }

    /** Broadcast current audio/video state to server for relay to peers. */
    private broadcastMediaState(): void {
        if (!this.socket?.connected || !this.roomId) return;
        console.log('[RTC🔍 SERVICE] broadcastMediaState', { audioEnabled: this.audioEnabled, videoEnabled: this.videoEnabled, roomId: this.roomId });
        this.socket.emit('set-media-state', {
            roomId: this.roomId,
            audioEnabled: this.audioEnabled,
            videoEnabled: this.videoEnabled,
        });
    }

    // Observable for remote peer media states (audio/video enabled).
    private peerMediaStates = new Map<string, { audioEnabled: boolean; videoEnabled: boolean }>();
    private peerMediaStates$ = new BehaviorSubject<Map<string, { audioEnabled: boolean; videoEnabled: boolean }>>(new Map());
    private roomPresence$ = new BehaviorSubject<RoomPresenceState>({
        roomId: '',
        connectedCount: 0,
        onlineCount: 0,
        participants: [],
    });

    /** Returns an observable of per-peer media state changes (mute/video indicators). */
    getPeerMediaStates$() { return this.peerMediaStates$.asObservable(); }

    /** Snapshot of current peer media states. */
    getPeerMediaStatesSnapshot(): Map<string, { audioEnabled: boolean; videoEnabled: boolean }> {
        return new Map(this.peerMediaStates);
    }

    getRoomPresence$() {
        return this.roomPresence$.asObservable();
    }

    getRoomPresenceSnapshot(): RoomPresenceState {
        return this.roomPresence$.value;
    }

    private micProcessed = false;
    private micAudioContext?: AudioContext;
    private micOriginalTrack?: MediaStreamTrack;
    private micProcessedTrack?: MediaStreamTrack;
    private micGateInterval?: any;

    private peers = new Map<string, PeerConnection>();
    private remoteStreams = new Map<string, RemotePeerStream>();
    private remoteStreams$ = new BehaviorSubject<RemotePeerStream[]>([]);
    private localStream$ = new BehaviorSubject<MediaStream | null>(null);

    // Track participants from signaling events so UI can show counts immediately,
    // even before the first media track arrives.
    private participantIds = new Set<string>();
    private participantIds$ = new BehaviorSubject<string[]>([]);

    private peerUserIds = new Map<string, string>();
    private peerProfileIds = new Map<string, string>();
    private peerClientIds = new Map<string, string>();

    // Optional names for peers (provided by server via signaling events).
    private peerDisplayNames = new Map<string, string>();

    // Deterministic duplicate handling: keep the newest socket when two sockets
    // map to the same participant identity.
    private peerSeenAt = new Map<string, number>();

    // Stream ids that should be treated as screen shares
    private screenStreamIds = new Set<string>();

    private preferCodecsOnTransceiver(
        transceiver: RTCRtpTransceiver | undefined,
        kind: 'audio' | 'video',
        preferredMimeTypes: string[],
    ): void {
        if (!transceiver) return;
        const anyTransceiver = transceiver as any;
        if (typeof anyTransceiver.setCodecPreferences !== 'function') return;

        try {
            const caps = (RTCRtpSender as any).getCapabilities?.(kind);
            const codecs: any[] = caps?.codecs ?? [];
            if (!Array.isArray(codecs) || codecs.length === 0) return;

            const preferredSet = new Set(preferredMimeTypes.map((m) => String(m).toLowerCase()));
            const isPreferred = (c: any) => preferredSet.has(String((c as any)?.mimeType ?? '').toLowerCase());
            const preferred = codecs.filter(isPreferred);
            if (preferred.length === 0) return;

            const others = codecs.filter((c) => !isPreferred(c));

            // For video, keep associated RTX next to preferred codecs when possible.
            let ordered: any[] = [...preferred, ...others];
            if (kind === 'video') {
                const preferredPayloadTypes = new Set<number>();
                for (const c of preferred) {
                    const pt = (c as any)?.preferredPayloadType;
                    if (typeof pt === 'number') preferredPayloadTypes.add(pt);
                }
                const rtx = codecs.filter((c) => {
                    const mime = String((c as any)?.mimeType ?? '').toLowerCase();
                    if (mime !== 'video/rtx') return false;
                    const apt = (c as any)?.parameters?.apt;
                    return typeof apt === 'number' && preferredPayloadTypes.has(apt);
                });
                if (rtx.length) {
                    ordered = [...preferred, ...rtx, ...others.filter((c) => !rtx.includes(c))];
                }
            }

            anyTransceiver.setCodecPreferences(ordered);
        } catch {
            // best-effort
        }
    }

    private preferDefaultCodecs(audioTransceiver?: RTCRtpTransceiver, videoTransceiver?: RTCRtpTransceiver): void {
        // H.264 is a video codec (not audio). For audio, Opus is the standard WebRTC codec.
        this.preferCodecsOnTransceiver(audioTransceiver, 'audio', ['audio/opus']);
        this.preferCodecsOnTransceiver(videoTransceiver, 'video', ['video/h264']);
    }

    private detachPeerMedia(peer: PeerConnection): void {
        const { pc } = peer;

        for (const sender of pc.getSenders()) {
            try {
                if (sender.track?.kind === 'audio') {
                    this.setSenderAudioActive(sender, false);
                }
                if (sender.track?.kind === 'video') {
                    this.setSenderVideoActive(sender, false);
                }
            } catch {
                // best-effort
            }

            try {
                sender.replaceTrack(null).catch(() => undefined);
            } catch {
                // best-effort
            }

            try {
                pc.removeTrack(sender);
            } catch {
                // best-effort
            }
        }

        for (const transceiver of pc.getTransceivers()) {
            try {
                transceiver.stop?.();
            } catch {
                // best-effort
            }
        }

        peer.cameraVideoSender = undefined;
        peer.screenVideoSender = undefined;
    }

    private disposePeerConnection(remoteId: string): void {
        const peer = this.peers.get(remoteId);
        if (!peer) return;

        if (peer.iceRestartTimer) {
            clearTimeout(peer.iceRestartTimer);
            peer.iceRestartTimer = undefined;
        }

        if (peer.negotiationTimer) {
            clearTimeout(peer.negotiationTimer);
            peer.negotiationTimer = undefined;
        }

        peer.negotiationPending = false;
        peer.negotiationScheduled = false;
        peer.negotiationAttempts = 0;

        try {
            this.detachPeerMedia(peer);
            peer.pc.onicecandidate = null;
            peer.pc.oniceconnectionstatechange = null;
            peer.pc.onconnectionstatechange = null;
            peer.pc.ontrack = null;
            peer.pc.onnegotiationneeded = null;
            peer.pc.onsignalingstatechange = null;
            peer.pc.close();
        } catch {
            // best-effort
        }

        this.peers.delete(remoteId);

        for (const [key] of this.remoteStreams) {
            if (key.startsWith(`${remoteId}:`)) {
                this.remoteStreams.delete(key);
            }
        }
        this.emitRemoteStreams();
    }

    private preferH264ForSender(pc: RTCPeerConnection, sender: RTCRtpSender | undefined): void {
        if (!pc || !sender) return;
        try {
            const transceiver = pc.getTransceivers().find((t) => t?.sender === sender);
            this.preferCodecsOnTransceiver(transceiver, 'video', ['video/h264']);
        } catch {
            // best-effort
        }
    }

    // Default outbound video profile for new peer connections.
    private defaultVideoProfile: MediaProfile = 'low';

    // Default outbound audio/screen profiles for new peer connections.
    // Audio should default to high for call intelligibility.
    private defaultAudioProfile: MediaProfile = 'high';
    private defaultScreenVideoProfile: MediaProfile = 'low';

    // Avoid spamming profile requests over signaling.
    private lastRequestedMediaProfiles = new Map<string, string>();

    // Custom ICE servers configuration
    private customIceServers: IceServerConfig[] = this.getIceServerConfig();

    /**
     * Set custom ICE servers (STUN/TURN)
     * Call this before connecting to use your own servers
     */
    setIceServers(servers: IceServerConfig[]) {
        this.customIceServers = servers;
        console.log('🌐 Custom ICE servers configured:', servers.length);
    }

    /**
     * Get current ICE server configuration
     */
    getIceServers(): IceServerConfig[] {
        return this.customIceServers;
    }

    // ------------------- CONNECT ---------------------
    async connect(token?: string) {
        if (this.socket?.connected) {
            console.log('[RTC🔍 SERVICE] connect: already connected', { socketId: this.socket.id });
            await this.ensureIceServersFromServer();
            return;
        }

        const awaitConnectOrTimeout = async (socket: Socket, timeoutMs: number): Promise<void> => {
            await new Promise<void>((resolve, reject) => {
                let done = false;
                const finishOk = () => {
                    if (done) return;
                    done = true;
                    cleanup();
                    resolve();
                };
                const finishErr = (err?: any) => {
                    if (done) return;
                    done = true;
                    cleanup();
                    reject(err ?? new Error('Socket connect failed'));
                };
                const timer = setTimeout(() => {
                    finishErr(new Error(`Socket connect timeout after ${timeoutMs}ms`));
                }, timeoutMs);

                const cleanup = () => {
                    clearTimeout(timer);
                    socket.off('connect', finishOk);
                    socket.off('connect_error', finishErr);
                    socket.off('error', finishErr);
                };

                socket.once('connect', finishOk);
                socket.once('connect_error', finishErr);
                socket.once('error', finishErr);
            });
        };

        // If a socket exists but is still connecting, wait briefly; if it never connects
        // (common when a proxy blocks WS on one hostname), reset and retry.
        if (this.socket && !this.socket.connected) {
            try {
                await awaitConnectOrTimeout(this.socket, 7000);
                this.localSocketId = this.socket?.id;
                await this.ensureIceServersFromServer();
                return;
            } catch {
                try { this.socket.close(); } catch { }
                this.socket = undefined;
            }
        }

        const baseCandidates = this.getSocketBaseCandidates();

        const rawPath = environment.wsPath || 'socket.io';
        const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

        const connectUsingBase = async (base: string): Promise<Socket> => {
            const socket = io(`${base}/ws/rtc`, {
                // WebSocket preferred, but allow polling fallback for restrictive mobile networks/proxies.
                transports: ['websocket', 'polling'],
                path,
                auth: token ? { token } : undefined,
                forceNew: true,
            });

            try {
                await awaitConnectOrTimeout(socket, 12000);
                return socket;
            } catch (error) {
                try {
                    socket.removeAllListeners();
                    socket.close();
                } catch {
                    // best-effort
                }
                throw error;
            }
        };

        let nextSocket: Socket | undefined;
        let usedBase = baseCandidates[0] ?? '';
        const failedAttempts: Array<{ base: string; error: any }> = [];

        for (const base of baseCandidates) {
            usedBase = base;
            try {
                nextSocket = await connectUsingBase(base);
                break;
            } catch (error) {
                failedAttempts.push({ base, error });
                if (failedAttempts.length < baseCandidates.length) {
                    console.warn('⚠️ Signaling connect failed; retrying with alternate base.', {
                        base,
                        remainingBases: baseCandidates.filter(candidate => candidate !== base),
                        error,
                    });
                }
            }
        }

        if (!nextSocket) {
            console.error('❌ Signaling connect failed for all bases.', {
                attempts: failedAttempts.map((attempt) => ({
                    base: attempt.base,
                    error: attempt.error,
                })),
            });
            throw failedAttempts[failedAttempts.length - 1]?.error ?? new Error('Signaling connection failed');
        }

        this.socket = nextSocket;

        this.socket.on('connect', () => {
            this.localSocketId = this.socket?.id;
            console.log('✅ Connected to signaling server', { socketId: this.localSocketId, base: usedBase, path });

            // Recover room membership and peer graph after transient disconnects/network changes.
            if (this.roomId) {
                void this.recoverAfterReconnect();
            }
        });

        this.socket.on('disconnect', (reason: string) => {
            console.warn('⚠️ Signaling socket disconnected:', reason);
        });

        // Existing peers should wait for the new peer to initiate offers (prevents glare)
        this.socket.on('peer-joined', (data: any) => this.onPeerJoined(data));
        this.socket.on('peer-left', ({ socketId }: any) => this.onPeerLeft(socketId));
        this.socket.on('offer', (data: any) => this.onOffer(data));
        this.socket.on('answer', (data: any) => this.onAnswer(data));
        this.socket.on('ice-candidate', (data: any) => this.onIceCandidate(data));

        // Mesh optimization: peers can request that we adjust what we send to them.
        this.socket.on('media-profile', (data: any) => this.onMediaProfile(data));

        // ── Peer media state relay ──
        // When a remote peer toggles mute/video, server relays their state here.
        // UI can subscribe to peerMediaStates$ to show indicators.
        this.socket.on('peer-media-state', (data: any) => {
            const socketId = String(data?.socketId ?? '').trim();
            if (!socketId || socketId === (this.socket?.id ?? this.localSocketId)) return;
            const audioEnabled = typeof data?.audioEnabled === 'boolean' ? data.audioEnabled : true;
            const videoEnabled = typeof data?.videoEnabled === 'boolean' ? data.videoEnabled : true;
            console.log('[RTC🔍 SERVICE] peer-media-state received', { socketId, audioEnabled, videoEnabled });
            this.peerMediaStates.set(socketId, { audioEnabled, videoEnabled });
            this.peerMediaStates$.next(new Map(this.peerMediaStates));
        });

        this.socket.on('room-presence', (data: any) => {
            this.applyRoomPresence(data);
        });

        this.socket.on('peer-started-screen', (data: any) => {
            const streamId = data?.streamId;
            if (streamId) {
                this.screenStreamIds.add(streamId);
                this.setRemoteStreamScreenFlag(streamId, true);
                this.emitRemoteStreams();
            }
        });

        this.socket.on('peer-stopped-screen', (data: any) => {
            const streamId = data?.streamId;
            if (streamId) {
                this.screenStreamIds.delete(streamId);
                this.removeRemoteStreamById(streamId);
                this.emitRemoteStreams();
            }
        });

        // Socket is already connected here (connectUsingBase awaited it), but keep localSocketId in sync.
        this.localSocketId = this.socket?.id;

        // CRITICAL: Fetch ICE servers before any RTCPeerConnection is created.
        // Without this, first-join can create PCs with stale/default ICE config
        // and streams may only appear after reload.
        await this.ensureIceServersFromServer();
    }

    private async ensureIceServersFromServer(): Promise<void> {
        if (this.iceServersFetched) return;
        if (this.iceServersFetchPromise) return this.iceServersFetchPromise;

        this.iceServersFetchPromise = (async () => {
            if (!this.socket?.connected) return;
            try {
                const res = await this.requestIceServersFromServer(false);
                if (res?.ok && Array.isArray(res.iceServers) && res.iceServers.length) {
                    this.setIceServers(res.iceServers);
                    this.usingGoogleStunFallback = false;

                    // Product requirement: only use Google STUN if primary is not working.
                    const primaryOk = await this.preflightPrimaryStunWorks(2000);
                    if (!primaryOk) {
                        console.warn('[RTC🔍 SERVICE] Primary STUN preflight failed; requesting Google STUN fallback...');
                        const res2 = await this.requestIceServersFromServer(true);
                        if (res2?.ok && Array.isArray(res2.iceServers) && res2.iceServers.length) {
                            this.setIceServers(res2.iceServers);
                            this.usingGoogleStunFallback = true;
                        }
                    }

                    this.iceServersFetched = true;
                }
            } catch (e) {
                // Keep whatever was configured via setIceServers() (component defaults)
                console.warn('⚠️ Failed to fetch ICE servers from server, using existing config.', e);
            }
        })();

        await this.iceServersFetchPromise;
    }

    private requestIceServersFromServer(allowGoogleStunFallback: boolean): Promise<{ ok: boolean; iceServers: IceServerConfig[] }> {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Socket not connected'));
            this.socket.emit('get-ice-servers', { allowGoogleStunFallback }, (ack: any) => {
                if (!ack) return reject(new Error('No ICE server response'));
                resolve(ack);
            });
        });
    }

    // ------------------- LOCAL STREAMS ---------------------

    async initLocalCamera() {
        if (this.localCameraStream) {
            if (this.videoEnabled) {
                const hasLiveVideo = (this.localCameraStream.getVideoTracks() ?? []).some(t => t.readyState === 'live');
                if (!hasLiveVideo) {
                    await this.ensureCameraVideoCapture().catch(() => undefined);
                }
            } else {
                this.stopCameraVideoCapture();
            }

            if (this.audioEnabled) {
                const hasLiveAudio = (this.localCameraStream.getAudioTracks() ?? []).some(t => t.readyState === 'live');
                if (!hasLiveAudio) {
                    await this.ensureMicrophoneCapture().catch(() => undefined);
                }
            } else {
                this.stopMicrophoneCapture();
            }

            this.localStream$.next(this.localCameraStream);
            return this.localCameraStream;
        }

        const requestedConstraints = this.buildRequestedLocalMediaConstraints();
        if (!requestedConstraints) {
            const emptyStream = this.ensureLocalStreamContainer();
            this.localStream$.next(emptyStream);
            return emptyStream;
        }

        console.log('🎥 Starting local media...', {
            audioEnabled: this.audioEnabled,
            videoEnabled: this.videoEnabled,
        });

        try {
            this.localCameraStream = await navigator.mediaDevices.getUserMedia(requestedConstraints);
            this.localStream$.next(this.localCameraStream);

            if (this.audioEnabled && this.localCameraStream.getAudioTracks().length > 0) {
                await this.applyVoiceFilterToLocalMicIfPossible();
            }

            // If we already have peer connections (e.g. user toggled camera later),
            // attach tracks and renegotiate so others receive streams without reload.
            await Promise.allSettled(
                [...this.peers.values()].map((peer) => this.attachAllLocalTracks(peer.id)),
            );
            if (this.socket?.connected && this.roomId && this.peers.size > 0) {
                this.renegotiateAllPeers().catch(() => undefined);
            }

            const primaryVideoTrack = this.localCameraStream.getVideoTracks()[0];
            console.log('✅ Local media started:', primaryVideoTrack?.label ?? 'audio-only');
            return this.localCameraStream;
        } catch (err: any) {
            console.error('❌ Camera error:', err.name, err.message);

            const shouldFallbackToAudioOnly = this.audioEnabled && this.videoEnabled && (err.name === 'NotReadableError' || err.name === 'NotFoundError');

            // If camera is busy or unavailable, try audio-only mode when the user still wants audio.
            if (shouldFallbackToAudioOnly) {
                console.warn('⚠️ Camera busy, attempting audio-only mode...');
                try {
                    this.localCameraStream = await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: this.buildHighQualityMicConstraints() as any,
                    });
                    this.localStream$.next(this.localCameraStream);

                    await this.applyVoiceFilterToLocalMicIfPossible();

                    await Promise.allSettled(
                        [...this.peers.values()].map((peer) => this.attachAllLocalTracks(peer.id)),
                    );
                    if (this.socket?.connected && this.roomId && this.peers.size > 0) {
                        this.renegotiateAllPeers().catch(() => undefined);
                    }
                    console.log('✅ Audio-only mode activated');
                    alert(err.name === 'NotFoundError'
                        ? 'No camera detected. Continuing with audio only.'
                        : 'Camera is in use by another application. Continuing with audio only.');
                    return this.localCameraStream;
                } catch (audioErr: any) {
                    console.error('❌ Audio error:', audioErr.name, audioErr.message);
                    alert('Could not access microphone. Please check permissions.');
                    return null;
                }
            }

            // Handle other errors
            switch (err.name) {
                case 'NotAllowedError':
                    alert('Camera/microphone access denied. Please allow it in browser settings.');
                    break;
                case 'NotFoundError':
                    alert(this.audioEnabled ? 'No camera or microphone detected.' : 'No camera detected.');
                    break;
                case 'OverconstrainedError':
                    alert('Selected camera not available.');
                    break;
                default:
                    alert(`Media error: ${err.name}`);
            }
            return null;
        }

    }

    /**
     * Hot-swap input devices during an active call.
     * Stops old tracks, acquires a new stream with updated constraints,
     * replaces tracks on all peer connections, and renegotiates.
     */
    async switchInputDeviceLive(): Promise<MediaStream | null> {
        const constraints = this.buildRequestedLocalMediaConstraints();
        if (!constraints) return this.localCameraStream ?? null;

        // Stop existing tracks before acquiring new ones
        if (this.localCameraStream) {
            for (const track of this.localCameraStream.getTracks()) {
                track.stop();
                this.localCameraStream.removeTrack(track);
            }
        }

        try {
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            // Transfer new tracks into the existing MediaStream container
            // so references in <video> elements stay valid.
            const container = this.localCameraStream ?? new MediaStream();
            for (const track of newStream.getTracks()) {
                container.addTrack(track);
            }
            this.localCameraStream = container;
            this.localStream$.next(container);

            if (this.audioEnabled && container.getAudioTracks().length > 0) {
                await this.applyVoiceFilterToLocalMicIfPossible().catch(() => undefined);
            }

            // Replace tracks on all active peer connections
            await Promise.allSettled(
                [...this.peers.values()].map((peer) => this.attachAllLocalTracks(peer.id)),
            );
            if (this.socket?.connected && this.roomId && this.peers.size > 0) {
                this.renegotiateAllPeers().catch(() => undefined);
            }

            console.log('✅ Input device switched successfully');
            return container;
        } catch (err: any) {
            console.error('❌ Device switch failed:', err.name, err.message);
            return null;
        }
    }

    async initLocalScreen() {
        console.log('🖥️ Starting screen share...');
        // Keep audio disabled here by default to avoid echo/feedback loops.
        this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        return this.localScreenStream;
    }

    getRemoteStreams$() {
        return this.remoteStreams$.asObservable();
    }

    getParticipantIds$() {
        return this.participantIds$.asObservable();
    }

    getParticipantIdsSnapshot(): string[] {
        return [...this.participantIds.values()];
    }

    /** Look up the profileId associated with a given socket ID. */
    getPeerProfileId(socketId: string): string | undefined {
        return this.peerProfileIds.get(socketId);
    }

    /** Look up the userId associated with a given socket ID. */
    getPeerUserId(socketId: string): string | undefined {
        return this.peerUserIds.get(socketId);
    }

    /** Look up the clientId associated with a given socket ID. */
    getPeerClientId(socketId: string): string | undefined {
        return this.peerClientIds.get(socketId);
    }

    getRemoteStreamsSnapshot(): RemotePeerStream[] {
        return [...this.remoteStreams.values()];
    }

    private isLocalPresenceParticipant(participant: {
        socketId?: string;
        userId?: string;
        profileId?: string;
        clientId?: string;
        email?: string;
    }): boolean {
        const socketId = String(participant.socketId ?? '').trim();
        if (socketId && socketId === (this.socket?.id ?? this.localSocketId)) {
            return true;
        }

        const profileId = String(participant.profileId ?? '').trim();
        if (profileId && this.localProfileId && profileId === this.localProfileId) {
            return true;
        }

        const userId = String(participant.userId ?? '').trim();
        if (!profileId && userId && this.localUserId && userId === this.localUserId) {
            return true;
        }

        const email = String(participant.email ?? '').trim().toLowerCase();
        if (email && this.localUserEmail && email === this.localUserEmail) {
            return true;
        }

        const clientId = String(participant.clientId ?? '').trim();
        if (clientId && this.localClientId && clientId === this.localClientId) {
            return true;
        }

        return false;
    }

    private applyRoomPresence(payload: any): void {
        const roomId = String(payload?.roomId ?? this.roomId ?? '').trim().toLowerCase();
        const rawParticipants = Array.isArray(payload?.participants) ? payload.participants : [];
        const participants: RoomPresenceParticipant[] = rawParticipants.map((participant: any) => ({
            participantKey: String(participant?.participantKey ?? '').trim()
                || `participant:${String(participant?.socketId ?? participant?.email ?? Math.random()).trim()}`,
            socketId: String(participant?.socketId ?? '').trim() || undefined,
            userId: String(participant?.userId ?? '').trim() || undefined,
            profileId: String(participant?.profileId ?? '').trim() || undefined,
            clientId: String(participant?.clientId ?? '').trim() || undefined,
            email: String(participant?.email ?? '').trim().toLowerCase() || undefined,
            displayName: String(participant?.displayName ?? '').trim() || undefined,
            role: String(participant?.role ?? '').trim() || undefined,
            invited: !!participant?.invited,
            inRoom: !!participant?.inRoom,
            online: !!participant?.online,
            audioEnabled: !!participant?.audioEnabled,
            videoEnabled: !!participant?.videoEnabled,
            isSelf: this.isLocalPresenceParticipant(participant),
        }));

        const nextParticipantIds = new Set<string>();
        const nextPeerMediaStates = new Map<string, { audioEnabled: boolean; videoEnabled: boolean }>();

        for (const participant of participants) {
            if (participant.socketId && participant.displayName) {
                this.peerDisplayNames.set(participant.socketId, participant.displayName);
            }
            if (participant.socketId && participant.userId) {
                this.peerUserIds.set(participant.socketId, participant.userId);
            }
            if (participant.socketId && participant.profileId) {
                this.peerProfileIds.set(participant.socketId, participant.profileId);
            }
            if (participant.socketId && participant.clientId) {
                this.peerClientIds.set(participant.socketId, participant.clientId);
            }

            if (participant.socketId && participant.inRoom && !participant.isSelf) {
                nextParticipantIds.add(participant.socketId);
                nextPeerMediaStates.set(participant.socketId, {
                    audioEnabled: participant.audioEnabled,
                    videoEnabled: participant.videoEnabled,
                });
            }
        }

        this.participantIds = nextParticipantIds;
        this.emitParticipantIds();

        this.peerMediaStates = nextPeerMediaStates;
        this.peerMediaStates$.next(new Map(this.peerMediaStates));

        this.roomPresence$.next({
            roomId,
            connectedCount: Number(payload?.connectedCount ?? participants.filter((participant) => participant.inRoom).length),
            onlineCount: Number(payload?.onlineCount ?? participants.filter((participant) => participant.online).length),
            participants,
        });
    }

    getLocalStream$() {
        return this.localStream$.asObservable();
    }

    async toggleAudio(enabled: boolean): Promise<void> {
        this.audioEnabled = enabled;
        this.persistAudioEnabled();
        console.log(`🎯 toggleAudio called: audioEnabled = ${enabled}`);

        // Serialize mute/unmute operations so repeated rapid clicks remain deterministic.
        const run = async () => {
            // Re-read the desired state at execution time so the last click wins.
            const desired = this.audioEnabled;
            try {
                await this.applyOutgoingAudioState();
                // Broadcast updated state to server so peers see mute indicator immediately.
                this.broadcastMediaState();
                console.log(`✅ toggleAudio applied: audioEnabled = ${desired}`);
            } catch (e) {
                console.warn('⚠️ Failed to apply audio mute state', e);
            }
        };

        const chained = (this.audioToggleQueue ?? Promise.resolve()).then(run);
        // Keep the internal queue alive even if a prior attempt fails unexpectedly.
        this.audioToggleQueue = chained.catch(() => undefined);
        await chained;
    }

    private audioToggleQueue?: Promise<void>;

    private videoToggleQueue?: Promise<void>;

    private setSenderAudioActive(sender: RTCRtpSender, active: boolean): void {
        // Some browsers support stopping RTP without changing track/transceiver.
        // This is extra insurance on top of replaceTrack(null).
        try {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
                params.encodings = [{}];
            }
            params.encodings = params.encodings.map((enc) => ({ ...enc, active }));
            sender.setParameters(params).catch(() => undefined);
        } catch {
            // Ignore unsupported/failed cases.
        }
    }

    private setSenderVideoActive(sender: RTCRtpSender, active: boolean): void {
        // Mirrors setSenderAudioActive; some browsers support pausing encodings.
        try {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
                params.encodings = [{}];
            }
            params.encodings = params.encodings.map((enc) => ({ ...enc, active }));
            sender.setParameters(params).catch(() => undefined);
        } catch {
            // Ignore unsupported/failed cases.
        }
    }

    private debugAudioMuteState(tag: string): void {
        // Enable by setting sessionStorage['rtc.debugAudioMute']='1'
        try {
            if (sessionStorage.getItem('rtc.debugAudioMute') !== '1') return;
        } catch {
            return;
        }

        const lines: string[] = [];
        for (const [peerId, { pc }] of this.peers) {
            const senders = this.getAudioSenders(pc);
            const senderSummaries = senders.map((s) => {
                const track = s.track;
                return `${track ? track.id : 'null'}(${track ? track.readyState : 'no-track'})`;
            });
            lines.push(`${peerId}: audioSenders=${senders.length} tracks=[${senderSummaries.join(', ')}]`);
        }
        console.log(`🔇 [rtc.debugAudioMute] ${tag} audioEnabled=${this.audioEnabled}`, lines);
    }

    private getCurrentMicTrack(): MediaStreamTrack | undefined {
        // Prefer processed track if available.
        if (this.micProcessedTrack && this.micProcessedTrack.readyState === 'live') return this.micProcessedTrack;
        const t = this.localCameraStream?.getAudioTracks()?.[0];
        return t && t.readyState === 'live' ? t : undefined;
    }

    private getAudioSenders(pc: RTCPeerConnection): RTCRtpSender[] {
        const senders = new Set<RTCRtpSender>();

        // getSenders() misses the "kind" when track is null; transceivers retain the media kind.
        for (const sender of pc.getSenders()) {
            if (sender.track?.kind === 'audio') senders.add(sender);
        }

        for (const transceiver of pc.getTransceivers()) {
            const kind = transceiver.receiver?.track?.kind;
            if (kind === 'audio') {
                senders.add(transceiver.sender);
            }
        }

        return [...senders];
    }

    private getVideoSenders(pc: RTCPeerConnection): RTCRtpSender[] {
        const senders = new Set<RTCRtpSender>();

        for (const sender of pc.getSenders()) {
            if (sender.track?.kind === 'video') senders.add(sender);
        }

        for (const transceiver of pc.getTransceivers()) {
            const kind = transceiver.receiver?.track?.kind;
            if (kind === 'video') {
                senders.add(transceiver.sender);
            }
        }

        return [...senders];
    }

    private async applyOutgoingAudioState(): Promise<void> {
        this.debugAudioMuteState('before');

        // Keep local stream track enabled flag in sync (so future PCs inherit state).
        for (const t of this.localCameraStream?.getAudioTracks() ?? []) {
            t.enabled = this.audioEnabled;
        }

        // If user unmutes but we previously stopped mic capture, re-acquire a live audio track.
        // Also re-apply the mic processing chain (noise gate / filters) so behavior matches initial join.
        if (this.audioEnabled) {
            const hasLiveAudio = (this.localCameraStream?.getAudioTracks() ?? []).some(t => t.readyState === 'live');
            if (!hasLiveAudio) {
                await this.ensureMicrophoneCapture().catch(() => undefined);
            }
            await this.applyVoiceFilterToLocalMicIfPossible(false).catch(() => undefined);
        }

        const micTrack = this.audioEnabled ? this.getCurrentMicTrack() : undefined;
        let needsRenegotiation = false;

        for (const { pc } of this.peers.values()) {
            const audioSenders = this.getAudioSenders(pc);

            if (!this.audioEnabled) {
                // Hard mute: remove audio track from the sender so nothing is transmitted.
                console.log('🔇 MUTING: Replacing audio track with null on', audioSenders.length, 'senders');
                for (const sender of audioSenders) {
                    this.setSenderAudioActive(sender, false);
                }
                const results = await Promise.allSettled(audioSenders.map(s => s.replaceTrack(null)));
                console.log('✅ Audio tracks replaced with null:', results.filter(r => r.status === 'fulfilled').length, 'successful');
                continue;
            }

            if (micTrack) {
                if (audioSenders.length > 0) {
                    // IMPORTANT: keep exactly one active outgoing audio sender.
                    // Multiple audio senders results in duplicated voice/echo/delay.
                    const [primary, ...extras] = audioSenders;

                    this.setSenderAudioActive(primary, true);
                    await primary.replaceTrack(micTrack);

                    for (const extra of extras) {
                        this.setSenderAudioActive(extra, false);
                    }
                    await Promise.allSettled(extras.map(s => s.replaceTrack(null)));
                } else if (this.localCameraStream) {
                    // If we previously joined while muted, there may be no sender at all.
                    try {
                        pc.addTrack(micTrack, this.localCameraStream);
                        needsRenegotiation = true;
                    } catch (e) {
                        console.warn('⚠️ Failed to add mic track to peer connection', e);
                    }
                }
            }
        }

        if (needsRenegotiation && this.socket?.connected && this.roomId) {
            this.renegotiateAllPeers().catch(() => undefined);
        }

        // Stop microphone capture AFTER senders are nulled out.
        // This turns off browser mic indicator and ensures no audio is captured.
        if (!this.audioEnabled) {
            this.stopMicrophoneCapture();
        }

        this.debugAudioMuteState('after');
    }

    private stopMicrophoneCapture(): void {
        try {
            if (this.micGateInterval) {
                clearInterval(this.micGateInterval);
                this.micGateInterval = undefined;
            }
            if (this.micAudioContext) {
                this.micAudioContext.close().catch(() => undefined);
                this.micAudioContext = undefined;
            }

            // Stop any remembered tracks (best-effort).
            try { this.micOriginalTrack?.stop(); } catch { }
            try { this.micProcessedTrack?.stop(); } catch { }

            this.micProcessed = false;
            this.micOriginalTrack = undefined;
            this.micProcessedTrack = undefined;

            if (!this.localCameraStream) return;
            const audioTracks = this.localCameraStream.getAudioTracks();
            if (audioTracks.length === 0) return;

            console.log('🎤 Stopping', audioTracks.length, 'audio tracks to turn off mic indicator');
            for (const t of audioTracks) {
                try { t.stop(); } catch { }
                try { this.localCameraStream.removeTrack(t); } catch { }
            }
            this.localStream$.next(this.localCameraStream);
        } catch {
            // best-effort
        }
    }

    private async ensureMicrophoneCapture(): Promise<MediaStreamTrack | undefined> {
        // If we still have a live mic track, keep it.
        const existing = this.getCurrentMicTrack();
        if (existing) return existing;

        // Clear stale mic processing state so applyVoiceFilter re-runs on the new track.
        this.micProcessed = false;
        this.micOriginalTrack = undefined;
        this.micProcessedTrack = undefined;
        if (this.micGateInterval) {
            clearInterval(this.micGateInterval);
            this.micGateInterval = undefined;
        }
        if (this.micAudioContext) {
            this.micAudioContext.close().catch(() => undefined);
            this.micAudioContext = undefined;
        }

        // Acquire ONLY audio so we don't disrupt camera/screen states.
        const micOnly = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
                ...(this.buildHighQualityMicConstraints() as Record<string, unknown>),
                ...(this.preferredAudioInputDeviceId ? { deviceId: { exact: this.preferredAudioInputDeviceId } } : {}),
            } as any,
        });

        const [audioTrack] = micOnly.getAudioTracks();
        if (!audioTrack) return undefined;
        audioTrack.enabled = this.audioEnabled;

        if (!this.localCameraStream) {
            this.localCameraStream = new MediaStream();
        }

        // Attach into our canonical local stream so future PCs inherit it.
        try { this.localCameraStream.addTrack(audioTrack); } catch { }
        this.localStream$.next(this.localCameraStream);

        // Re-apply the full voice processing chain (HPF/LPF/compressor/noise-gate).
        // Without this, each unmute after mute-with-track-stop uses a raw, unprocessed mic.
        // Pass reapplyOutgoingState=false to avoid recursive re-entry (caller handles state).
        await this.applyVoiceFilterToLocalMicIfPossible(false).catch(() => undefined);

        // After processing, getCurrentMicTrack() may return the processed track.
        return this.getCurrentMicTrack() ?? audioTrack;
    }

    private stopCameraVideoCapture(): void {
        if (!this.localCameraStream) {
            console.log('⚠️ No localCameraStream to stop');
            return;
        }

        const videoTracks = this.localCameraStream.getVideoTracks();
        console.log('📹 Stopping', videoTracks.length, 'video tracks to turn off camera indicator');

        for (const t of videoTracks) {
            console.log('  - Stopping video track:', t.id, 'state:', t.readyState, 'enabled:', t.enabled);
            try {
                t.stop();
                console.log('    ✅ Track stopped');
            } catch (e) {
                console.error('    ❌ Failed to stop track:', e);
            }
            try {
                this.localCameraStream.removeTrack(t);
                console.log('    ✅ Track removed from stream');
            } catch (e) {
                console.error('    ❌ Failed to remove track:', e);
            }
        }

        this.localStream$.next(this.localCameraStream);
        console.log('✅ Camera capture stopped - indicator should be OFF');
    }

    private async ensureCameraVideoCapture(): Promise<MediaStreamTrack | undefined> {
        if (!this.localCameraStream) return undefined;

        const existingLive = this.localCameraStream.getVideoTracks().find(t => t.readyState === 'live');
        if (existingLive) return existingLive;

        // Acquire ONLY video so we don't disrupt mic/audio processing.
        const camVideoOnly = await navigator.mediaDevices.getUserMedia({
            video: this.preferredVideoInputDeviceId
                ? { deviceId: { exact: this.preferredVideoInputDeviceId } }
                : true,
            audio: false
        });
        const [videoTrack] = camVideoOnly.getVideoTracks();
        if (!videoTrack) return undefined;

        this.localCameraStream.addTrack(videoTrack);
        this.localStream$.next(this.localCameraStream);
        return videoTrack;
    }

    async toggleVideo(enabled: boolean): Promise<void> {
        this.videoEnabled = enabled;
        this.persistVideoEnabled();
        console.log(`🎯 toggleVideo called: videoEnabled = ${enabled}`);

        // Serialize video toggles so repeated rapid clicks don't accumulate senders/transceivers.
        const run = async () => {
            // Re-read desired state at execution time so the last click wins.
            const desired = this.videoEnabled;

            // Do not touch screen share tracks here; only camera video.
            const screenVideoTracks = new Set(this.localScreenStream?.getVideoTracks() ?? []);

            if (!desired) {
                console.log('🚫 DISABLING VIDEO: Replacing camera video tracks with null');

                for (const peer of this.peers.values()) {
                    const pc = peer.pc;
                    const videoSenders = this.getVideoSenders(pc);
                    const cameraVideoSenders = videoSenders.filter((s) => {
                        const t = s.track;
                        return !(t && t.kind === 'video' && screenVideoTracks.has(t));
                    });

                    for (const sender of cameraVideoSenders) {
                        this.setSenderVideoActive(sender, false);
                    }
                    await Promise.allSettled(cameraVideoSenders.map((s) => s.replaceTrack(null)));
                }

                console.log('🎥 Stopping camera capture to turn OFF indicator light...');
                this.stopCameraVideoCapture();
                // Broadcast updated state to server so peers see video-off indicator immediately.
                this.broadcastMediaState();
                console.log('✅ toggleVideo applied: videoEnabled = false');
                return;
            }

            // Enabling: ensure we have a live camera video track.
            const videoTrack = await this.ensureCameraVideoCapture().catch(() => undefined);
            if (!videoTrack || !this.localCameraStream) {
                throw new Error('Could not acquire camera video track');
            }

            let needsRenegotiation = false;

            for (const peer of this.peers.values()) {
                const pc = peer.pc;
                const videoSenders = this.getVideoSenders(pc);

                // Prefer a dedicated cached sender if we have one.
                const cached = peer.cameraVideoSender;
                const cachedIsScreen = !!cached?.track && screenVideoTracks.has(cached.track);

                const nonScreenVideoSenders = videoSenders.filter((s) => {
                    const t = s.track;
                    // If sender has an active screen track, don't use it for camera.
                    if (t && t.kind === 'video' && screenVideoTracks.has(t)) return false;
                    return true;
                });

                const primary = (!cachedIsScreen && cached) ? cached : nonScreenVideoSenders[0];
                const extras = nonScreenVideoSenders.filter((s) => s !== primary);

                if (primary) {
                    peer.cameraVideoSender = primary;
                    this.setSenderVideoActive(primary, true);
                    await primary.replaceTrack(videoTrack);

                    for (const extra of extras) {
                        this.setSenderVideoActive(extra, false);
                    }
                    await Promise.allSettled(extras.map((s) => s.replaceTrack(null)));
                    continue;
                }

                // Fallback: if no usable sender exists, addTrack and renegotiate.
                try {
                    peer.cameraVideoSender = pc.addTrack(videoTrack, this.localCameraStream);
                    needsRenegotiation = true;
                } catch (e) {
                    console.warn('⚠️ Failed to add video track to peer connection', e);
                }
            }

            if (needsRenegotiation && this.socket?.connected && this.roomId) {
                this.renegotiateAllPeers().catch(() => undefined);
            }

            // Broadcast updated state to server so peers see video indicator.
            this.broadcastMediaState();
            console.log('✅ toggleVideo applied: videoEnabled = true');
        };

        const chained = (this.videoToggleQueue ?? Promise.resolve()).then(run);
        // Keep the internal queue alive even if this attempt fails.
        this.videoToggleQueue = chained.catch(() => undefined);
        await chained;
    }

    // ------------------- ROOM MANAGEMENT ---------------------
    joinRoom(roomId: string, displayName?: string, userId?: string, profileId?: string, userEmail?: string, joinToken?: string) {
        if (!this.socket) throw new Error('Socket not connected');
        const canonicalRoomId = String(roomId ?? '').trim().toLowerCase();
        this.roomId = canonicalRoomId;
        this.displayName = String(displayName ?? '').trim() || undefined;

        const safeUserId = String(userId ?? '').trim() || undefined;
        this.localUserId = safeUserId;

        const safeProfileId = String(profileId ?? '').trim() || undefined;
        this.localProfileId = safeProfileId;

        const safeUserEmail = String(userEmail ?? '').trim().toLowerCase() || undefined;
        this.localUserEmail = safeUserEmail;

        const safeJoinToken = String(joinToken ?? '').trim() || undefined;
        this.roomJoinToken = safeJoinToken;

        const clientId = this.getOrCreateRtcClientId();
        this.localClientId = clientId;

        const safeName = this.displayName ?? '';

        console.log('[RTC🔍 SERVICE] joinRoom EMIT', {
            roomId: canonicalRoomId,
            displayName: safeName,
            userId: safeUserId || '(none)',
            profileId: safeProfileId || '(none)',
            userEmail: safeUserEmail || '(none)',
            hasJoinToken: !!safeJoinToken,
            clientId,
            socketId: this.socket?.id,
        });

        const dedupePeersByIdentity = (socketIds: string[], peerUserIds: any, peerProfileIds: any, peerClientIds: any, peerDisplayNames: any): string[] => {
            // IMPORTANT: one camera tile per participant identity.
            // Stale sockets can linger on the server and appear in the join-room ACK.
            // Deduping here prevents creating duplicate peer connections/streams.
            const seen = new Map<string, string>();
            const out: string[] = [];

            const identityKeyOf = (id: string): string => {
                const pid = String(peerProfileIds?.[id] ?? '').trim();
                const uid = String(peerUserIds?.[id] ?? '').trim();
                const cid = String(peerClientIds?.[id] ?? '').trim();
                const name = String(peerDisplayNames?.[id] ?? '').trim();
                return this.participantIdentityKey(uid, pid, cid, name) || `socket:${id}`;
            };

            for (const id of socketIds) {
                const key = identityKeyOf(id);
                const kept = seen.get(key);
                if (kept) {
                    console.warn('[RTC🔍 SERVICE] joinRoom ACK: dropping duplicate peer by identity', {
                        droppedSocketId: id,
                        keptSocketId: kept,
                        identityKey: key,
                    });
                    continue;
                }
                seen.set(key, id);
                out.push(id);
            }
            return out;
        };

        this.socket.emit('join-room', {
            roomId: canonicalRoomId,
            displayName: safeName || undefined,
            userId: safeUserId,
            profileId: safeProfileId,
            userEmail: safeUserEmail,
            joinToken: safeJoinToken,
            clientId,
        }, async (ack: any) => {
            const ackRoomId = String(ack?.roomId ?? canonicalRoomId).trim().toLowerCase();
            this.roomId = ackRoomId;

            const mySocketId = this.socket?.id;
            const rawPeers: string[] = ack?.peers ?? [];
            // First pass: basic dedup + remove self socket ID.
            let peers = [...new Set(rawPeers)].filter((id) => !!id && id !== mySocketId);
            const peerDisplayNames = ack?.peerDisplayNames ?? {};
            const peerUserIds = ack?.peerUserIds ?? {};
            const peerProfileIds = ack?.peerProfileIds ?? {};
            const peerClientIds = ack?.peerClientIds ?? {};

            console.log('[RTC🔍 SERVICE] joinRoom ACK received', {
                ok: ack?.ok,
                roomId: ackRoomId,
                rawPeerCount: rawPeers.length,
                peersAfterBasicDedup: peers.length,
                mySocketId,
                peerUserIds,
                peerProfileIds,
            });

            // Second pass: remove any peer whose userId/profileId matches ours.
            // This catches stale sockets from the same account after a page refresh.
            peers = peers.filter((id) => {
                const peerUserId = String(peerUserIds?.[id] ?? '').trim();
                const peerProfileId = String(peerProfileIds?.[id] ?? '').trim();
                const peerClientId = String(peerClientIds?.[id] ?? '').trim();
                if (this.localClientId && peerClientId && peerClientId === this.localClientId) {
                    console.warn('[RTC🔍 SERVICE] 🚫 Filtering self-socket from peers (same clientId):', {
                        socketId: id,
                        peerClientId,
                        localClientId: this.localClientId,
                    });
                    return false;
                }
                if (this.isSameParticipantIdentity(this.localUserId, this.localProfileId, peerUserId, peerProfileId)) {
                    console.warn('[RTC🔍 SERVICE] 🚫 Filtering self-socket from peers (same participant identity):', {
                        socketId: id,
                        peerUserId: peerUserId || '(none)',
                        peerProfileId: peerProfileId || '(none)',
                        localUserId: this.localUserId || '(none)',
                        localProfileId: this.localProfileId || '(none)',
                    });
                    return false;
                }
                return true;
            });

            const beforeIdentityDedup = peers.length;
            peers = dedupePeersByIdentity(peers, peerUserIds, peerProfileIds, peerClientIds, peerDisplayNames);

            console.log('[RTC🔍 SERVICE] joinRoom peers after self-filter + identity-dedup:', {
                peerCount: peers.length,
                droppedByIdentity: beforeIdentityDedup - peers.length,
            }, 'creating peer connections...');

            for (const id of peers) {
                const peerName = String(peerDisplayNames?.[id] ?? '').trim();
                if (peerName) this.peerDisplayNames.set(id, peerName);

                const peerUserId = String(peerUserIds?.[id] ?? '').trim();
                if (peerUserId) this.peerUserIds.set(id, peerUserId);

                const peerProfileId = String(peerProfileIds?.[id] ?? '').trim();
                if (peerProfileId) this.peerProfileIds.set(id, peerProfileId);

                const peerClientId = String(peerClientIds?.[id] ?? '').trim();
                if (peerClientId) this.peerClientIds.set(id, peerClientId);
            }

            // ── Restore peer media states from server ──
            // Server tracks each peer's last-reported audio/video state.
            // Apply it now so the UI shows correct mute/video-off indicators immediately.
            const serverMediaStates = ack?.peerMediaStates ?? {};
            for (const id of peers) {
                const state = serverMediaStates[id];
                if (state && typeof state === 'object') {
                    this.peerMediaStates.set(id, {
                        audioEnabled: typeof state.audioEnabled === 'boolean' ? state.audioEnabled : true,
                        videoEnabled: typeof state.videoEnabled === 'boolean' ? state.videoEnabled : true,
                    });
                }
            }
            this.peerMediaStates$.next(new Map(this.peerMediaStates));

            // Emit participant list immediately (before tracks), so UI can update counts right away.
            this.participantIds.clear();
            for (const id of peers) this.participantIds.add(id);
            this.emitParticipantIds();

            for (const id of peers) {
                await this.createPeerConnection(id, true);
            }

            // Enforce current mic/video state on freshly-created peer links.
            await this.applyOutgoingAudioState();

            // Broadcast our own audio/video state to the room immediately after joining
            // so peers (and the server) know our current state — critical after page refresh.
            this.broadcastMediaState();

            this.applyRoomPresence(ack?.roomPresence);
        });
    }

    leaveRoom() {
        // Always cleanup local media + peer connections, even if room/socket state is already lost.
        // Otherwise the camera/mic can stay active and users must close the tab.
        if (this.socket && this.roomId) {
            this.socket.emit('leave-room', { roomId: this.roomId });
        }
        this.roomId = undefined;
        this.cleanup();
    }

    // ------------------- SCREEN + CAMERA ---------------------

    async startScreenShareSimultaneously(): Promise<MediaStream> {
        if (this.localScreenStream?.active) {
            const existingTrack = this.localScreenStream.getVideoTracks()?.find((t) => t.readyState === 'live');
            if (existingTrack) {
                return this.localScreenStream;
            }
        }

        const screenStream = await this.initLocalScreen();
        const screenTrack = screenStream.getVideoTracks()[0];

        // Help UIs distinguish screen tracks
        try { screenTrack.contentHint = 'detail'; } catch { }

        // Mark our local screen stream id as a screen share
        this.screenStreamIds.add(screenStream.id);

        // ✅ Add screen track as a *new* stream with MEDIUM upload priority
        // (between audio=high and camera=low)
        for (const { pc, screenVideoSender: existingSender } of this.peers.values()) {
            if (existingSender) {
                // Reuse sender from a previous share (avoids extra m-line)
                existingSender
                    .replaceTrack(screenTrack)
                    .catch(() => {
                        try {
                            const sender = pc.addTrack(screenTrack, screenStream);
                            const peerEntry = [...this.peers.values()].find(p => p.pc === pc);
                            if (peerEntry) peerEntry.screenVideoSender = sender;
                            this.preferH264ForSender(pc, sender);
                        } catch { }
                    });
                this.preferH264ForSender(pc, existingSender);
            } else {
                try {
                    const sender = pc.addTrack(screenTrack, screenStream);
                    this.preferH264ForSender(pc, sender);
                    // Set medium priority for screen share upload
                    try {
                        const params = sender.getParameters();
                        if (params.encodings?.length) {
                            params.encodings[0].priority = 'medium' as any;
                            params.encodings[0].networkPriority = 'medium' as any;
                            sender.setParameters(params).catch(() => undefined);
                        }
                    } catch { }
                    // Keep reference for future replaceTrack
                    const peerEntry = [...this.peers.values()].find(p => p.pc === pc);
                    if (peerEntry) peerEntry.screenVideoSender = sender;
                } catch { }
            }
        }

        console.log('📺 Screen sharing started along with camera.');

        this.socket?.emit('start-screen-share', { roomId: this.roomId, streamId: screenStream.id });

        // Renegotiate with each peer so they receive the new track.
        // Important: if signalingState isn't stable yet, queue and retry.
        for (const remoteId of this.peers.keys()) {
            this.scheduleNegotiation(remoteId, 'screen-share-added');
        }

        // Detect when user stops screen sharing
        screenTrack.onended = () => {
            console.log('🛑 Screen sharing stopped.');
            this.socket?.emit('stop-screen-share', { roomId: this.roomId, streamId: screenStream.id });

            // remove from peers
            for (const { pc } of this.peers.values()) {
                const sender = pc.getSenders().find(s => s.track === screenTrack);
                if (sender) {
                    try { pc.removeTrack(sender); } catch { }
                }

                const peerEntry = [...this.peers.values()].find(p => p.pc === pc);
                if (peerEntry && peerEntry.screenVideoSender === sender) {
                    peerEntry.screenVideoSender = undefined;
                }
            }

            this.localScreenStream = undefined;
            this.screenStreamIds.delete(screenStream.id);

            // Renegotiate removal
            for (const remoteId of this.peers.keys()) {
                this.scheduleNegotiation(remoteId, 'screen-share-removed');
            }
        };
        return screenStream;
    }

    private async renegotiateAllPeers() {
        const tasks: Promise<void>[] = [];
        for (const remoteId of this.peers.keys()) {
            tasks.push(this.renegotiate(remoteId));
        }
        await Promise.allSettled(tasks);
    }

    private async renegotiate(remoteId: string) {
        if (!this.socket || !this.roomId) return;
        const peer = this.peers.get(remoteId);
        if (!peer) return;

        // Queue negotiation if not currently stable.
        this.scheduleNegotiation(remoteId, 'renegotiate-request');
    }

    private async sendOffer(remoteId: string) {
        if (!this.socket || !this.roomId) return;
        const peer = this.peers.get(remoteId);
        if (!peer) return;

        const pc = peer.pc;
        if (pc.signalingState !== 'stable') {
            // We'll retry via scheduleNegotiation() once stable.
            this.scheduleNegotiation(remoteId, 'sendOffer-not-stable');
            return;
        }

        try {
            peer.makingOffer = true;
            const offer = await pc.createOffer({ iceRestart: !!peer.iceRestartPending });
            // Guard: signaling state can change while awaiting.
            if (pc.signalingState !== 'stable') return;
            await pc.setLocalDescription(offer);
            peer.iceRestartPending = false;
            this.socket.emit('offer', { roomId: this.roomId, to: remoteId, sdp: pc.localDescription });
        } finally {
            peer.makingOffer = false;
        }
    }

    private scheduleNegotiation(remoteId: string, _reason: string): void {
        const peer = this.peers.get(remoteId);
        if (!peer) return;
        if (!this.socket?.connected || !this.roomId) return;

        peer.negotiationPending = true;
        if (peer.negotiationScheduled) return;

        peer.negotiationScheduled = true;
        peer.negotiationAttempts = 0;

        const tryOnce = async () => {
            const p = this.peers.get(remoteId);
            if (!p) return;
            if (!this.socket?.connected || !this.roomId) return;

            const pc = p.pc;
            const attempts = (p.negotiationAttempts ?? 0) + 1;
            p.negotiationAttempts = attempts;

            // Give up after a few seconds; any future track changes will re-schedule.
            if (attempts > 30) {
                p.negotiationScheduled = false;
                p.negotiationPending = false;
                p.negotiationTimer = undefined;
                return;
            }

            if (!p.negotiationPending) {
                p.negotiationScheduled = false;
                p.negotiationTimer = undefined;
                return;
            }

            // Wait until stable so createOffer()/setLocalDescription() succeeds.
            if (pc.signalingState !== 'stable' || p.makingOffer) {
                p.negotiationTimer = setTimeout(() => void tryOnce(), 200);
                return;
            }

            p.negotiationPending = false;
            p.negotiationScheduled = false;
            p.negotiationTimer = undefined;
            await this.sendOffer(remoteId);
        };

        peer.negotiationTimer = setTimeout(() => void tryOnce(), 0);
    }

    // ------------------- PEER CONNECTIONS ---------------------

    private async createPeerConnection(remoteId: string, initiator: boolean) {
        if (!this.socket) throw new Error('Socket not connected');
        if (!this.roomId) throw new Error('Room not joined');

        const mySocketId = this.socket?.id ?? this.localSocketId;
        // Defensive: never connect to ourselves (can happen if signaling/ack is wrong or stale).
        // Self-peering results in duplicated "remote" tiles that are actually local loopback.
        if (mySocketId && remoteId === mySocketId) {
            console.warn('⚠️ Ignoring attempt to create peer connection to self (socket ID match):', remoteId);
            return;
        }

        if (!this.peerSeenAt.has(remoteId)) {
            this.peerSeenAt.set(remoteId, Date.now());
        }

        const existing = this.peers.get(remoteId);
        if (existing) {
            const existingState = existing.pc.connectionState;
            const existingIceState = existing.pc.iceConnectionState;
            const existingSignalingState = existing.pc.signalingState;
            const isStale = existingState === 'closed'
                || existingIceState === 'closed'
                || existingIceState === 'failed'
                || existingSignalingState === 'closed';

            if (!isStale) {
                return;
            }

            console.warn('[RTC] Recreating stale peer connection', {
                remoteId,
                connectionState: existingState,
                iceConnectionState: existingIceState,
                signalingState: existingSignalingState,
            });
            this.disposePeerConnection(remoteId);
        }

        const config: RTCConfig = {
            iceServers: this.customIceServers,
            iceTransportPolicy: 'all' // 'relay' to force TURN
        };

        console.log(`🔗 Creating peer connection to ${remoteId} (initiator: ${initiator})`);
        console.log('   ICE Servers:', config.iceServers.map(s => s.urls).join(', '));

        const pc = new RTCPeerConnection(config);

        // CRITICAL: Always create initial m-lines for audio/video.
        // Without this, if a user joins with camera/mic off (or audio-only stream),
        // createOffer() may produce no usable media sections, and remote video won't appear
        // until a refresh/renegotiation.
        //
        // UPLOAD PRIORITY: declare network priority on the transceivers so the browser's
        // congestion-control and packet scheduler honours audio > screen > camera ordering.
        // RFC 8836 / DSCP: 'high' maps to EF (voice), 'medium' to AF41 (video), 'low' to BE.
        let audioTransceiver: RTCRtpTransceiver | undefined;
        let videoTransceiver: RTCRtpTransceiver | undefined;
        try {
            // Audio is highest priority — must never be degraded under congestion.
            audioTransceiver = pc.addTransceiver('audio', {
                direction: 'sendrecv',
                sendEncodings: [{ priority: 'high', networkPriority: 'high', maxBitrate: 96_000 } as any],
            });
        } catch { }
        try {
            // Camera video is lowest upload priority (degraded first under congestion).
            videoTransceiver = pc.addTransceiver('video', {
                direction: 'sendrecv',
                sendEncodings: [{ priority: 'low', networkPriority: 'low' } as any],
            });
        } catch { }

        // Codec preferences (best-effort; ignored where unsupported).
        this.preferDefaultCodecs(audioTransceiver, videoTransceiver);

        // Negotiation safety: if local id is not yet known for any reason, default to polite.
        // Defaulting to impolite (false) can deadlock if both sides collide and ignore offers.
        const localIdForPolite = this.socket?.id ?? this.localSocketId;
        const polite = !localIdForPolite ? true : localIdForPolite.localeCompare(remoteId) < 0;
        const peer: PeerConnection = {
            id: remoteId,
            pc,
            streams: [],
            pendingRemoteCandidates: [],
            polite,
            makingOffer: false,
            ignoreOffer: false,
            videoProfile: this.defaultVideoProfile,
            audioProfile: this.defaultAudioProfile,
            screenVideoProfile: this.defaultScreenVideoProfile,
        };
        this.peers.set(remoteId, peer);

        // Attach local tracks only for the side that will initiate the first offer.
        // The non-initiator will attach tracks when it receives an offer and sends an answer.
        if (initiator) {
            await this.attachAllLocalTracks(remoteId);
        }

        // If tracks are added/removed later, negotiate automatically.
        // This helps with "first join" and multi-participant reliability.
        pc.onnegotiationneeded = () => {
            if (!this.socket?.connected || !this.roomId) return;
            // Queue negotiation; if we're mid-negotiation, we'll retry once stable.
            this.scheduleNegotiation(remoteId, 'onnegotiationneeded');
        };

        // IMPORTANT:
        // Do NOT schedule negotiation on every transition to "stable".
        // That creates an offer/answer loop: offer -> answer -> stable -> offer -> ...
        // We only negotiate when something actually changes (onnegotiationneeded)
        // or when we explicitly request renegotiation (e.g. screen-share add/remove).
        pc.onsignalingstatechange = () => {
            // Keep for debugging/telemetry if needed.
            // console.log(`📶 signalingState(${remoteId}) =`, pc.signalingState);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && this.roomId) {
                console.log(`🧊 ICE candidate for ${remoteId}:`, event.candidate.type);
                this.socket!.emit('ice-candidate', {
                    roomId: this.roomId,
                    to: remoteId,
                    candidate: event.candidate,
                });
            } else if (!event.candidate) {
                console.log(`✅ ICE gathering complete for ${remoteId}`);
            }
        };

        // Monitor connection state
        pc.oniceconnectionstatechange = () => {
            console.log(`🔌 ICE connection state for ${remoteId}:`, pc.iceConnectionState);
            const state = pc.iceConnectionState;

            if (state === 'connected' || state === 'completed') {
                if (peer.iceRestartTimer) {
                    clearTimeout(peer.iceRestartTimer);
                    peer.iceRestartTimer = undefined;
                }
                return;
            }

            if (state === 'failed' || state === 'disconnected') {
                if (!peer.iceRestartTimer) {
                    peer.iceRestartTimer = setTimeout(() => {
                        peer.iceRestartTimer = undefined;

                        const current = pc.iceConnectionState;
                        if (current !== 'failed' && current !== 'disconnected') return;

                        console.warn(`♻️ ICE restart requested for ${remoteId} (state=${current})`);
                        peer.iceRestartPending = true;

                        try { pc.restartIce(); } catch { }
                        this.scheduleNegotiation(remoteId, 'ice-restart');
                    }, 2500);
                }

                if (state === 'failed') {
                    console.warn(`❌ ICE connection failed for ${remoteId}. May need TURN server.`);
                }
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`📡 Connection state for ${remoteId}:`, pc.connectionState);
        };

        pc.ontrack = (event) => {
            // Browsers can deliver audio/video tracks in separate MediaStreams (event.streams[0]),
            // which would create duplicated UI tiles and duplicated audio.
            // We only keep separate streams for screen share; all other tracks are aggregated
            // into a single stable MediaStream per peer.
            const providedStream = event.streams?.[0];
            const isProvidedScreen = !!providedStream && this.screenStreamIds.has(providedStream.id);
            const stream = isProvidedScreen
                ? providedStream!
                : (peer.defaultRemoteStream ?? (peer.defaultRemoteStream = new MediaStream()));

            try {
                this.reconcileRemoteTrackInStream(stream, event.track, isProvidedScreen);

                // Avoid duplicates if renegotiation re-fires ontrack.
                const alreadyHas = stream.getTracks().some(t => t.id === event.track.id);
                if (!alreadyHas) stream.addTrack(event.track);
            } catch {
                // ignore
            }
            console.log(`🎬 Remote track added from ${remoteId}:`, event.track.kind, 'ID:', event.track.id, 'Label:', event.track.label);

            const key = `${remoteId}:${stream.id}`;
            const isScreen = this.screenStreamIds.has(stream.id);

            // Keep at most one camera stream per peer.
            // Renegotiation/reconnect can produce a new non-screen stream id; remove stale ones.
            if (!isScreen) {
                for (const [existingKey, existing] of this.remoteStreams) {
                    if (existing.peerId === remoteId && !existing.isScreen && existing.streamId !== stream.id) {
                        this.remoteStreams.delete(existingKey);
                    }
                }
            }

            // Check if this might be a self-loopback before adding
            const displayName = this.peerDisplayNames.get(remoteId);
            const userId = this.peerUserIds.get(remoteId);
            const profileId = this.peerProfileIds.get(remoteId);
            const clientId = this.peerClientIds.get(remoteId);

            // Defense-in-depth: if a participant reconnects (new socketId) but the old socket
            // never delivered a clean peer-left (proxy/tab crash), evict duplicates as soon as
            // we receive media.
            if (!isScreen) {
                const incomingIdentityKey = this.participantIdentityKey(userId, profileId, clientId, displayName);
                if (incomingIdentityKey) {
                    const duplicates = [...this.peers.keys()].filter((id) => {
                        if (id === remoteId) return false;
                        const du = this.peerUserIds.get(id);
                        const dp = this.peerProfileIds.get(id);
                        const dc = this.peerClientIds.get(id);
                        const dn = this.peerDisplayNames.get(id);
                        return this.participantIdentityKey(du, dp, dc, dn) === incomingIdentityKey;
                    });

                    const group = [remoteId, ...duplicates];
                    const keep = group.reduce((best, candidate) => {
                        const bestAt = this.peerSeenAt.get(best) ?? 0;
                        const candAt = this.peerSeenAt.get(candidate) ?? 0;
                        if (candAt !== bestAt) return candAt > bestAt ? candidate : best;
                        return String(candidate) > String(best) ? candidate : best;
                    }, remoteId);

                    if (keep !== remoteId) {
                        console.warn('[RTC🔍 SERVICE] ontrack: dropping track from non-preferred duplicate socket', {
                            socketId: remoteId,
                            keptSocketId: keep,
                            identityKey: incomingIdentityKey,
                            kind: event.track.kind,
                        });
                        try { event.track.stop(); } catch { }
                        return;
                    }

                    for (const dupId of duplicates) {
                        console.warn('[RTC🔍 SERVICE] ontrack: evicting duplicate peer by identity', {
                            keptSocketId: remoteId,
                            droppedSocketId: dupId,
                            identityKey: incomingIdentityKey,
                        });
                        this.onPeerLeft(dupId);
                    }
                }
            }
            const tempRemote: RemotePeerStream = { peerId: remoteId, userId, profileId, clientId, streamId: stream.id, stream, isScreen, displayName };
            console.log('[RTC🔍 SERVICE] ontrack: checking self-loopback', {
                remoteId,
                userId: userId || '(none)',
                profileId: profileId || '(none)',
                clientId: clientId || '(none)',
                localUserId: this.localUserId || '(none)',
                localProfileId: this.localProfileId || '(none)',
            });
            if (this.isSelfLoopback(tempRemote)) {
                // Hard block self-loopback to avoid echo/double playback.
                console.warn('⚠️ Detected self-loopback stream from', remoteId, '- dropping remote track');
                try { event.track.stop(); } catch { }
                return;
            }

            this.remoteStreams.set(key, tempRemote);

            // When remote track ends, remove stream if empty
            event.track.onended = () => {
                this.cleanupRemoteStreamIfEmpty(remoteId, stream.id);
            };

            this.emitRemoteStreams();
        };

        if (initiator) {
            // Avoid sending an immediate offer AND also reacting to onnegotiationneeded.
            // Scheduling here coalesces changes into a single negotiation.
            this.scheduleNegotiation(remoteId, 'initiator-initial');
        }
    }

    private async onPeerJoined(payload: any) {
        const socketId = String(payload?.socketId ?? payload ?? '').trim();
        if (!socketId) return;
        if (socketId === this.socket?.id) return;

        const userId = String(payload?.userId ?? '').trim();
        const profileId = String(payload?.profileId ?? '').trim();
        const clientId = String(payload?.clientId ?? '').trim();
        const name = String(payload?.displayName ?? '').trim();

        this.peerSeenAt.set(socketId, Date.now());
        console.log('[RTC🔍 SERVICE] onPeerJoined', {
            socketId,
            userId: userId || '(none)',
            profileId: profileId || '(none)',
            clientId: clientId || '(none)',
            displayName: name || '(none)',
            myUserId: this.localUserId || '(none)',
            myProfileId: this.localProfileId || '(none)',
        });

        if (this.localClientId && clientId && clientId === this.localClientId) {
            console.warn('[RTC🔍 SERVICE] 🚫 Ignoring peer-joined for own clientId (same tab/session):', {
                socketId,
                clientId,
                localClientId: this.localClientId,
            });
            return;
        }

        // Block self-loopback: if this "peer" has the same userId/profileId as us,
        // it's a stale socket from the same account. Ignore it entirely.
        if (this.isSameParticipantIdentity(this.localUserId, this.localProfileId, userId, profileId)) {
            console.warn('[RTC🔍 SERVICE] 🚫 Ignoring peer-joined for own participant identity (stale socket):', {
                socketId,
                userId: userId || '(none)',
                profileId: profileId || '(none)',
                localUserId: this.localUserId || '(none)',
                localProfileId: this.localProfileId || '(none)',
            });
            return;
        }

        // If this participant reconnected (new socketId), drop the previous peer immediately.
        // Prefer profileId for uniqueness so multiple profiles under the same account can
        // coexist in the same room.
        if (profileId) {
            for (const [existingSocketId, existingProfileId] of this.peerProfileIds.entries()) {
                if (existingProfileId === profileId && existingSocketId !== socketId) {
                    this.onPeerLeft(existingSocketId);
                }
            }
            this.peerProfileIds.set(socketId, profileId);
        } else if (userId) {
            for (const [existingSocketId, existingUserId] of this.peerUserIds.entries()) {
                if (existingUserId === userId && existingSocketId !== socketId) {
                    this.onPeerLeft(existingSocketId);
                }
            }
        } else if (clientId) {
            // Guest mode: still dedupe by clientId to evict stale sockets.
            for (const [existingSocketId, existingClientId] of this.peerClientIds.entries()) {
                if (existingClientId === clientId && existingSocketId !== socketId) {
                    this.onPeerLeft(existingSocketId);
                }
            }
        } else if (name) {
            // Last-resort fallback (older clients): if identity fields are missing,
            // dedupe by displayName to avoid duplicated tiles/audio after refresh.
            for (const [existingSocketId, existingName] of this.peerDisplayNames.entries()) {
                if (existingSocketId === socketId) continue;
                if (existingName !== name) continue;

                const existingHasIdentity = !!String(this.peerProfileIds.get(existingSocketId) ?? '').trim()
                    || !!String(this.peerUserIds.get(existingSocketId) ?? '').trim()
                    || !!String(this.peerClientIds.get(existingSocketId) ?? '').trim();
                if (!existingHasIdentity) {
                    console.warn('[RTC🔍 SERVICE] onPeerJoined: evicting duplicate peer by displayName (no identity fields):', {
                        droppedSocketId: existingSocketId,
                        keptSocketId: socketId,
                        displayName: name,
                    });
                    this.onPeerLeft(existingSocketId);
                }
            }
        }

        if (userId) {
            this.peerUserIds.set(socketId, userId);
        }
        if (clientId) {
            this.peerClientIds.set(socketId, clientId);
        }
        // If tracks arrived before identity metadata, update existing remote stream models.
        // This prevents UI from treating the same peer as multiple participants.
        if (userId || profileId || clientId) {
            let changed = false;
            for (const [key, value] of this.remoteStreams) {
                if (!key.startsWith(`${socketId}:`)) continue;

                const nextUserId = userId || value.userId;
                const nextProfileId = profileId || value.profileId;
                const nextClientId = clientId || value.clientId;
                if (nextUserId !== value.userId || nextProfileId !== value.profileId || nextClientId !== value.clientId) {
                    this.remoteStreams.set(key, { ...value, userId: nextUserId, profileId: nextProfileId, clientId: nextClientId });
                    changed = true;
                }
            }
            if (changed) this.emitRemoteStreams();
        }

        if (name) {
            this.peerDisplayNames.set(socketId, name);

            // If tracks arrived before the name, update existing remote stream models.
            for (const [key, value] of this.remoteStreams) {
                if (key.startsWith(`${socketId}:`) && value.displayName !== name) {
                    this.remoteStreams.set(key, {
                        ...value,
                        displayName: name,
                        userId: userId || value.userId,
                        profileId: profileId || value.profileId,
                        clientId: clientId || value.clientId,
                    });
                }
            }
            this.emitRemoteStreams();
        }

        // Avoid duplicate connections if we already have this peer.
        if (this.peers.has(socketId)) {
            this.participantIds.add(socketId);
            this.emitParticipantIds();
            return;
        }

        // Participant list should update immediately (even before media arrives).
        this.participantIds.add(socketId);
        this.emitParticipantIds();

        // Create a peer connection but do not initiate offers (new joiner will call us)
        await this.createPeerConnection(socketId, false);

        // Fallback: if the joiner doesn't initiate for any reason, try once.
        // Perfect negotiation logic will prevent damaging glare in normal cases.
        setTimeout(() => {
            const peer = this.peers.get(socketId);
            if (!peer) return;
            if (!this.socket?.connected || !this.roomId) return;

            const pc = peer.pc;
            if (pc.connectionState === 'connected') return;
            if (pc.signalingState !== 'stable') return;
            if (pc.currentRemoteDescription) return;

            void this.attachAllLocalTracks(socketId)
                .then(() => {
                    this.scheduleNegotiation(socketId, 'joiner-fallback');
                })
                .catch(() => undefined);
        }, 1000);
    }

    private onPeerLeft(socketId: string) {
        console.log('[RTC🔍 SERVICE] onPeerLeft', { socketId });
        this.participantIds.delete(socketId);
        this.emitParticipantIds();

        this.peerDisplayNames.delete(socketId);
        this.peerSeenAt.delete(socketId);
        this.peerUserIds.delete(socketId);
        this.peerProfileIds.delete(socketId);
        this.peerClientIds.delete(socketId);
        this.peerMediaStates.delete(socketId);
        this.peerMediaStates$.next(new Map(this.peerMediaStates));

        for (const [key] of this.remoteStreams) {
            if (key.startsWith(`${socketId}:`)) this.remoteStreams.delete(key);
        }
        this.emitRemoteStreams();

        this.disposePeerConnection(socketId);
    }

    private async onOffer({ from, sdp }: any) {
        // Defensive: ignore offers from ourselves.
        if (from && (from === (this.socket?.id ?? this.localSocketId))) {
            console.warn('[RTC🔍 SERVICE] Ignoring offer from self:', from);
            return;
        }
        console.log('[RTC🔍 SERVICE] onOffer', { from, hasSdp: !!sdp });
        await this.createPeerConnection(from, false);
        const peer = this.peers.get(from);
        if (!peer) return;

        const pc = peer.pc;
        const description = sdp;

        const offerCollision = !!peer.makingOffer || pc.signalingState !== 'stable';
        peer.ignoreOffer = !peer.polite && offerCollision;
        if (peer.ignoreOffer) {
            console.warn(`⚠️ Ignoring offer from ${from} due to glare (polite=false)`);
            return;
        }

        // If both sides made offers, polite side rolls back.
        if (offerCollision) {
            try {
                // Rollback is supported in modern Chromium/Firefox.
                await pc.setLocalDescription({ type: 'rollback' } as any);
            } catch {
                // If rollback fails, continue; setRemoteDescription may still succeed.
            }
        }

        // Ensure local tracks are attached before answering
        await this.attachAllLocalTracks(from);

        await pc.setRemoteDescription(description);
        await this.flushPendingIceCandidates(from);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.socket!.emit('answer', { roomId: this.roomId, to: from, sdp: pc.localDescription });
    }

    private async onAnswer({ from, sdp }: any) {
        const peer = this.peers.get(from);
        if (!peer) return;
        const pc = peer.pc;

        // Answers are only valid when we have a local offer outstanding.
        // Applying an answer in the wrong signaling state can trigger DTLS role errors
        // like: "Failed to set SSL role for the transport".
        if (pc.signalingState !== 'have-local-offer' || pc.localDescription?.type !== 'offer') {
            console.warn('[RTC🔍 SERVICE] Ignoring stale/out-of-order answer (not in have-local-offer).', {
                from,
                signalingState: pc.signalingState,
                localType: pc.localDescription?.type,
                remoteType: pc.remoteDescription?.type,
            });
            this.scheduleNegotiation(from, 'stale-answer-not-have-local-offer');
            return;
        }

        // Defensive: if state is transitioning, wait briefly.
        const ok = await this.waitForSignalingState(pc, 'have-local-offer', 1500);
        if (!ok) {
            console.warn('[RTC🔍 SERVICE] Timed out waiting for have-local-offer; ignoring answer.', { from, signalingState: pc.signalingState });
            this.scheduleNegotiation(from, 'stale-answer-timeout-have-local-offer');
            return;
        }

        try {
            await pc.setRemoteDescription(sdp);
        } catch (e: any) {
            const message = String(e?.message ?? e ?? '');
            const isIceRestartMismatch = /ice restart/i.test(message)
                && /did not request ice restart/i.test(message);
            if (isIceRestartMismatch) {
                console.warn('[RTC🔍 SERVICE] Ignoring stale/out-of-order answer (ICE restart mismatch).', {
                    from,
                    signalingState: pc.signalingState,
                    connectionState: pc.connectionState,
                });
                this.scheduleNegotiation(from, 'stale-answer-ice-restart-mismatch');
                return;
            }

            const isDtlsRoleError = /Failed to set SSL role for the transport/i.test(message)
                || /Failed to apply the description.*mid=/i.test(message);
            if (isDtlsRoleError) {
                console.warn('[RTC🔍 SERVICE] DTLS role/SDP apply error on answer; resetting peer connection.', {
                    from,
                    signalingState: pc.signalingState,
                    connectionState: pc.connectionState,
                    message,
                });

                // Reset PC and renegotiate.
                try { pc.close(); } catch { }
                this.peers.delete(from);
                for (const [key] of this.remoteStreams) {
                    if (key.startsWith(`${from}:`)) this.remoteStreams.delete(key);
                }
                this.emitRemoteStreams();

                await this.createPeerConnection(from, true);
                this.scheduleNegotiation(from, 'reset-after-dtls-role-error');
                return;
            }
            throw e;
        }
        await this.flushPendingIceCandidates(from);
    }

    private async onIceCandidate({ from, candidate }: any) {
        const peer = this.peers.get(from);
        if (peer && candidate) {
            if (peer.ignoreOffer) return;

            // Candidate may arrive before offer/answer is applied; queue it instead of dropping.
            if (!peer.pc.remoteDescription) {
                peer.pendingRemoteCandidates = peer.pendingRemoteCandidates ?? [];
                peer.pendingRemoteCandidates.push(candidate);
                return;
            }

            try {
                await peer.pc.addIceCandidate(candidate);
            } catch (e) {
                console.warn('ICE error', e);
            }
        }
    }

    private async flushPendingIceCandidates(remoteId: string): Promise<void> {
        const peer = this.peers.get(remoteId);
        if (!peer) return;
        if (!peer.pc.remoteDescription) return;

        const queue = peer.pendingRemoteCandidates ?? [];
        if (!queue.length) return;

        peer.pendingRemoteCandidates = [];

        for (const candidate of queue) {
            try {
                await peer.pc.addIceCandidate(candidate);
            } catch (e) {
                console.warn('ICE flush error', e);
            }
        }
    }

    private async recoverAfterReconnect(): Promise<void> {
        if (this.reconnecting) return;
        if (!this.socket?.connected) return;
        if (!this.roomId) return;

        this.reconnecting = true;
        try {
            console.log('🔄 Recovering RTC room after reconnect...', { roomId: this.roomId, socketId: this.socket.id });

            // Tear down stale peer graph bound to previous socket session.
            for (const peer of this.peers.values()) {
                if (peer.iceRestartTimer) {
                    clearTimeout(peer.iceRestartTimer);
                    peer.iceRestartTimer = undefined;
                }
                if (peer.negotiationTimer) {
                    clearTimeout(peer.negotiationTimer);
                    peer.negotiationTimer = undefined;
                }
                try { peer.pc.close(); } catch { }
            }
            this.peers.clear();
            this.remoteStreams.clear();
            this.remoteStreams$.next([]);
            this.participantIds.clear();
            this.participantIds$.next([]);
            this.peerDisplayNames.clear();
            this.peerSeenAt.clear();
            this.peerUserIds.clear();
            this.peerProfileIds.clear();
            this.peerClientIds.clear();
            this.lastRequestedMediaProfiles.clear();
            this.peerMediaStates.clear();
            this.peerMediaStates$.next(new Map());

            const roomId = this.roomId;
            const displayName = this.displayName;
            const userId = this.localUserId;
            const profileId = this.localProfileId;
            const userEmail = this.localUserEmail;
            const joinToken = this.roomJoinToken;
            const clientId = this.localClientId || this.getOrCreateRtcClientId();

            await new Promise<void>((resolve) => {
                this.socket!.emit('join-room', { roomId, displayName, userId, profileId, userEmail, joinToken, clientId }, async (ack: any) => {
                    const mySocketId = this.socket?.id;
                    const rawPeers: string[] = ack?.peers ?? [];
                    let peers = [...new Set(rawPeers)].filter((id) => !!id && id !== mySocketId);
                    const peerDisplayNames = ack?.peerDisplayNames ?? {};
                    const peerUserIds = ack?.peerUserIds ?? {};
                    const peerProfileIds = ack?.peerProfileIds ?? {};

                    // Filter self-sockets (stale connections from same account after refresh).
                    peers = peers.filter((id) => {
                        const pUid = String(peerUserIds?.[id] ?? '').trim();
                        const pPid = String(peerProfileIds?.[id] ?? '').trim();
                        if (this.isSameParticipantIdentity(userId, profileId, pUid, pPid)) return false;
                        return true;
                    });

                    for (const id of peers) {
                        const peerName = String(peerDisplayNames?.[id] ?? '').trim();
                        if (peerName) this.peerDisplayNames.set(id, peerName);

                        const peerUserId = String(peerUserIds?.[id] ?? '').trim();
                        if (peerUserId) this.peerUserIds.set(id, peerUserId);

                        const peerProfileId = String(peerProfileIds?.[id] ?? '').trim();
                        if (peerProfileId) this.peerProfileIds.set(id, peerProfileId);
                    }

                    // Restore peer media states from server.
                    const serverMediaStates = ack?.peerMediaStates ?? {};
                    for (const id of peers) {
                        const state = serverMediaStates[id];
                        if (state && typeof state === 'object') {
                            this.peerMediaStates.set(id, {
                                audioEnabled: typeof state.audioEnabled === 'boolean' ? state.audioEnabled : true,
                                videoEnabled: typeof state.videoEnabled === 'boolean' ? state.videoEnabled : true,
                            });
                        }
                    }
                    this.peerMediaStates$.next(new Map(this.peerMediaStates));

                    for (const id of peers) this.participantIds.add(id);
                    this.emitParticipantIds();

                    for (const id of peers) {
                        await this.createPeerConnection(id, true);
                    }

                    // Enforce current mic/video state after rebuilding peer graph.
                    await this.applyOutgoingAudioState();

                    // Re-broadcast our own media state so server and peers are in sync.
                    this.broadcastMediaState();
                    resolve();
                });
            });

            console.log('✅ RTC room recovery complete');
        } catch (e) {
            console.warn('⚠️ RTC room recovery failed', e);
        } finally {
            this.reconnecting = false;
        }
    }

    private async attachAllLocalTracks(remoteId: string): Promise<void> {
        const peer = this.peers.get(remoteId);
        if (!peer) return;
        const pc = peer.pc;
        const pendingOperations: Promise<unknown>[] = [];

        const existingTrackIds = new Set(pc.getSenders().map(s => s.track?.id).filter(Boolean) as string[]);
        const audioSenders = this.getAudioSenders(pc);
        const videoSenders = this.getVideoSenders(pc);

        const cameraVideoTrack = this.localCameraStream?.getVideoTracks()?.[0];
        const screenVideoTrack = this.localScreenStream?.getVideoTracks()?.[0];

        // --- Audio (prefer replaceTrack on existing sender) ---
        const audioTrack = this.getCurrentMicTrack();

        // CRITICAL: Check audioEnabled flag FIRST to respect user's mute state
        // Without this check, renegotiation could re-attach audio even when user clicked mute
        if (!this.audioEnabled) {
            // Audio is disabled - ensure no audio senders have tracks
            console.log('🔇 Audio disabled - ensuring no audio tracks on senders (attachAllLocalTracks)');
            for (const sender of audioSenders) {
                this.setSenderAudioActive(sender, false);
                pendingOperations.push(sender.replaceTrack(null).catch(() => undefined));
            }
        } else if (audioTrack) {
            console.log('🎤 Attaching audio track (audioEnabled=true)');
            if (audioSenders.length > 0) {
                const [primary, ...extras] = audioSenders;
                this.setSenderAudioActive(primary, true);
                pendingOperations.push(primary.replaceTrack(audioTrack).catch(() => undefined));
                for (const extra of extras) {
                    this.setSenderAudioActive(extra, false);
                    pendingOperations.push(extra.replaceTrack(null).catch(() => undefined));
                }
            } else if (this.localCameraStream && !existingTrackIds.has(audioTrack.id)) {
                try {
                    pc.addTrack(audioTrack, this.localCameraStream);
                } catch (e) {
                    console.warn('⚠️ Failed to add audio track', e);
                }
            }
        }

        // --- Camera video (reuse sender) ---
        // CRITICAL: Check videoEnabled flag FIRST to respect user's video off state
        // Without this check, renegotiation could re-attach video even when user clicked video off
        if (!this.videoEnabled) {
            // Video is disabled - ensure camera video sender has no track
            console.log('🚫 Video disabled - ensuring no camera video track on sender (attachAllLocalTracks)');
            if (peer.cameraVideoSender) {
                pendingOperations.push(peer.cameraVideoSender.replaceTrack(null).catch(() => undefined));
            }
            // Also check all video senders and remove camera tracks
            for (const sender of videoSenders) {
                if (sender.track && cameraVideoTrack && sender.track.id === cameraVideoTrack.id) {
                    pendingOperations.push(sender.replaceTrack(null).catch(() => undefined));
                }
            }
        } else if (cameraVideoTrack) {
            console.log('📹 Attaching camera video track (videoEnabled=true)');
            if (peer.cameraVideoSender) {
                if (peer.cameraVideoSender.track?.id !== cameraVideoTrack.id) {
                    pendingOperations.push(peer.cameraVideoSender.replaceTrack(cameraVideoTrack).catch(() => undefined));
                }
            } else {
                // Try to reuse an existing non-screen video sender even if its track is null
                const existingNonScreenVideoSender = videoSenders.find((s) => {
                    const t = s.track;
                    if (t && t.kind === 'video') {
                        return !screenVideoTrack || t.id !== screenVideoTrack.id;
                    }
                    // Null-track sender (from transceiver) is safe to use for camera.
                    return true;
                });
                if (existingNonScreenVideoSender) {
                    peer.cameraVideoSender = existingNonScreenVideoSender;
                    if (existingNonScreenVideoSender.track?.id !== cameraVideoTrack.id) {
                        pendingOperations.push(existingNonScreenVideoSender.replaceTrack(cameraVideoTrack).catch(() => undefined));
                    }
                } else if (!existingTrackIds.has(cameraVideoTrack.id) && this.localCameraStream) {
                    try {
                        peer.cameraVideoSender = pc.addTrack(cameraVideoTrack, this.localCameraStream);
                    } catch (e) {
                        console.warn('⚠️ Failed to add camera video track', e);
                    }
                }
            }
        }

        // --- Screen video (reuse sender; allow in parallel with camera) ---
        if (screenVideoTrack) {
            if (peer.screenVideoSender) {
                if (peer.screenVideoSender.track?.id !== screenVideoTrack.id) {
                    pendingOperations.push(peer.screenVideoSender.replaceTrack(screenVideoTrack).catch(() => undefined));
                }
                this.preferH264ForSender(pc, peer.screenVideoSender);
            } else if (this.localScreenStream && !existingTrackIds.has(screenVideoTrack.id)) {
                try {
                    peer.screenVideoSender = pc.addTrack(screenVideoTrack, this.localScreenStream);
                    this.preferH264ForSender(pc, peer.screenVideoSender);
                } catch (e) {
                    console.warn('⚠️ Failed to add screen video track', e);
                }
            }
        }

        if (pendingOperations.length > 0) {
            await Promise.allSettled(pendingOperations);
        }

        // Apply outbound video profile (best-effort).
        // This runs after we have ensured cameraVideoSender is attached/replaced.
        await Promise.allSettled([
            this.applyOutboundVideoProfile(remoteId),
            this.applyOutboundAudioProfile(remoteId),
            this.applyOutboundScreenVideoProfile(remoteId),
        ]);

    }

    /**
     * Set outbound camera video quality policy for a specific peer connection.
     * This only affects what *we* send to that peer (mesh topology).
     */
    setPeerVideoProfile(remoteId: string, profile: 'high' | 'low'): void {
        const peer = this.peers.get(remoteId);
        if (!peer) return;
        peer.videoProfile = profile;
        void this.applyOutboundVideoProfile(remoteId);
    }

    /**
     * Set outbound microphone audio quality policy for a specific peer connection.
     * This only affects what *we* send to that peer (mesh topology).
     */
    setPeerAudioProfile(remoteId: string, profile: MediaProfile): void {
        const peer = this.peers.get(remoteId);
        if (!peer) return;
        peer.audioProfile = profile;
        void this.applyOutboundAudioProfile(remoteId);
    }

    /**
     * Set outbound screen-share video quality policy for a specific peer connection.
     * This only affects what *we* send to that peer (mesh topology).
     */
    setPeerScreenVideoProfile(remoteId: string, profile: MediaProfile): void {
        const peer = this.peers.get(remoteId);
        if (!peer) return;
        peer.screenVideoProfile = profile;
        void this.applyOutboundScreenVideoProfile(remoteId);
    }

    /**
     * Set the default outbound video profile for future peers (existing peers unchanged).
     */
    setDefaultVideoProfile(profile: 'high' | 'low'): void {
        this.defaultVideoProfile = profile;
    }

    private async applyOutboundVideoProfile(remoteId: string): Promise<void> {
        const peer = this.peers.get(remoteId);
        if (!peer) return;

        const pc = peer.pc;
        const sender = peer.cameraVideoSender ?? this.getVideoSenders(pc).find(s => s.track?.kind === 'video');
        if (!sender) return;

        // If we are not sending camera video, nothing to tune.
        const track = sender.track;
        if (!track || track.kind !== 'video') return;

        const profile = peer.videoProfile ?? this.defaultVideoProfile;

        // UPLOAD PRIORITY ORDER: audio (high) > screen (medium) > camera (low)
        // Camera is deprioritised first so voice intelligibility is protected under congestion.
        const target = profile === 'high'
            ? { maxBitrate: 1_500_000, maxFramerate: 30, scaleResolutionDownBy: 1, priority: 'low' as any, networkPriority: 'low' as any }
            : { maxBitrate: 300_000, maxFramerate: 15, scaleResolutionDownBy: 2, priority: 'low' as any, networkPriority: 'low' as any };

        try {
            const params = sender.getParameters();
            const encodings = (params.encodings && params.encodings.length > 0) ? params.encodings : [{}];
            encodings[0] = {
                ...encodings[0],
                maxBitrate: target.maxBitrate,
                maxFramerate: target.maxFramerate,
                scaleResolutionDownBy: target.scaleResolutionDownBy,
                priority: target.priority,
                networkPriority: target.networkPriority,
            };
            params.encodings = encodings;
            await sender.setParameters(params);
        } catch (e) {
            // Some browsers restrict setParameters depending on state/codec.
            console.warn('⚠️ Could not apply outbound video profile for', remoteId, profile, e);
        }
    }

    private async applyOutboundAudioProfile(remoteId: string): Promise<void> {
        const peer = this.peers.get(remoteId);
        if (!peer) return;

        const pc = peer.pc;
        const sender = this.getAudioSenders(pc).find(s => s.track?.kind === 'audio');
        if (!sender) return;

        const track = sender.track;
        if (!track || track.kind !== 'audio') return;

        const profile = peer.audioProfile ?? this.defaultAudioProfile;

        // UPLOAD PRIORITY: audio is always 'high' — it must survive network congestion.
        // Opus generally sounds better when allowed more headroom.
        // Keep it bounded to avoid starving video in constrained uplinks.
        const target = profile === 'high'
            ? { maxBitrate: 96_000, priority: 'high' as any, networkPriority: 'high' as any }
            : { maxBitrate: 32_000, priority: 'high' as any, networkPriority: 'high' as any };

        try {
            const params = sender.getParameters();
            const encodings = (params.encodings && params.encodings.length > 0) ? params.encodings : [{}];
            encodings[0] = {
                ...encodings[0],
                maxBitrate: target.maxBitrate,
                priority: target.priority,
                networkPriority: target.networkPriority,
            };
            params.encodings = encodings;
            await sender.setParameters(params);
        } catch (e) {
            console.warn('⚠️ Could not apply outbound audio profile for', remoteId, profile, e);
        }
    }

    private async applyOutboundScreenVideoProfile(remoteId: string): Promise<void> {
        const peer = this.peers.get(remoteId);
        if (!peer) return;

        const sender = peer.screenVideoSender;
        if (!sender) return;

        const track = sender.track;
        if (!track || track.kind !== 'video') return;

        const profile = peer.screenVideoProfile ?? this.defaultScreenVideoProfile;

        // UPLOAD PRIORITY: screen share is 'medium' — higher than camera, lower than audio.
        const target = profile === 'high'
            ? { maxBitrate: 1_500_000, maxFramerate: 15, scaleResolutionDownBy: 1, priority: 'medium' as any, networkPriority: 'medium' as any }
            : { maxBitrate: 400_000, maxFramerate: 10, scaleResolutionDownBy: 2, priority: 'medium' as any, networkPriority: 'medium' as any };

        try {
            const params = sender.getParameters();
            const encodings = (params.encodings && params.encodings.length > 0) ? params.encodings : [{}];
            encodings[0] = {
                ...encodings[0],
                maxBitrate: target.maxBitrate,
                maxFramerate: target.maxFramerate,
                scaleResolutionDownBy: target.scaleResolutionDownBy,
                priority: target.priority,
                networkPriority: target.networkPriority,
            };
            params.encodings = encodings;
            await sender.setParameters(params);
        } catch (e) {
            console.warn('⚠️ Could not apply outbound screen video profile for', remoteId, profile, e);
        }
    }

    /**
     * Ask a peer to adjust what they send *to us* (mesh).
     * This is best-effort and relies on the peer honoring the request.
     */
    requestPeerMediaProfile(
        remoteId: string,
        profiles: { cameraVideo?: MediaProfile; screenVideo?: MediaProfile; audio?: MediaProfile },
    ): void {
        if (!this.socket?.connected) return;
        if (!this.roomId) return;
        if (!remoteId) return;

        const payload = {
            roomId: this.roomId,
            to: remoteId,
            cameraVideo: profiles.cameraVideo,
            screenVideo: profiles.screenVideo,
            audio: profiles.audio,
        };

        const signature = JSON.stringify(payload);
        const prev = this.lastRequestedMediaProfiles.get(remoteId);
        if (prev === signature) return;
        this.lastRequestedMediaProfiles.set(remoteId, signature);

        this.socket.emit('set-media-profile', payload);
    }

    private onMediaProfile(data: any): void {
        const from = String(data?.from ?? '').trim();
        if (!from) return;
        if (from === (this.socket?.id ?? this.localSocketId)) return;

        const cameraVideo = data?.cameraVideo as MediaProfile | undefined;
        const screenVideo = data?.screenVideo as MediaProfile | undefined;
        const audio = data?.audio as MediaProfile | undefined;

        if (cameraVideo === 'high' || cameraVideo === 'low') {
            this.setPeerVideoProfile(from, cameraVideo);
        }
        if (screenVideo === 'high' || screenVideo === 'low') {
            this.setPeerScreenVideoProfile(from, screenVideo);
        }
        if (audio === 'high' || audio === 'low') {
            this.setPeerAudioProfile(from, audio);
        }
    }

    private async applyVoiceFilterToLocalMicIfPossible(reapplyOutgoingState: boolean = true): Promise<void> {
        if (this.micProcessed) return;
        if (!this.localCameraStream) return;
        const [audioTrack] = this.localCameraStream.getAudioTracks();
        if (!audioTrack) return;

        try {
            // Avoid processing twice if already replaced.
            if (this.micProcessedTrack && audioTrack.id === this.micProcessedTrack.id) {
                this.micProcessed = true;
                return;
            }

            // Some browsers require user gesture to start AudioContext; camera init is usually
            // triggered by user action, but we still handle failures gracefully.
            let ctx: AudioContext;
            try {
                ctx = new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 } as any);
            } catch {
                ctx = new AudioContext({ latencyHint: 'interactive' });
            }
            try { await ctx.resume(); } catch { }
            const srcStream = new MediaStream([audioTrack]);
            const source = ctx.createMediaStreamSource(srcStream);

            const highpass = ctx.createBiquadFilter();
            highpass.type = 'highpass';
            // Reduce rumble / wind / handling noise.
            highpass.frequency.value = 100;

            const lowpass = ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            // Reduce hiss / sharp high-frequency artifacts.
            lowpass.frequency.value = 8000;

            const compressor = ctx.createDynamicsCompressor();
            // Gentler compression for more natural voice, but still keeps levels consistent.
            compressor.threshold.value = -18;
            compressor.knee.value = 24;
            compressor.ratio.value = 4;
            compressor.attack.value = 0.005;
            compressor.release.value = 0.15;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.8;

            const gateGain = ctx.createGain();
            gateGain.gain.value = 1;

            const dest = ctx.createMediaStreamDestination();
            source.connect(highpass);
            highpass.connect(lowpass);
            lowpass.connect(analyser);
            analyser.connect(compressor);
            compressor.connect(gateGain);
            gateGain.connect(dest);

            // Lightweight noise gate: suppress low-level ambient noise when you're not speaking.
            // This won't perfectly isolate voice, but it helps a lot with constant background noise.
            const data = new Float32Array(analyser.fftSize);
            const openThreshold = 0.018;   // open gate when voice energy is present
            const closeThreshold = 0.010;  // hysteresis to avoid chattering
            let gateOpen = true;
            let belowCount = 0;
            const closeAfterIntervals = 6; // ~300ms at 50ms interval

            if (this.micGateInterval) {
                clearInterval(this.micGateInterval);
                this.micGateInterval = undefined;
            }

            this.micGateInterval = setInterval(() => {
                try {
                    analyser.getFloatTimeDomainData(data);
                    let sumSq = 0;
                    for (let i = 0; i < data.length; i++) {
                        const v = data[i];
                        sumSq += v * v;
                    }
                    const rms = Math.sqrt(sumSq / data.length);

                    if (gateOpen) {
                        if (rms < closeThreshold) {
                            belowCount++;
                            if (belowCount >= closeAfterIntervals) {
                                gateOpen = false;
                                belowCount = 0;
                                // Don't slam to absolute zero (prevents harsh cut-outs / breath clipping).
                                gateGain.gain.setTargetAtTime(0.12, ctx.currentTime, 0.05);
                            }
                        } else {
                            belowCount = 0;
                        }
                    } else {
                        if (rms > openThreshold) {
                            gateOpen = true;
                            belowCount = 0;
                            gateGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.02);
                        }
                    }
                } catch {
                    // Ignore (can happen during shutdown)
                }
            }, 50);

            const [processedTrack] = dest.stream.getAudioTracks();
            if (!processedTrack) {
                ctx.close().catch(() => undefined);
                return;
            }

            // Keep processed track enabled consistent with our app mute state.
            processedTrack.enabled = this.audioEnabled;

            // Replace track in the local stream so future addTrack uses filtered audio.
            this.localCameraStream.removeTrack(audioTrack);
            this.localCameraStream.addTrack(processedTrack);
            this.localStream$.next(this.localCameraStream);

            this.micAudioContext?.close().catch(() => undefined);
            this.micAudioContext = ctx;
            this.micOriginalTrack = audioTrack;
            this.micProcessedTrack = processedTrack;
            this.micProcessed = true;
            console.log('🎛️ Applied voice filter chain to microphone (HPF/LPF/Compressor + Noise Gate)');

            // IMPORTANT: re-apply mute/unmute to all peer connections after processing.
            // This prevents the filter step from accidentally re-attaching audio while muted.
            // When called from applyOutgoingAudioState() itself, skip to avoid nested re-entry.
            if (reapplyOutgoingState) {
                await this.applyOutgoingAudioState();
            }
        } catch (e) {
            console.warn('⚠️ Voice filter could not be applied; using raw microphone track.', e);
        }
    }

    private emitRemoteStreams() {
        // Filter out self-loopback streams (where user sees their own video/audio)
        const filtered = [...this.remoteStreams.values()].filter(remote => {
            if (!this.isSelfLoopback(remote)) return true;

            console.log('🚫 Filtering out self-loopback stream from', remote.peerId);
            return false;
        });

        // CRITICAL FIX: Only emit if the filtered list has actually changed
        // This prevents unnecessary re-renders that replace existing participant videos
        const current = this.remoteStreams$.value;
        if (this.hasStreamListChanged(current, filtered)) {
            this.remoteStreams$.next(filtered);
        }
    }

    /**
     * Check if stream list has meaningfully changed (different peer IDs or stream IDs)
     * This prevents re-emitting the same streams which causes UI flickering/replacement
     */
    private hasStreamListChanged(current: RemotePeerStream[], updated: RemotePeerStream[]): boolean {
        if (current.length !== updated.length) return true;

        const toComparableMap = (items: RemotePeerStream[]): Map<string, string> => {
            const map = new Map<string, string>();
            for (const s of items) {
                const key = `${s.peerId}:${s.stream.id}`;
                const metadata = JSON.stringify({
                    isScreen: !!s.isScreen,
                    userId: String(s.userId ?? ''),
                    profileId: String(s.profileId ?? ''),
                    clientId: String(s.clientId ?? ''),
                    displayName: String(s.displayName ?? ''),
                });
                map.set(key, metadata);
            }
            return map;
        };

        const currentMap = toComparableMap(current);
        const updatedMap = toComparableMap(updated);

        if (currentMap.size !== updatedMap.size) return true;

        for (const [key, updatedMeta] of updatedMap.entries()) {
            const currentMeta = currentMap.get(key);
            if (!currentMeta) return true;
            if (currentMeta !== updatedMeta) return true;
        }

        return false;
    }

    private isSameParticipantIdentity(
        localUserId?: string,
        localProfileId?: string,
        remoteUserId?: string,
        remoteProfileId?: string,
    ): boolean {
        const localUid = String(localUserId ?? '').trim();
        const localPid = String(localProfileId ?? '').trim();
        const remoteUid = String(remoteUserId ?? '').trim();
        const remotePid = String(remoteProfileId ?? '').trim();

        // Profile-first identity rule:
        // if both sides expose profileId, only profileId decides sameness.
        // This allows same-account multi-profile calls in one room.
        if (localPid && remotePid) {
            return localPid === remotePid;
        }

        // Fallback to userId only when neither side has profileId.
        if (!localPid && !remotePid && localUid && remoteUid) {
            return localUid === remoteUid;
        }

        return false;
    }

    /**
     * Detect if a remote stream is actually our own stream looped back.
     *
     * LOOPBACK DETECTION RULES (in priority order):
     * 1. Same socket ID as ours → always loopback (server sent our own SDP back).
     * 2. Matching MediaStreamTrack IDs → always loopback (unique per getUserMedia call).
     *
    * IDENTITY RULE:
    * - Use profile-first identity matching for stale self-socket detection:
    *   if both sides have profileId, only profileId decides sameness;
    *   otherwise fallback to userId only when both profileIds are absent.
     * - Device labels: Multiple users on the same physical machine share labels → false positives.
     */
    private isSelfLoopback(remote: RemotePeerStream): boolean {
        // Rule 1: socket-ID match — this is our own stream, definitely loopback.
        if (this.localSocketId && remote.peerId === this.localSocketId) {
            console.log('[RTC🔍 SERVICE] 🚫 Loopback Rule1: same socket ID', remote.peerId);
            return true;
        }

        // Rule 2: track-ID match — unique per getUserMedia() call, stable across renegotiations.
        if (this.localCameraStream) {
            const remoteTrackIds = remote.stream.getTracks().map(t => t.id);
            const localTrackIds = this.localCameraStream.getTracks().map(t => t.id);
            const hasMatchingTrack = remoteTrackIds.some(id => localTrackIds.includes(id));
            if (hasMatchingTrack) {
                console.log('[RTC🔍 SERVICE] 🚫 Loopback Rule2: matching track IDs', { remoteTrackIds, localTrackIds });
                return true;
            }
        }

        // Rule 3: same participant identity (profile-first fallback-to-user).
        if (this.isSameParticipantIdentity(this.localUserId, this.localProfileId, remote.userId, remote.profileId)) {
            console.log('[RTC🔍 SERVICE] 🚫 Loopback Rule3: same participant identity', {
                localUserId: this.localUserId,
                localProfileId: this.localProfileId,
                remoteUserId: remote.userId,
                remoteProfileId: remote.profileId,
            });
            return true;
        }

        // Rule 4: same clientId (same tab/session) when available.
        if (this.localClientId && remote.clientId && this.localClientId === remote.clientId) {
            console.log('[RTC🔍 SERVICE] 🚫 Loopback Rule4: same clientId', {
                localClientId: this.localClientId,
                remoteClientId: remote.clientId,
            });
            return true;
        }

        // Rule 5: same authenticated userId, even when profileIds differ (multi-tab / multi-window scenario).
        // Synthesized profileIds are formatted as "userId:role:...", "userId:name:...", or "userId:client:...".
        // When both sides share the same base userId and at least one side uses a synthesized profile,
        // they represent the same physical person in different tabs → treat as self-loopback.
        const localUid5 = String(this.localUserId ?? '').trim();
        const remoteUid5 = String(remote.userId ?? '').trim();
        if (localUid5 && remoteUid5 && localUid5 === remoteUid5 && !localUid5.startsWith('guest-')) {
            const localPid5 = String(this.localProfileId ?? '').trim();
            const remotePid5 = String(remote.profileId ?? '').trim();
            // A "real" platform profileId does NOT start with the userId as prefix.
            const localIsSynthesized = !localPid5 || localPid5.startsWith(localUid5 + ':');
            const remoteIsSynthesized = !remotePid5 || remotePid5.startsWith(remoteUid5 + ':');
            if (localIsSynthesized || remoteIsSynthesized) {
                // At least one side is using a synthesized (per-tab) profileId → same user, block loopback.
                console.log('[RTC🔍 SERVICE] 🚫 Loopback Rule5: same userId with synthesized profile (multi-tab)', {
                    localUserId: localUid5,
                    remoteUserId: remoteUid5,
                    localProfileId: localPid5 || '(none)',
                    remoteProfileId: remotePid5 || '(none)',
                });
                return true;
            }
            // Both sides have real (platform-issued) profileIds → genuine multi-profile coexistence, allow.
        }

        return false;
    }

    private setRemoteStreamScreenFlag(streamId: string, isScreen: boolean): void {
        for (const [key, value] of this.remoteStreams) {
            if (value.streamId === streamId && value.isScreen !== isScreen) {
                this.remoteStreams.set(key, { ...value, isScreen });
            }
        }
    }

    private removeRemoteStreamById(streamId: string) {
        for (const [key, info] of this.remoteStreams) {
            if (info.streamId === streamId) this.remoteStreams.delete(key);
        }
    }

    private reconcileRemoteTrackInStream(stream: MediaStream, incomingTrack: MediaStreamTrack, isScreen: boolean): void {
        const sameKindTracks = incomingTrack.kind === 'audio'
            ? stream.getAudioTracks()
            : stream.getVideoTracks();

        for (const existingTrack of sameKindTracks) {
            if (existingTrack.id === incomingTrack.id) {
                continue;
            }

            const shouldRemove = existingTrack.readyState !== 'live' || !isScreen;
            if (!shouldRemove) {
                continue;
            }

            try {
                stream.removeTrack(existingTrack);
            } catch {
                // best-effort
            }
        }
    }

    private cleanupRemoteStreamIfEmpty(peerId: string, streamId: string) {
        const info = [...this.remoteStreams.values()].find(s => s.peerId === peerId && s.streamId === streamId);
        if (!info) return;
        const hasLiveTracks = info.stream.getTracks().some(t => t.readyState !== 'ended');
        if (!hasLiveTracks) {
            this.removeRemoteStreamById(streamId);
            this.emitRemoteStreams();
        }
    }

    // private cleanup() {
    //     for (const { pc } of this.peers.values()) pc.close();
    //     this.peers.clear();
    //     this.remoteStreams.clear();
    //     this.remoteStreams$.next([]);

    //     this.localCameraStream?.getTracks().forEach(t => t.stop());
    //     this.localScreenStream?.getTracks().forEach(t => t.stop());
    //     this.localCameraStream = undefined;
    //     this.localScreenStream = undefined;
    // }

    cleanup() {
        console.log('🧹 Cleaning RTC resources...');

        this.iceServersFetched = false;
        this.iceServersFetchPromise = undefined;
        this.roomId = undefined;
        this.localSocketId = undefined;
        this.displayName = undefined;
        this.localUserId = undefined;
        this.localProfileId = undefined;
        this.reconnecting = false;
        this.usingGoogleStunFallback = false;

        // Persist mute/video-off state across cleanup so that when the user refreshes and
        // the service reconnects, the same mute/video state is re-applied automatically.
        // NOTE: audioEnabled / videoEnabled are intentionally NOT reset here.

        // Stop local streams
        this.localCameraStream?.getTracks().forEach(t => t.stop());
        this.localScreenStream?.getTracks().forEach(t => t.stop());
        this.localCameraStream = undefined;
        this.localScreenStream = undefined;
        this.localStream$.next(null);

        this.micProcessed = false;
        this.micOriginalTrack = undefined;
        this.micProcessedTrack = undefined;
        if (this.micGateInterval) {
            clearInterval(this.micGateInterval);
            this.micGateInterval = undefined;
        }
        if (this.micAudioContext) {
            this.micAudioContext.close().catch(() => undefined);
            this.micAudioContext = undefined;
        }

        // Close peer connections
        for (const peer of this.peers.values()) {
            if (peer.iceRestartTimer) {
                clearTimeout(peer.iceRestartTimer);
                peer.iceRestartTimer = undefined;
            }
            if (peer.negotiationTimer) {
                clearTimeout(peer.negotiationTimer);
                peer.negotiationTimer = undefined;
            }
            this.detachPeerMedia(peer);
            peer.pc.close();
        }
        this.peers.clear();

        // Clear remote streams
        this.remoteStreams.clear();
        this.remoteStreams$.next([]);
        this.screenStreamIds.clear();

        // Clear participant list
        this.participantIds.clear();
        this.participantIds$.next([]);

        this.peerDisplayNames.clear();
        this.peerSeenAt.clear();
        this.peerUserIds.clear();
        this.peerProfileIds.clear();
        this.peerClientIds.clear();
        this.lastRequestedMediaProfiles.clear();
        this.peerMediaStates.clear();
        this.peerMediaStates$.next(new Map());
        this.roomPresence$.next({
            roomId: '',
            connectedCount: 0,
            onlineCount: 0,
            participants: [],
        });

        // Disconnect socket
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = undefined;
        }

        console.log('✅ RTC cleanup complete');
    }

    private emitParticipantIds(): void {
        this.participantIds$.next([...this.participantIds.values()]);
    }

    stopCamera() {
        if (this.localCameraStream) {
            this.localCameraStream.getTracks().forEach(t => t.stop());
            this.localCameraStream = undefined;
            this.localStream$.next(null);
            console.log('🛑 Camera stopped');
        }
    }

    stopScreenShare() {
        if (this.localScreenStream) {
            const streamId = this.localScreenStream.id;
            this.localScreenStream.getTracks().forEach(t => t.stop());
            this.localScreenStream = undefined;
            this.socket?.emit('stop-screen-share', { roomId: this.roomId, streamId });
            this.screenStreamIds.delete(streamId);
            console.log('🛑 Screen share stopped manually');

            // Remove senders for the stopped tracks + renegotiate
            for (const peer of this.peers.values()) {
                const { pc } = peer;
                const screenSender = peer.screenVideoSender;
                if (screenSender) {
                    try { screenSender.replaceTrack(null); } catch { }
                    try { pc.removeTrack(screenSender); } catch { }
                    peer.screenVideoSender = undefined;
                }

                for (const sender of pc.getSenders()) {
                    if (sender.track && sender.track.kind === 'video' && sender.track.readyState === 'ended') {
                        try { pc.removeTrack(sender); } catch { }
                        if (peer.screenVideoSender === sender) {
                            peer.screenVideoSender = undefined;
                        }
                    }
                }
            }
            this.renegotiateAllPeers().catch(() => undefined);
        }
    }
}