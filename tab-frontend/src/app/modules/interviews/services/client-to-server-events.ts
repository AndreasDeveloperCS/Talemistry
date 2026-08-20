

export interface ClientToServerEvents {
    'join-room': (data: { roomId: string; displayName?: string; userId?: string; profileId?: string; clientId?: string }, cb?: (ack: { ok: boolean; roomId: string; peers: string[] }) => void) => void;
    'leave-room': (data: { roomId: string }) => void;
    'chat-message': (data: { roomId: string; text: string; msgId?: string; meta?: any }, cb?: (ack: any) => void) => void;
    'typing': (data: { roomId: string; isTyping: boolean }) => void;

    'offer': (data: { roomId: string; to: string; sdp: RTCSessionDescriptionInit }) => void;
    'answer': (data: { roomId: string; to: string; sdp: RTCSessionDescriptionInit }) => void;
    'ice-candidate': (data: { roomId: string; to: string; candidate: RTCIceCandidateInit }) => void;

    'start-screen-share': (data: { roomId: string; streamId?: string }) => void;
    'stop-screen-share': (data: { roomId: string; streamId?: string }) => void;
    'get-ice-servers': (
        data?: { allowGoogleStunFallback?: boolean },
        cb?: (ack: { ok: boolean; iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> }) => void,
    ) => void;
}