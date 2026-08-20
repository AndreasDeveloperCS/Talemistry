import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication } from '@nestjs/common';
import { ServerOptions } from 'http';
import { exposedHeaders, headers, methods, whiteList } from '../config';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

type RedisClient = ReturnType<typeof createClient>;

type RedisAdapterState = {
  enabled: boolean;
  url?: string;
  pub?: RedisClient;
  sub?: RedisClient;
  initPromise?: Promise<void>;
};

export class SocketIoAdapter extends IoAdapter {
  constructor(app: INestApplication) { super(app); }

  private static redisState: RedisAdapterState = { enabled: false };

  private static shouldEnableRedisAdapter(): { enabled: boolean; url?: string } {
    const enabled = String(process.env.SOCKET_IO_REDIS_ENABLED ?? '').trim().toLowerCase();
    if (enabled === 'false' || enabled === '0' || enabled === 'no') return { enabled: false };

    const url = String(
      process.env.SOCKET_IO_REDIS_URL ||
      process.env.REDIS_URL ||
      process.env.REDIS_TLS_URL ||
      ''
    ).trim();

    // Only enable when explicitly configured.
    if (!url) return { enabled: false };
    return { enabled: true, url };
  }

  private static async initRedisAdapterIfNeeded(url: string): Promise<void> {
    if (this.redisState.initPromise) return this.redisState.initPromise;

    this.redisState.initPromise = (async () => {
      try {
        const pub = createClient({ url });
        const sub = pub.duplicate();

        // pub.on('error', (err) => console.error('❌ Redis(pub) error for Socket.IO adapter:', err));
        // sub.on('error', (err) => console.error('❌ Redis(sub) error for Socket.IO adapter:', err));

        await pub.connect();
        await sub.connect();

        this.redisState = { enabled: true, url, pub, sub, initPromise: this.redisState.initPromise };
        console.log('✅ Socket.IO Redis adapter connected');
      } catch (e) {
        // Do not crash the app; without Redis adapter, rooms only work within one instance.
        this.redisState = { enabled: false, url, initPromise: this.redisState.initPromise };
        console.warn('⚠️ Socket.IO Redis adapter failed to initialize; continuing without it.', e);
      }
    })();

    return this.redisState.initPromise;
  }

  override createIOServer(port: number, options?: ServerOptions) {

    const normalizeOrigin = (origin: string): string =>
      String(origin ?? '').replace(/\/+$/, '').toLowerCase();

    const isTrustedEvrykaOrigin = (origin: string): boolean =>
      /^https?:\/\/([a-z0-9-]+\.)*talemistry\.com(?::\d+)?$/i.test(origin);

    const allowedOrigins = new Set(
      (whiteList ?? [])
        .filter(Boolean)
        .map((allowedOrigin: any) => normalizeOrigin(String(allowedOrigin)))
    );

    const finalOptions = {
      ...options,
      cors: {
        credentials: true,
        allowedHeaders: headers,
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          // Allow non-browser clients (no Origin header)
          if (!origin) return callback(null, true);

          const normalized = normalizeOrigin(origin);

          // Allow explicit list
          if (allowedOrigins.has(normalized)) return callback(null, true);

          // Allow any evryka.org subdomain
          if (isTrustedEvrykaOrigin(normalized)) return callback(null, true);

          // Allow any localhost port commonly used in dev
          if (/^https?:\/\/localhost:\d+$/i.test(normalized)) return callback(null, true);

          return callback(new Error(`Socket.IO CORS blocked for origin: ${origin}`), false);
        },
        optionsSuccessStatus: 200,
        exposedHeaders: exposedHeaders,
        methods: methods,
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    };

    const server = super.createIOServer(port, finalOptions);

    // Optional: enable Redis adapter so Socket.IO rooms work across multiple instances.
    // This fixes cases where two users join the same room but are routed to different backend nodes.
    const redisCfg = SocketIoAdapter.shouldEnableRedisAdapter();
    if (redisCfg.enabled && redisCfg.url) {
      void SocketIoAdapter.initRedisAdapterIfNeeded(redisCfg.url).then(() => {
        const state = SocketIoAdapter.redisState;
        if (state.enabled && state.pub && state.sub) {
          try {
            // Some environments can end up with duplicated @redis/client typings.
            // Cast at the adapter boundary to keep runtime behavior correct.
            server.adapter(createAdapter(state.pub as any, state.sub as any));
            console.log('🧩 Socket.IO Redis adapter enabled');
          } catch (e) {
            console.warn('⚠️ Failed to attach Socket.IO Redis adapter; continuing without it.', e);
          }
        }
      });
    }

    // 🧠 DEBUG LOG
    console.log(
      `🧩 SocketIoAdapter.createIOServer() called — path=${finalOptions.path} port=${port}`
    );

    const originalOf = server.of.bind(server);
    server.of = (nsp: string) => {
      //console.log(`📡 Namespace registered: ${nsp}`);
      return originalOf(nsp);
    };

    return server;
  }
}