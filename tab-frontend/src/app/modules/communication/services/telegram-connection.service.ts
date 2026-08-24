import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import io from 'socket.io-client';

type Socket = ReturnType<typeof io>;

export interface TelegramLinkEvent {
    linked: boolean;
    chatId: string;
    username?: string;
    enabled: boolean;
}

export interface EventEnvelope<T = any> {
    event: string;
    timestamp: Date;
    userId: string;
    data: T;
}

@Injectable({
    providedIn: 'root'
})
export class TelegramConnectionService {
    private socket?: Socket;
    private connected$ = new BehaviorSubject<boolean>(false);
    private telegramLinked$ = new BehaviorSubject<TelegramLinkEvent | null>(null);
    private currentUserId?: string; // Track the currently registered userId

    public connected: Observable<boolean> = this.connected$.asObservable();
    public onTelegramLinked: Observable<TelegramLinkEvent | null> = this.telegramLinked$.asObservable();

    private pendingUserId?: string;

    constructor() { }

    /**
     * Connect to the Telegram WebSocket gateway
     * @param userId - User ID to register for Telegram updates (optional, can register later)
     */
    connect(userId?: string): void {
        // Store userId for registration upon connection
        if (userId) {
            this.currentUserId = userId;
            console.log('📝 Stored userId for registration:', userId);
        }

        // If socket already connected, just re-register if userId is different
        if (this.socket?.connected) {
            console.log('✅ Telegram socket already connected');
            if (userId && userId !== this.currentUserId) {
                console.log('🔄 Different userId provided, re-registering:', userId);
                this.registerListener(userId);
            }
            // Emit current connected state to ensure subscribers get notified
            this.connected$.next(true);
            return;
        }

        // If socket exists but not connected yet (connecting state)
        // Don't create a new one, but ensure subscribers will be notified
        if (this.socket && !this.socket.connected) {
            console.log('⏳ Socket already exists and is connecting...');
            console.log('✅ Subscribers will be notified when connection completes');
            // The existing socket's 'connect' listener will emit to connected$ when ready
            return;
        }

        const base = (environment.wsBase || environment.apiUrl.replace(/\/api\/$/, '')).replace(/\/+$/, '');
        let path = environment.wsPath || '/socket.io';

        // Ensure path starts with /
        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        const option = {
            withCredentials: true,
            path: path,
            transports: ['websocket', 'polling'] as any,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        };

        const wsUrl = `${base}/ws/telegram`;
        console.log('🔌 Connecting to Telegram WebSocket:', wsUrl, 'with path:', path, 'userID', userId);
        if (userId) {
            console.log('🔑 Will register userId upon connection:', userId);
        }

        this.socket = io(wsUrl, option);

        this.socket.on('connect', () => {
            console.log('✅ Telegram WebSocket connected');
            this.connected$.next(true);

            // Automatically register listener if userId was provided
            if (this.currentUserId) {
                console.log('📡 Auto-registering listener for userId:', this.currentUserId);
                this.socket!.emit('registerTelegramListener', { userId: this.currentUserId });
            }
        });

        this.socket.on('connect_error', (error: any) => {
            console.error('❌ Telegram WebSocket connection error:', error);
            console.error('❌ Error details:', {
                message: error.message,
                type: error.name,
                stack: error.stack
            });
            this.connected$.next(false);
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Telegram WebSocket disconnected for userId:', this.currentUserId);
            this.connected$.next(false);
            // Note: Don't clear currentUserId here - we want to re-register on reconnect
        });

        this.socket.on('reconnect', () => {
            console.log('🔄 Telegram WebSocket reconnected');
            this.connected$.next(true);
            // Re-register listener after reconnection
            if (this.currentUserId) {
                console.log('📡 Re-registering listener after reconnect for userId:', this.currentUserId);
                this.socket!.emit('registerTelegramListener', { userId: this.currentUserId });
            }
        });

        this.socket.on('telegramLinked', (envelope: EventEnvelope<TelegramLinkEvent>) => {
            console.log('🔗 Telegram linked event envelope received from backend:', envelope);
            console.log('📊 Envelope metadata:', {
                event: envelope.event,
                timestamp: envelope.timestamp,
                userId: envelope.userId
            });
            console.log('📦 Event data:', envelope.data);

            // Emit the data from the envelope to subscribers
            this.telegramLinked$.next(envelope.data);
        });

        this.socket.on('registered', (data: any) => {
            console.log('✅ Successfully registered for Telegram updates:', data);
        });

        this.socket.on('error', (error: any) => {
            console.error('❌ Telegram WebSocket error:', error);
        });
    }

    /**
     * Register to listen for Telegram link events for a specific user
     */
    registerListener(userId: string, connectToken?: string): void {
        if (!this.socket) {
            console.error('❌ Socket not initialized. Call connect() first.');
            return;
        }

        // Update the current userId
        this.currentUserId = userId;

        const doRegister = () => {
            console.log('📡 Registering Telegram listener for userId:', userId);
            this.socket!.emit('registerTelegramListener', { userId, connectToken });
        };

        // If socket is already connected, register immediately
        if (this.socket.connected) {
            console.log('✅ Socket already connected, registering immediately');
            doRegister();
        } else {
            // Wait for connection before registering
            console.log('⏳ Socket not connected yet, waiting for connection...');
            this.socket.once('connect', () => {
                console.log('✅ Socket connected, now registering');
                doRegister();
            });
        }
    }

    /**
     * Unregister from Telegram link events
     * Only unregisters the current socket connection, not all connections for this user
     */
    unregisterListener(): void {
        if (!this.socket || !this.socket.connected) {
            console.log('⚠️ Socket not connected, skipping unregister');
            return;
        }

        console.log('🔌 Unregistering Telegram listener for userId:', this.currentUserId);
        this.socket.emit('unregisterTelegramListener');
        // Note: Don't clear currentUserId - other tabs might still need it
    }

    /**
     * Disconnect from the WebSocket
     * This will trigger automatic cleanup on the backend
     */
    disconnect(): void {
        if (this.socket) {
            console.log('🔌 Disconnecting Telegram WebSocket for userId:', this.currentUserId);
            // Unregister before disconnecting (optional - disconnect will trigger cleanup anyway)
            if (this.socket.connected) {
                this.unregisterListener();
            }
            this.socket.disconnect();
            this.socket = undefined;
            this.connected$.next(false);
            this.currentUserId = undefined;
            console.log('✅ Telegram WebSocket disconnected and cleaned up');
        }
    }

    /**
     * Check if currently connected
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }
}
