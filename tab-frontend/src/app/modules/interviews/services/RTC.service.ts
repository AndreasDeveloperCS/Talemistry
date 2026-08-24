import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import io from 'socket.io-client';
import { environment } from "../../../../environments/environment";

type Socket = ReturnType<typeof io>;

interface PeerConnection {
    id: string;
    pc: RTCPeerConnection;
    streams: MediaStream[];
}

interface IceServerConfig {
    urls: string | string[];
    username?: string;
    credential?: string;
}

@Injectable({ providedIn: 'root' })
export class RTCService {
    private socket?: Socket;
    private roomId?: string;
    private localStream?: MediaStream;
    private localScreenStream?: MediaStream;
    private iceServers: IceServerConfig[] = [];
    private peers = new Map<string, PeerConnection>();
    private remoteStreams = new Map<string, MediaStream>();
    private remoteStreams$ = new BehaviorSubject<MediaStream[]>([]);
    private localStream$ = new BehaviorSubject<MediaStream | null>(null);

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

    async connect(token?: string) {
        console.log('RTCService connect', token);

        if (this.socket?.connected) {
            return;
        }
        const sameOriginBase = (() => {
            try {
                return (typeof window !== 'undefined' && window?.location?.origin)
                    ? String(window.location.origin).trim()
                    : '';
            } catch {
                return '';
            }
        })();

        const configuredBase = this.normalizeSocketBase(environment.wsBase);
        const normalizedSameOrigin = this.normalizeSocketBase(sameOriginBase);
        const shouldPreferSameOrigin = (() => {
            try {
                const hostname = new URL(normalizedSameOrigin).hostname.toLowerCase();
                return hostname === 'localhost' || hostname === '127.0.0.1' || normalizedSameOrigin === configuredBase;
            } catch {
                return false;
            }
        })();

        const base = shouldPreferSameOrigin
            ? (normalizedSameOrigin || configuredBase)
            : (configuredBase || normalizedSameOrigin);
        const rawPath = environment.wsPath || 'socket.io';
        const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

        this.socket = io(`${base}/ws/rtc`, {
            // Prefer WebSocket, but allow polling fallback to avoid noisy connection errors
            // when a proxy blocks WS upgrades.
            transports: ['websocket', 'polling'],
            path,
            auth: token ? { token } : undefined,
        });

        this.socket.on('connect', () => console.log('✅ Connected to signaling server'));

        // Try to fetch server-provided STUN/TURN config
        this.socket.on('connect', () => {
            this.socket?.emit('get-ice-servers', { allowGoogleStunFallback: false }, (ack: any) => {
                if (ack?.ok && Array.isArray(ack.iceServers) && ack.iceServers.length) {
                    this.iceServers = ack.iceServers;
                }
            });
        });

        this.socket.on('peer-joined', ({ socketId }: any) => this.onPeerJoined(socketId));
        this.socket.on('peer-left', ({ socketId }: any) => this.onPeerLeft(socketId));
        this.socket.on('offer', (data: any) => this.onOffer(data));
        this.socket.on('answer', (data: any) => this.onAnswer(data));
        this.socket.on('ice-candidate', (data: any) => this.onIceCandidate(data));

        this.socket.on('peer-started-screen', (e: any) => console.log('📺 Peer started screen', e));
        this.socket.on('peer-stopped-screen', (e: any) => console.log('🛑 Peer stopped screen', e));
    }

    async initLocalMedia(constraints: MediaStreamConstraints = { video: true, audio: true }) {
        console.log('🔁 RTCService initLocalMedia Reusing existing local stream', constraints);

        if (this.localStream && this.localStream.active) {
            console.log('🔁 Reusing existing local stream');
            return this.localStream;
        }
        console.log('🎥 Requesting new media stream...');
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.localStream$.next(this.localStream);
            return this.localStream;
        } catch (err) {
            console.error('❌ Failed to initialize media:', err);
            throw err;
        }
    }

    joinRoom(roomId: string) {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }
        this.roomId = roomId;

        this.socket.emit('join-room', { roomId }, async (ack: any) => {
            const peers: string[] = ack?.peers ?? [];
            for (const id of peers) {
                await this.createPeerConnection(id, true);
            }
        });
    }

    leaveRoom() {
        if (!this.socket || !this.roomId) return;
        this.socket.emit('leave-room', { roomId: this.roomId });
        this.cleanup();
    }

    getLocalStream$() {
        return this.localStream$.asObservable();
    }
    getRemoteStreams$() {
        return this.remoteStreams$.asObservable();
    }

    toggleAudio(enabled: boolean) {
        this.localStream?.getAudioTracks().forEach(t => t.enabled = enabled);
    }

    toggleVideo(enabled: boolean) {
        this.localStream?.getVideoTracks().forEach(t => t.enabled = enabled);
    }

    async startScreenShare() {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        this.localScreenStream = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        for (const { pc } of this.peers.values()) {
            pc.addTrack(screenTrack, screenStream);
        }

        this.socket?.emit('start-screen-share', { roomId: this.roomId, streamId: screenStream.id });
        await this.renegotiateAll();

        screenTrack.onended = async () => {
            for (const { pc } of this.peers.values()) {
                const sender = pc.getSenders().find(s => s.track === screenTrack);
                if (sender) pc.removeTrack(sender);
            }
            this.socket?.emit('stop-screen-share', { roomId: this.roomId, streamId: screenStream.id });
            this.localScreenStream = undefined;
            await this.renegotiateAll();
        };
    }

    // ----------- INTERNALS ------------

    private async createPeerConnection(remoteId: string, initiator: boolean) {
        if (!this.socket) {
            return;
        }
        const pc = new RTCPeerConnection({
            iceServers: this.iceServers,
        });

        // Attach local tracks
        this.localStream?.getTracks().forEach(track => pc.addTrack(track, this.localStream!));

        pc.onicecandidate = (event) => {
            if (event.candidate && this.roomId) {
                this.socket!.emit('ice-candidate', {
                    roomId: this.roomId,
                    to: remoteId,
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            const [stream] = event.streams;
            this.remoteStreams.set(remoteId, stream);
            this.remoteStreams$.next([...this.remoteStreams.values()]);
        };

        this.peers.set(remoteId, { id: remoteId, pc, streams: [] });

        if (initiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.socket!.emit('offer', { roomId: this.roomId, to: remoteId, sdp: offer });
        }
    }

    private async renegotiateAll() {
        if (!this.socket || !this.roomId) return;
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
        if (peer.pc.signalingState !== 'stable') return;

        const offer = await peer.pc.createOffer();
        await peer.pc.setLocalDescription(offer);
        this.socket.emit('offer', { roomId: this.roomId, to: remoteId, sdp: offer });
    }

    private async onPeerJoined(socketId: string) {
        await this.createPeerConnection(socketId, true);
    }

    private onPeerLeft(socketId: string) {
        const peer = this.peers.get(socketId);
        if (peer) {
            peer.pc.close();
            this.peers.delete(socketId);
            this.remoteStreams.delete(socketId);
            this.remoteStreams$.next([...this.remoteStreams.values()]);
        }
    }

    private async onOffer({ from, sdp }: any) {
        await this.createPeerConnection(from, false);
        const peer = this.peers.get(from);
        if (!peer) {
            return;
        }

        await peer.pc.setRemoteDescription(sdp);
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        this.socket!.emit('answer', {
            roomId: this.roomId, to: from, sdp: answer
        });
    }

    private async onAnswer({ from, sdp }: any) {
        const peer = this.peers.get(from);
        if (peer) {
            await peer.pc.setRemoteDescription(sdp);
        }
    }

    private async onIceCandidate({ from, candidate }: any) {
        const peer = this.peers.get(from);
        if (peer && candidate) {
            try {
                await peer.pc.addIceCandidate(candidate);
            } catch {

            }
        }
    }

    private cleanup() {
        for (const { pc } of this.peers.values()) {
            pc.close();
        }
        this.peers.clear();
        this.remoteStreams.clear();
        this.remoteStreams$.next([]);

        this.localStream?.getTracks().forEach(track => track.stop());
        this.localStream = undefined;
    }
}