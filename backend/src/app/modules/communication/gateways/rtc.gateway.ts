// src/interview-comm/rtc.gateway.ts
import {
    WebSocketGateway, WebSocketServer, SubscribeMessage,
    OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
    OnGatewayInit
} from '@nestjs/websockets';
import { Namespace, Server, Socket } from 'socket.io';
import { RoomsService } from '../services/rooms.service';
import { VideoChatRoomService } from '../services/video-chat-room.service';
import { VideoChatRoomType } from '../models/video-chat-room';

type JoinRoomPayload = { roomId: string; displayName?: string; userId?: string; profileId?: string; userEmail?: string; joinToken?: string; clientId?: string };

type SignalOfferPayload = {
    roomId: string;
    to: string; // target socketId
    sdp: RTCSessionDescriptionInit;
};

type SignalAnswerPayload = {
    roomId: string;
    to: string; // target socketId
    sdp: RTCSessionDescriptionInit;
};

type IceCandidatePayload = {
    roomId: string;
    to: string; // target socketId
    candidate: RTCIceCandidateInit;
};

type ScreenSharePayload = {
    roomId: string;
    streamId?: string;
};

type MediaProfile = 'high' | 'low';

type SetMediaProfilePayload = {
    roomId: string;
    to: string; // target socketId
    cameraVideo?: MediaProfile;
    screenVideo?: MediaProfile;
    audio?: MediaProfile;
};

type RoomPresenceParticipant = {
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
};

type RoomPresenceSnapshot = {
    roomId: string;
    connectedCount: number;
    onlineCount: number;
    participants: RoomPresenceParticipant[];
};


@WebSocketGateway({
    namespace: '/ws/rtc',
    transports: ['websocket', 'polling']
    // path: '/sockets/rtc',
    // cors: {
    //     origin: ['https://evryka.org', 'https://tap.evryka.org'],
    //     credentials: true,
    // },
})
export class RTCGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    // When using a namespace gateway, we must query/emit within that namespace.
    // Nest provides the namespace instance in afterInit.
    private nsp?: Namespace;
    private readonly socketDisplayNames = new Map<string, string>();
    private readonly socketUserIds = new Map<string, string>();
    private readonly socketProfileIds = new Map<string, string>();
    private readonly socketClientIds = new Map<string, string>();
    private readonly socketUserEmails = new Map<string, string>();

    // Track per-socket media state so new joiners / reconnectors can restore peer states.
    // { socketId → { audioEnabled, videoEnabled } }
    private readonly socketMediaState = new Map<string, { audioEnabled: boolean; videoEnabled: boolean }>();

    constructor(
        private readonly rooms: RoomsService,
        private readonly videoChatRooms: VideoChatRoomService,
    ) { }

    private parseUrlList(value: unknown, fallback: string[]): string[] {
        if (typeof value !== 'string') return fallback;
        if (value.trim() === '') return [];
        const items = value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        return items.length > 0 ? items : fallback;
    }

    private parseBool(value: unknown, fallback: boolean): boolean {
        if (typeof value !== 'string') return fallback;
        const v = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'on', 't'].includes(v)) return true;
        if (['0', 'false', 'no', 'off', 'f'].includes(v)) return false;
        return fallback;
    }

    private buildIceServers(options?: { includeGoogleStunFallback?: boolean }): RTCIceServer[] {
        // Single source of truth: backend .env.
        // Do not hardcode STUN/TURN defaults here.

        const includeGoogleStunFallback = !!options?.includeGoogleStunFallback;

        // Primary STUN: required by product spec.
        // Can be overridden for other deployments via env.
        const primaryStunUrl = String(process.env.RTC_STUN_PRIMARY_URL ?? 'stun:evryka.org:3478').trim();

        const STUN_URLS = [
            'stun:evryka.org:3478',
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302',
        ];

        const isGoogleStun = (url: string): boolean => {
            const u = String(url || '').trim().toLowerCase();
            return STUN_URLS.some((g) => u.startsWith(g));
        };

        const stunEnabled = this.parseBool(process.env.RTC_STUN_ENABLED, true);
        let stunUrls = stunEnabled
            ? this.parseUrlList(process.env.RTC_STUN_URLS, [])
            : [];

        // Enforce product rule: do not use Google STUN unless explicitly requested.
        if (stunEnabled && !includeGoogleStunFallback) {
            stunUrls = stunUrls.filter((u) => !isGoogleStun(u));
        }

        const turnEnabled = this.parseBool(process.env.RTC_TURN_ENABLED, false);
        const turnUsername = process.env.RTC_TURN_USERNAME;
        const turnCredential = process.env.RTC_TURN_PASSWORD;
        const turnUrls = this.parseUrlList(process.env.RTC_TURN_URLS, []);

        // Force primary STUN to be first when STUN is enabled.
        if (stunEnabled && primaryStunUrl) {
            const hasPrimary = stunUrls.some((u) => String(u || '').trim().toLowerCase().startsWith(primaryStunUrl.toLowerCase()));
            if (!hasPrimary) {
                stunUrls = [primaryStunUrl, ...stunUrls];
            } else {
                // Ensure it is first.
                stunUrls = [
                    ...stunUrls.filter((u) => String(u || '').trim().toLowerCase().startsWith(primaryStunUrl.toLowerCase())),
                    ...stunUrls.filter((u) => !String(u || '').trim().toLowerCase().startsWith(primaryStunUrl.toLowerCase())),
                ];
            }
        }

        // Only add Google STUN when explicitly requested by the client.
        if (stunEnabled && includeGoogleStunFallback) {
            stunUrls = [...stunUrls, ...STUN_URLS];
        }

        // De-duplicate while preserving order.
        const seen = new Set<string>();
        stunUrls = stunUrls.filter((u) => {
            const key = String(u || '').trim();
            if (!key) return false;
            const k = key.toLowerCase();
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });

        // Prefer non-Google STUN first, keep Google as last-resort fallback.
        stunUrls = [...stunUrls.filter((u) => !isGoogleStun(u)), ...stunUrls.filter((u) => isGoogleStun(u))];

        const iceServers: RTCIceServer[] = [];
        for (const url of stunUrls) {
            iceServers.push({ urls: url });
        }

        if (turnEnabled) {
            if (!turnUsername || !turnCredential) {
                console.warn('⚠️ RTC_TURN_ENABLED=true but RTC_TURN_USERNAME/RTC_TURN_PASSWORD are not set; TURN will be omitted.');
                return iceServers;
            }
            if (!turnUrls.length) {
                console.warn('⚠️ RTC_TURN_ENABLED=true but RTC_TURN_URLS is empty; TURN will be omitted.');
                return iceServers;
            }
            for (const url of turnUrls) {
                iceServers.push({ urls: url, username: turnUsername, credential: turnCredential });
            }
        }

        return iceServers;
    }

    private get io(): Namespace | Server {
        return this.nsp ?? this.server;
    }

    private normalizeEmail(value: unknown): string {
        return String(value ?? '').trim().toLowerCase();
    }

    private buildPresenceParticipantKey(input: {
        userId?: string;
        profileId?: string;
        email?: string;
        clientId?: string;
        socketId?: string;
        fallback?: string;
    }): string {
        const profileId = String(input.profileId ?? '').trim();
        if (profileId) return `profile:${profileId}`;

        const userId = String(input.userId ?? '').trim();
        if (userId) return `user:${userId}`;

        const email = this.normalizeEmail(input.email);
        if (email) return `email:${email}`;

        const clientId = String(input.clientId ?? '').trim();
        if (clientId) return `client:${clientId}`;

        const socketId = String(input.socketId ?? '').trim();
        if (socketId) return `socket:${socketId}`;

        return String(input.fallback ?? '').trim() || 'participant:unknown';
    }

    private getNamespaceSocketIds(): string[] {
        try {
            const sockets = (this.nsp as any)?.sockets;
            if (sockets && typeof sockets.keys === 'function') {
                return [...sockets.keys()];
            }
        } catch {
            // best-effort
        }
        return [];
    }

    private matchesStoredParticipant(socketId: string, participant: any): boolean {
        const participantUserId = String(participant?.userId ?? '').trim();
        const socketUserId = String(this.socketUserIds.get(socketId) ?? '').trim();
        if (participantUserId && socketUserId && participantUserId === socketUserId) {
            return true;
        }

        const participantEmail = this.normalizeEmail(participant?.email);
        const socketEmail = this.normalizeEmail(this.socketUserEmails.get(socketId));
        if (participantEmail && socketEmail && participantEmail === socketEmail) {
            return true;
        }

        return false;
    }

    private getSocketDisplayName(socketId: string, fallback?: string): string | undefined {
        const displayName = String(this.socketDisplayNames.get(socketId) ?? '').trim();
        if (displayName) return displayName;

        const email = this.normalizeEmail(this.socketUserEmails.get(socketId));
        if (email) return email;

        const nextFallback = String(fallback ?? '').trim();
        return nextFallback || undefined;
    }

    private async buildRoomPresenceSnapshot(roomId: string): Promise<RoomPresenceSnapshot> {
        const normalizedRoomId = String(roomId ?? '').trim().toLowerCase();
        const roomSockets = new Set<string>(await (this.io as any).in(normalizedRoomId).allSockets());
        const namespaceSockets = new Set<string>(this.getNamespaceSocketIds());
        const room = await this.videoChatRooms.getByIdRawAsync(normalizedRoomId);

        const participants = new Map<string, RoomPresenceParticipant>();

        const upsertParticipant = (entry: RoomPresenceParticipant) => {
            const existing = participants.get(entry.participantKey);
            if (!existing) {
                participants.set(entry.participantKey, entry);
                return;
            }

            participants.set(entry.participantKey, {
                ...existing,
                ...entry,
                socketId: entry.inRoom && entry.socketId ? entry.socketId : (existing.socketId || entry.socketId),
                displayName: entry.displayName || existing.displayName,
                email: entry.email || existing.email,
                role: entry.role || existing.role,
                invited: existing.invited || entry.invited,
                inRoom: existing.inRoom || entry.inRoom,
                online: existing.online || entry.online,
                audioEnabled: entry.inRoom ? entry.audioEnabled : existing.audioEnabled,
                videoEnabled: entry.inRoom ? entry.videoEnabled : existing.videoEnabled,
            });
        };

        for (const storedParticipant of (room as any)?.participants ?? []) {
            const matchedRoomSocketId = [...roomSockets].find((socketId) => this.matchesStoredParticipant(socketId, storedParticipant));
            const matchedOnlineSocketId = matchedRoomSocketId
                ?? [...namespaceSockets].find((socketId) => this.matchesStoredParticipant(socketId, storedParticipant));
            const mediaState = matchedRoomSocketId
                ? (this.socketMediaState.get(matchedRoomSocketId) ?? { audioEnabled: true, videoEnabled: true })
                : { audioEnabled: false, videoEnabled: false };

            const userId = String(storedParticipant?.userId ?? '').trim() || undefined;
            const email = this.normalizeEmail(storedParticipant?.email) || undefined;
            const participantKey = this.buildPresenceParticipantKey({
                userId,
                email,
                socketId: matchedRoomSocketId || matchedOnlineSocketId,
                fallback: `stored:${normalizedRoomId}:${email || userId || participants.size}`,
            });

            upsertParticipant({
                participantKey,
                socketId: matchedRoomSocketId || undefined,
                userId,
                profileId: matchedRoomSocketId ? String(this.socketProfileIds.get(matchedRoomSocketId) ?? '').trim() || undefined : undefined,
                clientId: matchedRoomSocketId ? String(this.socketClientIds.get(matchedRoomSocketId) ?? '').trim() || undefined : undefined,
                email,
                displayName: this.getSocketDisplayName(matchedRoomSocketId || matchedOnlineSocketId || '', String(storedParticipant?.name ?? '').trim() || email),
                role: String(storedParticipant?.role ?? '').trim() || undefined,
                invited: true,
                inRoom: !!matchedRoomSocketId,
                online: !!matchedOnlineSocketId,
                audioEnabled: mediaState.audioEnabled,
                videoEnabled: mediaState.videoEnabled,
            });
        }

        for (const socketId of roomSockets) {
            const userId = String(this.socketUserIds.get(socketId) ?? '').trim() || undefined;
            const profileId = String(this.socketProfileIds.get(socketId) ?? '').trim() || undefined;
            const clientId = String(this.socketClientIds.get(socketId) ?? '').trim() || undefined;
            const email = this.normalizeEmail(this.socketUserEmails.get(socketId)) || undefined;
            const mediaState = this.socketMediaState.get(socketId) ?? { audioEnabled: true, videoEnabled: true };
            const participantKey = this.buildPresenceParticipantKey({
                userId,
                profileId,
                email,
                clientId,
                socketId,
                fallback: `live:${normalizedRoomId}:${socketId}`,
            });

            upsertParticipant({
                participantKey,
                socketId,
                userId,
                profileId,
                clientId,
                email,
                displayName: this.getSocketDisplayName(socketId, undefined),
                invited: participants.has(participantKey),
                inRoom: true,
                online: true,
                audioEnabled: mediaState.audioEnabled,
                videoEnabled: mediaState.videoEnabled,
            });
        }

        const sortedParticipants = [...participants.values()].sort((left, right) => {
            if (left.inRoom !== right.inRoom) return left.inRoom ? -1 : 1;
            if (left.online !== right.online) return left.online ? -1 : 1;
            if (left.invited !== right.invited) return left.invited ? -1 : 1;
            return String(left.displayName || left.email || left.participantKey)
                .localeCompare(String(right.displayName || right.email || right.participantKey));
        });

        return {
            roomId: normalizedRoomId,
            connectedCount: sortedParticipants.filter((participant) => participant.inRoom).length,
            onlineCount: sortedParticipants.filter((participant) => participant.online).length,
            participants: sortedParticipants,
        };
    }

    private async emitRoomPresence(roomId: string): Promise<RoomPresenceSnapshot> {
        const snapshot = await this.buildRoomPresenceSnapshot(roomId);
        (this.io as any).to(snapshot.roomId).emit('room-presence', snapshot);
        return snapshot;
    }

    private async roomPeersFromSocketIo(roomId: string, exceptSocketId: string): Promise<string[]> {
        const sockets = await (this.io as any).in(roomId).allSockets();
        return [...sockets].filter((id) => id !== exceptSocketId);
    }

    private async isSocketInRoom(roomId: string, socketId: string): Promise<boolean> {
        const sockets = await (this.io as any).in(roomId).allSockets();
        return sockets.has(socketId);
    }

    private isValidMediaProfile(value: unknown): value is MediaProfile {
        return value === 'high' || value === 'low';
    }

    afterInit(nsp: Namespace) {
        this.nsp = nsp;
        console.log('✅ RTCGateway initialized at namespace:', nsp.name);
    }

    handleConnection(client: Socket) {
        const transport = (client as any)?.conn?.transport?.name;
        const origin = String((client as any)?.handshake?.headers?.origin ?? '').trim();
        const ua = String((client as any)?.handshake?.headers?.['user-agent'] ?? '').trim();
        console.log('[RTC🔍 GATEWAY] handleConnection', {
            socketId: client.id,
            transport,
            origin: origin || undefined,
            userAgent: ua ? ua.slice(0, 120) : undefined,
            totalConnectedSockets: (this.io as any)?.sockets?.size ?? 'N/A',
        });
    }

    async handleDisconnect(client: Socket) {
        const userId = this.socketUserIds.get(client.id);
        const profileId = this.socketProfileIds.get(client.id);
        const displayName = this.socketDisplayNames.get(client.id);
        console.log('[RTC🔍 GATEWAY] handleDisconnect', {
            socketId: client.id,
            userId: userId || undefined,
            profileId: profileId || undefined,
            displayName: displayName || undefined,
        });
        this.socketDisplayNames.delete(client.id);
        this.socketUserIds.delete(client.id);
        this.socketProfileIds.delete(client.id);
        this.socketClientIds.delete(client.id);
        this.socketUserEmails.delete(client.id);
        this.socketMediaState.delete(client.id);

        // Use RoomsService as source of truth (socket.io may already have cleared socket.rooms).
        const roomIds = this.rooms.leaveAll(client.id);
        console.log('[RTC🔍 GATEWAY] disconnect leaveAll rooms:', roomIds);
        for (const roomId of roomIds) {
            (this.io as any).to(roomId).emit('peer-left', { socketId: client.id });
            await this.emitRoomPresence(roomId);
        }
    }

    @SubscribeMessage('join-room')
    async onJoinRoom(
        @MessageBody() data: JoinRoomPayload,
        @ConnectedSocket() client: Socket,
    ) {
        const roomId = String(data?.roomId ?? '').trim().toLowerCase();
        if (!roomId) return { ok: false, error: 'roomId is required' };

        // Helps debug mobile/proxy behavior: if websocket is blocked, clients may fall back to polling.
        const transport = (client as any)?.conn?.transport?.name;
        console.log('[RTC🔍 GATEWAY] join-room START', {
            socketId: client.id,
            roomId,
            transport,
            userId: (data as any)?.userId || undefined,
            profileId: (data as any)?.profileId || undefined,
            clientId: (data as any)?.clientId || undefined,
            displayName: data?.displayName || undefined,
        });

        // Optional stable identity (from platform JWT/session).
        // If a profileId exists, prefer it for de-duping so multiple profiles under the same
        // account can join the same room concurrently.
        const userId = String((data as any)?.userId ?? '').trim();
        const profileId = String((data as any)?.profileId ?? '').trim();
        const userEmail = String((data as any)?.userEmail ?? '').trim().toLowerCase();
        const joinToken = String((data as any)?.joinToken ?? '').trim();
        const clientId = String((data as any)?.clientId ?? '').trim();

        // Enforce room access rules at the signaling layer.
        // - DIRECT: only the 2 participants may join
        // - GROUP: joinable only when isOpenMeeting=true OR user is already a participant
        // - STAGE: keep existing behavior (auto-admit)
        try {
            const room = await this.videoChatRooms.getByIdRawAsync(roomId);
            if (!room) {
                console.warn('[RTC🔍 GATEWAY] join-room denied: room not found', { roomId, socketId: client.id });
                return { ok: false, error: 'room not found' };
            }

            const type = String((room as any)?.type ?? '').trim();
            const isOpenMeeting = !!(room as any)?.isOpenMeeting;
            const isGroupRoom = type === VideoChatRoomType.GROUP;
            const isStageRoom = type === VideoChatRoomType.STAGE;
            const isDirectRoom = type === VideoChatRoomType.DIRECT;

            let allowed = false;

            if (isStageRoom) {
                allowed = true;
            }
            else {
                try {
                    await this.videoChatRooms.joinRoomByTokenAsync(roomId, userEmail || undefined, joinToken || undefined);
                    allowed = true;
                } catch {
                    if (isGroupRoom && isOpenMeeting) {
                        allowed = true;
                    }
                    else if (userId) {
                        const createdBy = String((room as any)?.createdBy ?? '').trim();
                        if (createdBy && createdBy === userId) {
                            allowed = true;
                        }
                        else {
                            const participants = (room as any)?.participants ?? [];
                            allowed = participants.some((p: any) => String(p?.userId ?? '').trim() === userId);
                        }
                    }
                }
            }

            if (!allowed) {
                console.warn('[RTC🔍 GATEWAY] join-room denied: forbidden', {
                    roomId,
                    socketId: client.id,
                    type,
                    isOpenMeeting,
                    userId: userId || '(none)',
                    profileId: profileId || '(none)',
                    userEmail: userEmail || '(none)',
                    hasJoinToken: !!joinToken,
                    isDirectRoom,
                });
                return { ok: false, error: 'forbidden' };
            }
        } catch (e: any) {
            console.error('[RTC🔍 GATEWAY] join-room access check failed', { roomId, error: e?.message ?? e });
            return { ok: false, error: 'forbidden' };
        }

        if (userId) {
            this.socketUserIds.set(client.id, userId);
        }
        else {
            this.socketUserIds.delete(client.id);
        }

        if (profileId) {
            this.socketProfileIds.set(client.id, profileId);
        }
        else {
            this.socketProfileIds.delete(client.id);
        }

        if (clientId) {
            this.socketClientIds.set(client.id, clientId);
        }
        else {
            this.socketClientIds.delete(client.id);
        }

        if (userEmail) {
            this.socketUserEmails.set(client.id, userEmail);
        }
        else {
            this.socketUserEmails.delete(client.id);
        }

        // Identity key for duplicate-socket detection.
        // Prefer profileId, then userId, then clientId.
        // clientId is a reliable same-tab/session fallback when user/profile metadata
        // is temporarily unavailable, and helps evict ghost stale sockets.
        const identityKey = profileId || userId || clientId;
        const identityKind: 'profileId' | 'userId' | 'clientId' | '' = profileId
            ? 'profileId'
            : (userId ? 'userId' : (clientId ? 'clientId' : ''));

        console.log('[RTC🔍 GATEWAY] dedup check', {
            identityKey: identityKey || '(none - guest)',
            identityKind: identityKind || '(none)',
            socketId: client.id,
            roomId,
        });

        if (identityKey) {

            try {
                const socketsInRoom = await (this.io as any).in(roomId).allSockets();
                console.log('[RTC🔍 GATEWAY] existing sockets in room before dedup:', {
                    roomId,
                    count: socketsInRoom.size,
                    socketIds: [...socketsInRoom],
                    theirUserIds: [...socketsInRoom].map(sid => this.socketUserIds.get(sid) || '(none)'),
                    theirProfileIds: [...socketsInRoom].map(sid => this.socketProfileIds.get(sid) || '(none)'),
                });
                for (const existingSocketId of socketsInRoom) {
                    if (!existingSocketId || existingSocketId === client.id) continue;

                    const existingProfileId = String(this.socketProfileIds.get(existingSocketId) ?? '').trim();
                    const existingUserId = String(this.socketUserIds.get(existingSocketId) ?? '').trim();
                    const existingClientId = String(this.socketClientIds.get(existingSocketId) ?? '').trim();

                    // Highest-priority duplicate rule: same clientId = same browser tab/session.
                    const sameClient = !!clientId && !!existingClientId && existingClientId === clientId;

                    // Profile-first participant identity rule.
                    const sameProfile = !!profileId && !!existingProfileId && existingProfileId === profileId;
                    const sameUserWhenNoProfiles = !!userId
                        && !!existingUserId
                        && !profileId
                        && !existingProfileId
                        && existingUserId === userId;

                    const matches = sameClient || sameProfile || sameUserWhenNoProfiles
                        || (identityKind === 'clientId' && !!identityKey && existingClientId === identityKey)
                        || (identityKind === 'profileId' && !!identityKey && existingProfileId === identityKey)
                        || (identityKind === 'userId' && !!identityKey && existingUserId === identityKey);

                    if (matches) {
                        console.warn('[RTC🔍 GATEWAY] ⚠️ KICKING duplicate socket', {
                            roomId,
                            identityKey,
                            identityKind,
                            oldSocketId: existingSocketId,
                            oldUserId: this.socketUserIds.get(existingSocketId),
                            oldProfileId: this.socketProfileIds.get(existingSocketId),
                            newSocketId: client.id,
                        });

                        // Remove old socket from our in-memory rooms tracker.
                        this.rooms.leave(roomId, existingSocketId);

                        // Ask Socket.IO to remove the old socket from the room and disconnect.
                        const existingSocket: any = (this.io as any).sockets?.get?.(existingSocketId)
                            ?? (this.nsp as any)?.sockets?.get?.(existingSocketId);

                        try { await existingSocket?.leave?.(roomId); } catch { }

                        // Notify peers that the old connection is gone.
                        (this.io as any).to(roomId).emit('peer-left', { socketId: existingSocketId });

                        // Disconnect the old socket to fully stop media/signaling.
                        try { existingSocket?.disconnect?.(true); } catch { }

                        // Clean up maps.
                        this.socketDisplayNames.delete(existingSocketId);
                        this.socketUserIds.delete(existingSocketId);
                        this.socketProfileIds.delete(existingSocketId);
                        this.socketClientIds.delete(existingSocketId);
                        this.socketUserEmails.delete(existingSocketId);
                        this.socketMediaState.delete(existingSocketId);
                    }
                }
            } catch (e) {
                // Best-effort: failure here should not prevent joining.
                console.warn('⚠️ Failed to enforce single-socket-per-user policy', e);
            }
        }

        const displayName = String(data?.displayName ?? '').trim();
        if (displayName) {
            this.socketDisplayNames.set(client.id, displayName);
        } else {
            this.socketDisplayNames.delete(client.id);
        }

        client.join(roomId);
        this.rooms.join(roomId, client.id);

        // IMPORTANT: Use Socket.IO's room membership as the source of truth.
        // This avoids issues where an in-memory tracker can become stale/out-of-sync
        // and clients end up connecting to nobody (or to themselves).
        let peers = await this.roomPeersFromSocketIo(roomId, client.id);

        // Defense-in-depth: filter out any stale sockets that belong to the SAME user
        // (e.g. old socket lingering after page refresh despite the kick attempt above).
        if (userId || profileId) {
            const beforeFilter = peers.length;
            peers = peers.filter((peerId) => {
                const peerProfileId = String(this.socketProfileIds.get(peerId) ?? '').trim();
                const peerUserId = String(this.socketUserIds.get(peerId) ?? '').trim();
                const peerClientId = String(this.socketClientIds.get(peerId) ?? '').trim();

                // Highest-priority self-filter: same clientId means same browser tab/session.
                if (clientId && peerClientId && peerClientId === clientId) {
                    return false;
                }

                // Multi-profile rule:
                // - If both sides have profileId, only same profile is considered stale-self.
                // - If both sides lack profileId, fall back to userId.
                if (profileId && peerProfileId) {
                    return peerProfileId !== profileId;
                }

                if (!profileId && !peerProfileId && userId && peerUserId) {
                    return peerUserId !== userId;
                }

                if (!profileId && !peerProfileId && !userId && !peerUserId && clientId && peerClientId) {
                    return peerClientId !== clientId;
                }

                return true;
            });
            if (beforeFilter !== peers.length) {
                console.warn('[RTC🔍 GATEWAY] self-filter removed stale peers:', { before: beforeFilter, after: peers.length });
            }
        }

        console.log('[RTC🔍 GATEWAY] join-room COMPLETE', {
            socketId: client.id,
            roomId,
            peerCount: peers.length,
            peerIds: peers,
            peerUserIds: peers.map(p => this.socketUserIds.get(p) || '(none)'),
            peerProfileIds: peers.map(p => this.socketProfileIds.get(p) || '(none)'),
            peerDisplayNames: peers.map(p => this.socketDisplayNames.get(p) || '(none)'),
        });

        const peerDisplayNames: Record<string, string> = {};
        for (const peerId of peers) {
            const peerName = this.socketDisplayNames.get(peerId);
            if (peerName) {
                peerDisplayNames[peerId] = peerName;
            }
        }

        const peerUserIds: Record<string, string> = {};
        for (const peerId of peers) {
            const peerUserId = this.socketUserIds.get(peerId);
            if (peerUserId) {
                peerUserIds[peerId] = peerUserId;
            }
        }

        const peerProfileIds: Record<string, string> = {};
        for (const peerId of peers) {
            const peerProfileId = this.socketProfileIds.get(peerId);
            if (peerProfileId) {
                peerProfileIds[peerId] = peerProfileId;
            }
        }

        const peerClientIds: Record<string, string> = {};
        for (const peerId of peers) {
            const peerClientId = this.socketClientIds.get(peerId);
            if (peerClientId) {
                peerClientIds[peerId] = peerClientId;
            }
        }

        // Collect existing peers' media state so the new joiner can show correct
        // mute/video-off indicators immediately (and so the new joiner can restore
        // their own state if they are reconnecting after a page refresh).
        const peerMediaStates: Record<string, { audioEnabled: boolean; videoEnabled: boolean }> = {};
        for (const peerId of peers) {
            const state = this.socketMediaState.get(peerId);
            if (state) {
                peerMediaStates[peerId] = state;
            }
        }

        const myUserId = this.socketUserIds.get(client.id);
        const myProfileId = this.socketProfileIds.get(client.id);
        const roomPresence = await this.buildRoomPresenceSnapshot(roomId);

        client.to(roomId).emit('peer-joined', {
            socketId: client.id,
            displayName: displayName || undefined,
            userId: myUserId || undefined,
            profileId: myProfileId || undefined,
            clientId: this.socketClientIds.get(client.id) || undefined,
        });
        console.log('[RTC🔍 GATEWAY] emitted peer-joined to room', { roomId, socketId: client.id, userId: myUserId, profileId: myProfileId });

        await this.emitRoomPresence(roomId);

        return { ok: true, roomId, peers, peerDisplayNames, peerUserIds, peerProfileIds, peerClientIds, peerMediaStates, roomPresence };
    }

    @SubscribeMessage('leave-room')
    async onLeaveRoom(
        @MessageBody() data: JoinRoomPayload,
        @ConnectedSocket() client: Socket,
    ) {
        const roomId = String(data?.roomId ?? '').trim().toLowerCase();
        if (!roomId) return { ok: false, error: 'roomId is required' };
        console.log('[RTC🔍 GATEWAY] leave-room', { socketId: client.id, roomId });

        if (!this.rooms.has(roomId, client.id)) {
            console.log('[RTC🔍 GATEWAY] leave-room: already not in room (idempotent)');
            // Idempotent leave
            return { ok: true };
        }

        client.leave(roomId);
        this.rooms.leave(roomId, client.id);
        client.to(roomId).emit('peer-left', { socketId: client.id });
        await this.emitRoomPresence(roomId);
        return { ok: true };
    }

    @SubscribeMessage('offer')
    async onOffer(
        @MessageBody() data: SignalOfferPayload,
        @ConnectedSocket() client: Socket,
    ) {
        if (!data?.to) return { ok: false, error: '"to" is required' };

        const roomId = String(data?.roomId ?? '').trim().toLowerCase();
        if (!roomId) return { ok: false, error: 'roomId is required' };

        const senderInRoom = await this.isSocketInRoom(roomId, client.id);
        if (!senderInRoom) return { ok: false, error: 'sender not in room' };

        const targetInRoom = await this.isSocketInRoom(roomId, data.to);
        if (!targetInRoom) return { ok: false, error: 'target not in room' };

        console.log('[RTC🔍 GATEWAY] offer', { from: client.id, to: data.to, roomId, senderInRoom, targetInRoom });
        (this.io as any).to(data.to).emit('offer', { from: client.id, sdp: data.sdp });
        return { ok: true };
    }

    @SubscribeMessage('answer')
    async onAnswer(
        @MessageBody() data: SignalAnswerPayload,
        @ConnectedSocket() client: Socket,
    ) {
        if (!data?.to) return { ok: false, error: '"to" is required' };

        const roomId = String(data?.roomId ?? '').trim().toLowerCase();
        if (!roomId) return { ok: false, error: 'roomId is required' };

        const senderInRoom = await this.isSocketInRoom(roomId, client.id);
        if (!senderInRoom) return { ok: false, error: 'sender not in room' };

        const targetInRoom = await this.isSocketInRoom(roomId, data.to);
        if (!targetInRoom) return { ok: false, error: 'target not in room' };

        console.log('[RTC🔍 GATEWAY] answer', { from: client.id, to: data.to, roomId, senderInRoom, targetInRoom });
        (this.io as any).to(data.to).emit('answer', { from: client.id, sdp: data.sdp });
        return { ok: true };
    }

    @SubscribeMessage('ice-candidate')
    async onIceCandidate(
        @MessageBody() data: IceCandidatePayload,
        @ConnectedSocket() client: Socket,
    ) {
        if (!data?.to) return { ok: false, error: '"to" is required' };

        const roomId = String(data?.roomId ?? '').trim().toLowerCase();
        if (!roomId) return { ok: false, error: 'roomId is required' };

        const senderInRoom = await this.isSocketInRoom(roomId, client.id);
        if (!senderInRoom) return { ok: false, error: 'sender not in room' };

        const targetInRoom = await this.isSocketInRoom(roomId, data.to);
        if (!targetInRoom) return { ok: false, error: 'target not in room' };

        (this.io as any).to(data.to).emit('ice-candidate', {
            from: client.id,
            candidate: data.candidate,
        });
        return { ok: true };
    }

    @SubscribeMessage('start-screen-share')
    async onStartScreenShare(
        @MessageBody() data: ScreenSharePayload,
        @ConnectedSocket() client: Socket,
    ) {
        const roomId = String(data?.roomId ?? '').trim().toLowerCase();
        if (!roomId) return { ok: false, error: 'roomId is required' };
        const senderInRoom = await this.isSocketInRoom(roomId, client.id);
        if (!senderInRoom) return { ok: false, error: 'sender not in room' };

        console.log(`🖥️ ${client.id} started screen sharing in room ${roomId}`);
        client.to(roomId).emit('peer-started-screen', { socketId: client.id, streamId: data?.streamId });
        return { ok: true };
    }

    @SubscribeMessage('stop-screen-share')
    async onStopScreenShare(
        @MessageBody() data: ScreenSharePayload,
        @ConnectedSocket() client: Socket,
    ) {
        const roomId = String(data?.roomId ?? '').trim().toLowerCase();
        if (!roomId) return { ok: false, error: 'roomId is required' };
        const senderInRoom = await this.isSocketInRoom(roomId, client.id);
        if (!senderInRoom) return { ok: false, error: 'sender not in room' };

        console.log(`🛑 ${client.id} stopped screen sharing in room ${roomId}`);
        client.to(roomId).emit('peer-stopped-screen', { socketId: client.id, streamId: data?.streamId });
        return { ok: true };
    }

    @SubscribeMessage('set-media-profile')
    async onSetMediaProfile(
        @MessageBody() data: SetMediaProfilePayload,
        @ConnectedSocket() client: Socket,
    ) {
        if (!data?.to) return { ok: false, error: '"to" is required' };

        const roomId = String(data?.roomId ?? '').trim().toLowerCase();
        if (!roomId) return { ok: false, error: 'roomId is required' };

        const senderInRoom = await this.isSocketInRoom(roomId, client.id);
        if (!senderInRoom) return { ok: false, error: 'sender not in room' };

        const targetInRoom = await this.isSocketInRoom(roomId, data.to);
        if (!targetInRoom) return { ok: false, error: 'target not in room' };

        const cameraVideo = this.isValidMediaProfile(data.cameraVideo) ? data.cameraVideo : undefined;
        const screenVideo = this.isValidMediaProfile(data.screenVideo) ? data.screenVideo : undefined;
        const audio = this.isValidMediaProfile(data.audio) ? data.audio : undefined;

        // Relay to target: "Please send me this quality" (mesh).
        (this.io as any).to(data.to).emit('media-profile', {
            from: client.id,
            cameraVideo,
            screenVideo,
            audio,
        });

        return { ok: true };
    }

    // Request ICE server configuration from server
    @SubscribeMessage('get-ice-servers')
    onGetIceServers(
        @MessageBody() data: { allowGoogleStunFallback?: boolean } | undefined,
        @ConnectedSocket() client: Socket,
    ) {
        const allowGoogleStunFallback = !!data?.allowGoogleStunFallback;
        const iceServers = this.buildIceServers({ includeGoogleStunFallback: allowGoogleStunFallback });
        const urls = iceServers
            .flatMap((s: any) => Array.isArray(s?.urls) ? s.urls : [s?.urls])
            .filter((u: any) => typeof u === 'string')
            .map((u: string) => u.trim())
            .filter(Boolean);
        console.log(`🌐 Sending ICE servers to ${client.id}`, {
            count: iceServers.length,
            allowGoogleStunFallback,
            urls,
        });
        return { ok: true, iceServers };
    }

    // ── Media state synchronization ──────────────────────────────────────────
    // Clients report their audio/video enabled state so the server can:
    //  1. Relay it to other peers (mute/video-off indicators).
    //  2. Include it in the join-room ACK so reconnecting clients & new joiners
    //     know the current state of every participant immediately.
    //  3. Persist the state server-side so a page-refresh client can recover it.

    @SubscribeMessage('set-media-state')
    async onSetMediaState(
        @MessageBody() data: { roomId: string; audioEnabled?: boolean; videoEnabled?: boolean },
        @ConnectedSocket() client: Socket,
    ) {
        const roomId = String(data?.roomId ?? '').trim().toLowerCase();
        if (!roomId) return { ok: false, error: 'roomId is required' };

        console.log('[RTC🔍 GATEWAY] set-media-state', {
            socketId: client.id,
            roomId,
            audioEnabled: data?.audioEnabled,
            videoEnabled: data?.videoEnabled,
        });

        const audioEnabled = typeof data?.audioEnabled === 'boolean' ? data.audioEnabled : undefined;
        const videoEnabled = typeof data?.videoEnabled === 'boolean' ? data.videoEnabled : undefined;

        // Merge into existing state (clients may only report one field at a time).
        const prev = this.socketMediaState.get(client.id) ?? { audioEnabled: true, videoEnabled: true };
        if (audioEnabled !== undefined) prev.audioEnabled = audioEnabled;
        if (videoEnabled !== undefined) prev.videoEnabled = videoEnabled;
        this.socketMediaState.set(client.id, prev);

        // Broadcast to room so other UIs can update indicators in real time.
        client.to(roomId).emit('peer-media-state', {
            socketId: client.id,
            audioEnabled: prev.audioEnabled,
            videoEnabled: prev.videoEnabled,
        });

        await this.emitRoomPresence(roomId);

        return { ok: true };
    }
}
