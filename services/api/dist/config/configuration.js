"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function normalizeMongoUri(raw) {
    if (!raw)
        return '';
    const uri = raw.trim().replace(/^['"]|['"]$/g, '');
    if (/^mongodb(\+srv)?:\/\//.test(uri))
        return uri;
    const srvIdx = uri.indexOf('+srv://');
    if (srvIdx !== -1)
        return 'mongodb' + uri.slice(srvIdx);
    const stdIdx = uri.indexOf('://');
    if (stdIdx !== -1 && stdIdx <= 8)
        return 'mongodb' + uri.slice(stdIdx);
    return uri;
}
exports.default = () => ({
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4000', 10),
    mongoUri: normalizeMongoUri(process.env.TALEMISTRY_MONGODB_URI ??
        process.env.MONGODB_URI ??
        'mongodb://127.0.0.1:27017/talemistry'),
    dbName: process.env.TALEMISTRY_DB_NAME ?? 'talemistry',
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:4200')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
});
//# sourceMappingURL=configuration.js.map