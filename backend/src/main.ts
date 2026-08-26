import 'dotenv/config';
import { INestApplication, NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';
import { Request } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import {
  exposedHeaders,
  headers,
  methods,
  serviceConfig,
  whiteList
} from './app/config';
import helmet from 'helmet';
import { SocketIoAdapter } from './app/sockets/extended-socket-io-adapter';
import { getBaseDir } from './app/common/utils/path.helper';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';

const fs = require('fs');
const path = require('path');
const compression = require('compression');

function normalizePort(val: number | string): number | string | undefined {
  const port: number = typeof val === 'string' ? parseInt(val, 10) : val;

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }
}

async function bootstrap() {
  console.log('PORT', process.env.PORT, serviceConfig.port);

  const port = normalizePort(process.env.PORT || serviceConfig.port);
  console.log('PORT', port);

  // const httpsOptions: HttpsOptions = {
  //   key: fs.readFileSync(path?.join(getBaseDir(), 'client_certs/key.pem')),
  //   cert: fs.readFileSync(path?.join(getBaseDir(), 'client_certs/cert.pem'))
  // };

  const options: NestApplicationOptions = {
    bodyParser: true,
    //httpsOptions: httpsOptions,
    forceCloseConnections: true,
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  };

  const api = await NestFactory.create<NestExpressApplication>(
    AppModule,
    options
  );

  // Nest expects a prefix without a leading slash.
  // Using a leading slash can result in subtle route mismatches in some setups.
  api.setGlobalPrefix('api');
  api.useStaticAssets(join(getBaseDir(), 'public'), {
    prefix: '/public/',
  });

  // api.useStaticAssets(join(getBaseDir(),  'public', 'css'), {
  //   //prefix: '/public/css',
  // });  

  // api.useStaticAssets(join(getBaseDir(), 'public', 'js'), {
  //   //prefix: '/public/js',
  // });

  const normalizeOrigin = (origin: string): string =>
    origin.replace(/\/$/, '').toLowerCase();

  const isTrustedEvrykaOrigin = (origin: string): boolean =>
    /^https?:\/\/([a-z0-9-]+\.)*talemistry\.com(?::\d+)?$/i.test(origin);

  const cspEvrykaOrigins = [
    'https://talemistry.com',
    'https://api.talemistry.com',
    'https://tab.talemistry.com',
    'https://tap.talemistry.com',
  ];

  const allowedOrigins = new Set(
    [
      ...whiteList,
      'https://tab.talemistry.com',
      'http://tab.talemistry.com',
      'https://tap.talemistry.com',
      'http://tap.talemistry.com',
      'https://api.talemistry.com',
      'http://api.talemistry.com',
    ]
      .filter(Boolean)
      .map((allowedOrigin) => normalizeOrigin(allowedOrigin as string))
  );

  api.enableCors({
    allowedHeaders: headers,
    origin: (origin, callback) => {
      // Allow non-browser clients (no Origin header)
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);

      if (allowedOrigins.has(normalizedOrigin)) return callback(null, true);

      if (isTrustedEvrykaOrigin(normalizedOrigin)) return callback(null, true);

      // Optional: allow any localhost port commonly used during dev
      if (/^https?:\/\/localhost:\d+$/i.test(normalizedOrigin)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    optionsSuccessStatus: 200,
    exposedHeaders: exposedHeaders,
    methods: methods,
    credentials: true,
  });

  // api.set('view engine', 'hbs');
  api.use(compression());
  const rawBodySaver = (req: Request, _res: unknown, buffer: Buffer) => {
    if (buffer?.length) {
      req.rawBody = buffer.toString('utf8');
    }
  };
  // api.use(
  //   bodyParser.json({
  //     limit: '1000mb',
  //   })
  // );
  api.use(bodyParser.json({ limit: '1024mb', verify: rawBodySaver }));
  api.use(
    bodyParser.urlencoded({
      extended: true,
      limit: '1024mb',
      verify: rawBodySaver,
      // parameterLimit: 50000,
    })
  );

  api.useStaticAssets(join(getBaseDir(), 'public', 'social-media-icons'), {
    prefix: '/public/social-media-icons', // Serve files from 'public' folder with this prefix
    index: false,
  });

  api.use(
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://www.gstatic.com", "https://apis.google.com", "'unsafe-inline'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "blob:", "https://accounts.google.com", "https://calendar.google.com"],
        workerSrc: ["'self'", "blob:"],
        imgSrc: ["'self'", "data:", "blob:", ...cspEvrykaOrigins],
        mediaSrc: ["'self'", "data:", "blob:", ...cspEvrykaOrigins],
        // IMPORTANT: include https + wss (and http + ws for local dev)
        connectSrc: [
          "'self'", "blob:", "https:", "wss:", "ws:",
          "https://www.googleapis.com",
          "https://accounts.google.com",
          ...cspEvrykaOrigins,
          "wss://tab.talemistry.com",
          "wss://tap.talemistry.com",
          "ws://tap.talemistry.com",
          "wss://talemistry.com",
          "ws://talemistry.com",
          "http://localhost:3000",
          "ws://localhost:3000",
        ],
      },
      reportOnly: true, // switch to enforce when ready
    })
  );
  // api.useGlobalPipes(
  //   new ValidationPipe({
  //     // transform: false,
  //     // whitelist: false,
  //     // forbidNonWhitelisted: false,
  //     skipMissingProperties: true,
  //   }),
  // );
  // api.use(
  //   '/',
  //   createProxyMiddleware({
  //     target: serviceConfig.appUIUrl,
  //     changeOrigin: true,
  //     secure:false
  //   })
  // );

  api.setViewEngine('ejs');
  api.set('view engine', 'hbs');
  //api.set('view engine', 'ejs');
  api.useWebSocketAdapter(new SocketIoAdapter(api));

  process.on('uncaughtException', (error: any) => {
    console.error('Uncaught Exception at main:', error);
  }
  );

  process.on('unhandledRejection', (reason: any, promise: any) => {
    console.error('Unhandled Rejection at main:', promise, 'reason:', reason);
    // Handle the error, e.g., log it, send an alert, etc.
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, gracefully shutting down...');
    try {
      // Enable graceful shutdown with timeout
      await api.enableShutdownHooks();
      await api.close();
      console.log('✅ API server closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, gracefully shutting down...');
    try {
      // Enable graceful shutdown with timeout
      await api.enableShutdownHooks();
      await api.close();
      console.log('✅ API server closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
  //await api.listen(port);
  await api.listen(port, '0.0.0.0');
  await logAllRoutes(api);

  //logAllRoutes(api);
  // const apiFactory = new NestFactoryStatic();
  // const api = await apiFactory.create(AppModule, options);
  // api.setGlobalPrefix('/api');
  // await api.init();

  // const adminFactory = new NestFactoryStatic();
  // const admin = await adminFactory.create(AppModule, options);
  // admin.setGlobalPrefix('/api/admin');
  // await admin.init();

  // https.createServer(server).listen(port);

}

bootstrap();

async function logAllRoutes(app: INestApplication) {
  console.log('\n--- Registered Routes ---');
  try {
    const server = app.getHttpServer();
    const router = server?._events?.request?._router; // Express router

    if (router?.stack?.length === 0) {
      console.log('No routes registered.', router?.stack);
      return;
    }

    const routePaths = new Set<string>();
    router?.stack?.forEach((layer) => {
      if (layer.route?.path) {
        routePaths.add(layer.route.path);
      } else if (layer.name === 'router' && layer.handle?.stack) {
        layer.handle.stack.forEach((nestedLayer) => {
          if (nestedLayer.route?.path) {
            routePaths.add(nestedLayer.route.path);
          }
        });
      }
    });

    console.log('\n--- Registered Endpoint Paths ---');
    [...routePaths].forEach((path) => console.log(path));
    console.log('--- End of Paths ---\n');
  }
  catch (ex) {
    console.log('Error processing route layer:', ex);
    console.log('\n--- Registered Routes ---');
  }
  console.log('--- End of Routes ---\n');
}
