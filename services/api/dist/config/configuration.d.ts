export interface AppConfig {
    env: string;
    port: number;
    mongoUri: string;
    dbName: string;
    corsOrigins: string[];
    jwtSecret: string;
    jwtExpiresIn: string;
}
declare const _default: () => AppConfig;
export default _default;
