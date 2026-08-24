import { Server, Socket } from 'socket.io';
import { JourneyStage } from '../common/journey';
export interface PipelineMoveEvent {
    candidateId: string;
    stage: JourneyStage;
    actor?: string;
}
export declare class PipelineGateway {
    server: Server;
    private readonly logger;
    onJoin(client: Socket, jobId: string): {
        joined: string;
    };
    onMove(event: PipelineMoveEvent): {
        ok: boolean;
    };
    broadcastMove(event: PipelineMoveEvent): void;
}
