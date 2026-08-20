const dns = require('dns');
const tls = require('tls');
const net = require('net');
const path = require('path');

const CWD = process.cwd();
let cfg = {};
try {
    cfg = require(path.join(CWD, 'config.json'));
} catch (e) {
    console.error('Failed to load config.json:', e.message || e);
}

const uri = process.env.MONGO_URI || cfg.mongoCloudConnection || cfg.mongoConnection;
if (!uri) {
    console.error('No mongo URI found in config.json or MONGO_URI env var.');
    process.exit(1);
}

function extractHostFromSrvUri(uriStr) {
    const m = uriStr.match(/^[^@]+@?([^/]+)(?:\/|$)/);
    if (!m) return null;
    let host = m[1];
    host = host.split('?')[0];
    host = host.split(':')[0];
    return host;
}

function resolveSrv(host) {
    return new Promise((resolve) => {
        dns.resolveSrv(`_mongodb._tcp.${host}`, (err, records) => {
            if (err) return resolve({ error: err });
            resolve(records);
        });
    });
}

function inspectTls(host, port = 27017, timeout = 8000) {
    return new Promise((resolve) => {
        const opts = {
            host,
            port,
            servername: host,
            rejectUnauthorized: false,
            timeout,
        };

        const socket = tls.connect(opts, function () {
            try {
                const peer = socket.getPeerCertificate(true);
                const protocol = socket.getProtocol();
                const cipher = socket.getCipher();
                resolve({ ok: true, peer, protocol, cipher });
            } catch (e) {
                resolve({ ok: false, error: e && e.stack ? e.stack : String(e) });
            } finally {
                socket.end();
            }
        });

        socket.on('error', (err) => {
            resolve({ ok: false, error: err && err.stack ? err.stack : String(err) });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({ ok: false, error: 'timeout' });
        });
    });
}

(async function main() {
    console.log('tls-inspect starting for URI (hidden)');
    const host = extractHostFromSrvUri(uri);
    if (!host) {
        console.error('Could not extract host from URI');
        process.exit(1);
    }

    const srv = await resolveSrv(host);
    if (srv && srv.error) {
        console.log('SRV resolve error:', srv.error);
        process.exit(1);
    }

    console.log('SRV records:');
    console.log(srv);

    for (const r of srv) {
        const name = r.name;
        const port = r.port || 27017;
        console.log(`\n--- Inspecting ${name}:${port} ---`);

        // First test TCP
        const tcpOk = await new Promise((res) => {
            const s = net.connect({ host: name, port, timeout: 5000 }, () => {
                s.end();
                res({ ok: true });
            });
            s.on('error', (e) => res({ ok: false, error: String(e) }));
            s.on('timeout', () => { s.destroy(); res({ ok: false, error: 'timeout' }); });
        });
        console.log('TCP:', tcpOk);

        // Then TLS inspect
        const res = await inspectTls(name, port, 8000);
        if (res.ok) {
            console.log('TLS protocol:', res.protocol);
            console.log('TLS cipher:', res.cipher);
            console.log('Peer certificate subject:', res.peer && res.peer.subject);
            console.log('Peer certificate issuer:', res.peer && res.peer.issuer);
        } else {
            console.log('TLS handshake error:', res.error);
        }
    }

    console.log('\nDone');
})();
