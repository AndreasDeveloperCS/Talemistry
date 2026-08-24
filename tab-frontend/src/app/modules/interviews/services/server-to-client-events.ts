export interface ServerToClientEvents {
    'peer-joined': { socketId: string; displayName?: string };
    'peer-left': { socketId: string };
    'chat-message': { from: string; text: string; sentAt: number; msgId?: string; meta?: any };
    'offer': { from: string; sdp: RTCSessionDescriptionInit };
    'answer': { from: string; sdp: RTCSessionDescriptionInit };
    'ice-candidate': { from: string; candidate: RTCIceCandidateInit };
    'typing': { from: string; isTyping: boolean };
    'peer-started-screen': { socketId: string; streamId?: string };
    'peer-stopped-screen': { socketId: string; streamId?: string };
}