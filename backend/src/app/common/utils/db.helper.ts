import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { isProd } from "../../config";
import { EntitySchema, MixedList } from "typeorm";

export function getTypeOrmOptions(typesCollection?: MixedList<string | Function | EntitySchema<any>>): TypeOrmModuleOptions {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not set');
    }
    const mongoUri = process.env.MONGO_URI;

    const options: TypeOrmModuleOptions = {
        entities: typesCollection,
        type: 'mongodb',
        url: mongoUri,
        synchronize: isProd ? false : true,
        logging: !isProd,
        autoLoadEntities: true,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        // Prefer IPv4 (can reduce TLS flakiness on some hosts with broken IPv6 routing/DNS)
        family: 4,
        // TLS workaround for Node.js/OpenSSL compatibility issues
        ssl: true,
        tlsAllowInvalidCertificates: true,
    } as any;

    return options;
}
