import { Logger } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { exposedHeaders, headers, methods, whiteList } from '../../../config';

interface TelegramConnectionState {
    userId: string;
    socketIds: Set<string>;
    connectToken?: string;
    subscribedAt: Date;
    lastActivity: Date;
}

interface EventEnvelope<T = any> {
    event: string;
    timestamp: Date;
    userId: string;
    data: T;
}

interface TelegramLinkedData {
    chatId: string;
    username?: string;
    enabled: boolean;
}

@WebSocketGateway({
    namespace: '/ws/telegram',
    cors: {
        credentials: true,
        allowedHeaders: headers,
        origin: whiteList,
        exposedHeaders: exposedHeaders,
        methods: methods,
    },
})
export class TelegramConnectionGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(TelegramConnectionGateway.name);

    // Map userId (as string) -> connection state with multiple socket IDs
    private readonly connections = new Map<string, TelegramConnectionState>();

    // Map socketId -> userId (as string) for quick lookup on disconnect
    private readonly socketToUser = new Map<string, string>();

    afterInit(server: Server) {
        this.logger.log('✨ Telegram Connection Gateway initialized');
        this.logger.log('📡 Ready to handle userId-based subscriptions');
    }

    handleConnection(@ConnectedSocket() client: Socket) {
        this.logger.log(`🔌 Client connected: ${client.id}`);
        this.logger.log(`📊 Total active connections: ${this.socketToUser.size + 1}`);
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        const userId = this.socketToUser.get(client.id);

        this.logger.log(`🔌 Client disconnecting: ${client.id}`);

        if (userId) {
            // Leave the userId room
            client.leave(this.getUserRoom(userId));

            const state = this.connections.get(userId);
            if (state) {
                state.socketIds.delete(client.id);

                // Clean up if no more connections for this user
                if (state.socketIds.size === 0) {
                    this.connections.delete(userId);
                    this.logger.log(`✅ User ${userId} fully unsubscribed (no more active connections)`);
                } else {
                    this.logger.log(`📊 User ${userId} still has ${state.socketIds.size} active connection(s)`);
                }
            }

            this.socketToUser.delete(client.id);
        }

        this.logger.log(`✅ Client ${client.id} disconnected and cleaned up`);
    }

    @SubscribeMessage('registerTelegramListener')
    handleRegisterListener(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string | any }
    ) {
        this.logger.log(`📥 Subscription request from client ${client.id}`);

        let { userId } = data;

        if (!userId) {
            this.logger.error('❌ Subscription failed: userId is required');
            client.emit('error', { message: 'userId is required' });
            return;
        }

        // Normalize userId to string (handles ObjectId or string)
        userId = userId.toString();
        this.logger.log(`🔑 Subscribing client ${client.id} to userId: ${userId}`);

        // Join the userId room - Socket.IO will handle broadcasting to all sockets in this room
        const userRoom = this.getUserRoom(userId);
        client.join(userRoom);
        this.logger.log(`✅ Client ${client.id} joined room: ${userRoom}`);

        // Track connection state
        let state = this.connections.get(userId);
        if (!state) {
            state = {
                userId,
                socketIds: new Set(),
                subscribedAt: new Date(),
                lastActivity: new Date(),
            };
            this.connections.set(userId, state);
            this.logger.log(`✨ Created new subscription for user ${userId}`);
        } else {
            state.lastActivity = new Date();
            this.logger.log(`📝 User ${userId} already subscribed, adding socket to existing subscription`);
        }

        // Add this socket to the user's connections
        state.socketIds.add(client.id);

        // Map socket to user for cleanup
        this.socketToUser.set(client.id, userId);

        this.logger.log(
            `✅ Subscription complete: User ${userId} now has ${state.socketIds.size} active socket(s)`
        );
        this.logger.log(`📊 Total subscribed users: ${this.connections.size}`);

        // Send confirmation to client
        client.emit('registered', {
            userId,
            subscribedAt: state.subscribedAt,
            activeConnections: state.socketIds.size
        });
    }

    @SubscribeMessage('unregisterTelegramListener')
    handleUnregisterListener(@ConnectedSocket() client: Socket) {
        const userId = this.socketToUser.get(client.id);

        this.logger.log(`📥 Unsubscription request from client ${client.id}`);

        if (userId) {
            // Leave the userId room
            const userRoom = this.getUserRoom(userId);
            client.leave(userRoom);
            this.logger.log(`🔌 Client ${client.id} left room: ${userRoom}`);

            const state = this.connections.get(userId);
            if (state) {
                state.socketIds.delete(client.id);

                if (state.socketIds.size === 0) {
                    this.connections.delete(userId);
                    this.logger.log(`✅ User ${userId} fully unsubscribed`);
                } else {
                    this.logger.log(`📊 User ${userId} still has ${state.socketIds.size} active socket(s)`);
                }
            }

            this.socketToUser.delete(client.id);
            this.logger.log(`✅ Client ${client.id} unsubscribed from userId: ${userId}`);
        }

        client.emit('unregistered');
    }

    /**
     * Get the Socket.IO room name for a userId
     */
    private getUserRoom(userId: string): string {
        return `user:${userId}`;
    }

    /**
     * Create an event envelope with metadata
     */
    private createEnvelope<T>(event: string, userId: string, data: T): EventEnvelope<T> {
        return {
            event,
            timestamp: new Date(),
            userId,
            data,
        };
    }

    /**
     * Send an event envelope to all subscribed clients for a userId
     */
    private emitToUser<T>(userId: string, event: string, data: T): boolean {
        const userRoom = this.getUserRoom(userId);
        const envelope = this.createEnvelope(event, userId, data);

        this.logger.log(`📤 Emitting event "${event}" to room: ${userRoom}`);
        this.logger.log(`📦 Envelope structure:`, {
            event: envelope.event,
            timestamp: envelope.timestamp,
            userId: envelope.userId,
            dataKeys: Object.keys(envelope.data as any)
        });
        this.logger.log(`📦 Full envelope:`, JSON.stringify(envelope));

        // Get room info for debugging
        const socketsInRoom = this.server.in(userRoom).allSockets();
        socketsInRoom.then(sockets => {
            this.logger.log(`📊 Room "${userRoom}" has ${sockets.size} socket(s)`);
            this.logger.log(`📊 Socket IDs in room:`, Array.from(sockets));
        });

        // Emit the complete envelope to all sockets in the userId room
        this.server.to(userRoom).emit(event, envelope);
        this.logger.log(`✅ Event "${event}" emitted to room: ${userRoom}`);

        return true;
    }

    /**
     * Notify subscribed clients when a Telegram account has been linked
     * Uses event envelope pattern to send structured notifications
     */
    notifyTelegramLinked(userId: string | any, telegramData: TelegramLinkedData): void {
        // Normalize userId to string (handles ObjectId or string)
        const userIdString = userId.toString();

        this.logger.log(`🔔 ========== TELEGRAM LINKED NOTIFICATION START ==========`);
        this.logger.log(`🔔 Telegram linked event for userId: ${userIdString}`);
        this.logger.log(`📊 Telegram data received:`, JSON.stringify(telegramData));
        this.logger.log(`📊 Data structure:`, {
            hasChatId: !!telegramData.chatId,
            chatId: telegramData.chatId,
            hasUsername: !!telegramData.username,
            username: telegramData.username,
            enabled: telegramData.enabled
        });

        const state = this.connections.get(userIdString);

        if (!state || state.socketIds.size === 0) {
            this.logger.error(`❌ No active subscriptions for userId: ${userIdString}`);
            this.logger.error(`📊 Total subscribed users: ${this.connections.size}`);
            this.logger.error(`📊 Subscribed userIds:`, Array.from(this.connections.keys()));
            this.logger.error(`❌ Cannot send notification - no listeners registered`);
            this.logger.log(`🔔 ========== TELEGRAM LINKED NOTIFICATION FAILED ==========`);
            return;
        }

        this.logger.log(`✅ Found active subscription for userId: ${userIdString}`);
        this.logger.log(`📊 Subscription state:`, {
            socketCount: state.socketIds.size,
            socketIds: Array.from(state.socketIds),
            subscribedAt: state.subscribedAt,
            lastActivity: state.lastActivity
        });

        // Update last activity
        state.lastActivity = new Date();

        this.logger.log(
            `📡 Broadcasting to ${state.socketIds.size} subscribed client(s) for userId: ${userIdString}`
        );

        // Prepare the event data that will be wrapped in the envelope
        const eventData = {
            linked: true,
            chatId: telegramData.chatId,
            username: telegramData.username,
            enabled: telegramData.enabled,
        };
        this.logger.log(`📦 Event data to send:`, JSON.stringify(eventData));

        // Emit event envelope to all subscribed clients for this userId
        const success = this.emitToUser(userIdString, 'telegramLinked', eventData);

        if (success) {
            this.logger.log(
                `✅ Event successfully sent to ${state.socketIds.size} client(s) for userId: ${userIdString}`
            );
            this.logger.log(`🔔 ========== TELEGRAM LINKED NOTIFICATION SUCCESS ==========`);
        } else {
            this.logger.error(`❌ Failed to send event to clients`);
            this.logger.log(`🔔 ========== TELEGRAM LINKED NOTIFICATION FAILED ==========`);
        }
    }

    /**
     * Get subscription statistics
     */
    getSubscriptionStats(): {
        totalSubscribedUsers: number;
        totalActiveSockets: number;
        subscriptions: Array<{
            userId: string;
            socketCount: number;
            subscribedAt: Date;
            lastActivity: Date;
        }>;
    } {
        const subscriptions = Array.from(this.connections.entries()).map(([userId, state]) => ({
            userId,
            socketCount: state.socketIds.size,
            subscribedAt: state.subscribedAt,
            lastActivity: state.lastActivity,
        }));

        return {
            totalSubscribedUsers: this.connections.size,
            totalActiveSockets: this.socketToUser.size,
            subscriptions,
        };
    }

    /**
     * Get the number of active listeners for memory monitoring
     */
    getActiveListenersCount(): number {
        return this.connections.size;
    }

    /**
     * Get total socket connections for memory monitoring
     */
    getTotalSocketsCount(): number {
        return this.socketToUser.size;
    }

    /**
     * Clean up stale connections (optional maintenance task)
     */
    cleanupStaleConnections(maxInactiveMinutes: number = 30): void {
        const now = new Date();
        const staleUsers: string[] = [];

        this.connections.forEach((state, userId) => {
            // Remove if no sockets or inactive for too long
            const inactiveMinutes = (now.getTime() - state.lastActivity.getTime()) / 1000 / 60;

            if (state.socketIds.size === 0) {
                staleUsers.push(userId);
                this.logger.log(`🧹 Cleaning up empty subscription for user ${userId}`);
            } else if (inactiveMinutes > maxInactiveMinutes) {
                staleUsers.push(userId);
                this.logger.log(
                    `🧹 Cleaning up inactive subscription for user ${userId} (inactive for ${Math.round(inactiveMinutes)} minutes)`
                );
            }
        });

        staleUsers.forEach(userId => {
            this.connections.delete(userId);
        });

        if (staleUsers.length > 0) {
            this.logger.log(`✅ Cleaned up ${staleUsers.length} stale subscription(s)`);
        } else {
            this.logger.log(`✅ No stale subscriptions found`);
        }
    }
}
