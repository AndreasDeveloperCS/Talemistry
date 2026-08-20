import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';

@Injectable()
export class MongodbConfigService implements MongooseOptionsFactory {
  constructor(private readonly configService: ConfigService) { }

  public mongooseOptions(): MongooseModuleOptions {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not set');
    }
    const mongoUri = process.env.MONGO_URI;

    const options: MongooseModuleOptions = {
      uri: mongoUri,
      retryAttempts: 3,
      retryDelay: 2000,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 2,
      // Prefer IPv4 (can reduce TLS flakiness on some hosts with broken IPv6 routing/DNS)
      family: 4,
      // TLS workaround for Node.js/OpenSSL compatibility issues
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      // Connection pool management to prevent pool closed errors
      waitQueueTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      // Prevent connection pool from closing prematurely during shutdown
      bufferCommands: false,
      // Enable monitoring for connection issues
      monitorCommands: true,
    } as any;

    console.log('🔌 Connecting to MongoDB (TLS enabled, validation bypass, session management disabled)...');
    return options;
  }

  public createMongooseOptions(): MongooseModuleOptions {
    return this.mongooseOptions();
  }
}
