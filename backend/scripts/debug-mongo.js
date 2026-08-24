const dns = require('dns');
const net = require('net');
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

const CWD = process.cwd();
let cfg = {};
try {
    cfg = require(path.join(CWD, 'config.json'));
} catch (e) {
    console.error('Failed to load config.json:', e.message || e);
    process.exit(1);
}

const uri = process.env.MONGO_URI || cfg.mongoCloudConnection || cfg.mongoConnection;
if (!uri) {
    console.error('No mongo URI found in config.json or MONGO_URI env var.');
    process.exit(1);
}

function log(title, msg) {
    console.log('\n=== ' + title + ' ===');
    if (msg) console.log(msg);
}

async function resolveSrvFromSrvUri(uriStr) {
    // extract host from mongodb+srv://...@<host>/...
    const m = uriStr.match(/^[^@]+@?([^/]+)(?:\/|$)/);
    if (!m) return null;
    let host = m[1];
    // if host contains query params or port, strip
    host = host.split('?')[0];
    host = host.split(':')[0];
    return new Promise((resolve) => {
        dns.resolveSrv(`_mongodb._tcp.${host}`, (err, records) => {
            if (err) return resolve({ error: err });
            resolve(records);
        });
    });
}

function testTcp(host, port = 27017, timeout = 5000) {
    return new Promise((resolve) => {
        const sock = net.connect({ host, port, timeout }, () => {
            sock.end();
            resolve({ ok: true });
        });
        sock.on('error', (err) => {
            resolve({ ok: false, error: err.message || String(err) });
        });
        sock.on('timeout', () => {
            sock.destroy();
            resolve({ ok: false, error: 'timeout' });
        });
    });
}

async function tryMongo(name, options) {
    log(`Connect attempt: ${name}`, `options: ${JSON.stringify(options || {})}`);
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        ...options,
    });
    try {
        await client.connect();
        const dbName = client.db().databaseName || '<unknown-db>';
        log(`${name} OK`, `connected to ${dbName}`);
        await client.close();
        return { ok: true };
    } catch (err) {
        log(`${name} ERROR`, err && err.stack ? err.stack : String(err));
        return { ok: false, error: err };
    }
}

(async function main() {
    console.log('Using URI from config or env (hidden)');

    // 1) If SRV, resolve
    if (uri.startsWith('mongodb+srv://')) {
        const srv = await resolveSrvFromSrvUri(uri);
        if (srv && srv.error) {
            log('SRV resolve error', srv.error);
        } else {
            log('SRV records', srv);
            if (Array.isArray(srv)) {
                for (const r of srv) {
                    const host = r.name;
                    const port = r.port || 27017;
                    const tcp = await testTcp(host, port, 5000);
                    log(`TCP ${host}:${port}`, tcp);
                }
            }
        }
    } else {
        // not SRV, parse hostname
        const m = uri.match(/^[^:]+:\/\/([^/]+)(?:\/|$)/);
        if (m) {
            const host = m[1].split(':')[0];
            const tcp = await testTcp(host, 27017, 5000);
            log(`TCP ${host}:27017`, tcp);
        }
    }

    // 2) Try default connect
    await tryMongo('default');

    // 3) Try with tlsAllowInvalidCertificates
    await tryMongo('tlsAllowInvalidCertificates', { tls: true, tlsAllowInvalidCertificates: true });

    // 4) Try forcing tls=false (triage only)
    await tryMongo('tls:false (triage)', { tls: false });

    console.log('\nDone.');
})();
