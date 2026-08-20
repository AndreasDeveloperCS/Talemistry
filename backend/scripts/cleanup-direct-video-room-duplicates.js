/*
 * One-time admin cleanup for legacy duplicate DIRECT video rooms.
 *
 * Goal:
 * - Keep the canonical room whose _id matches the DIRECT chat-room _id for the same participant pair.
 * - Archive or delete other duplicate DIRECT video rooms for that pair.
 * - Keep participant records in sync.
 *
 * Safe defaults:
 * - Default mode is dry-run (no writes).
 *
 * Usage examples:
 *   node scripts/cleanup-direct-video-room-duplicates.js
 *   node scripts/cleanup-direct-video-room-duplicates.js --archive
 *   node scripts/cleanup-direct-video-room-duplicates.js --delete --yes
 *
 * Optional:
 *   MONGO_URI=<uri> node scripts/cleanup-direct-video-room-duplicates.js --archive
 */

const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

function parseArgs(argv) {
    const args = new Set(argv.slice(2));
    const mode = args.has('--delete')
        ? 'delete'
        : args.has('--archive')
            ? 'archive'
            : 'dry-run';

    return {
        mode,
        yes: args.has('--yes'),
        verbose: args.has('--verbose'),
    };
}

function loadConfig() {
    try {
        // scripts/* -> backend/config.json
        // eslint-disable-next-line import/no-dynamic-require, global-require
        return require(path.join(__dirname, '..', 'config.json'));
    } catch {
        return {};
    }
}

function resolveMongoUri(config) {
    return process.env.MONGO_URI || config.mongoCloudConnection || config.mongoConnection || '';
}

function resolveDbName(uri, config) {
    if (config.cloudDBName) {
        return String(config.cloudDBName).trim();
    }

    try {
        const parsed = new URL(uri);
        return String(parsed.pathname || '').replace(/^\//, '').trim() || 'evryka';
    } catch {
        return 'evryka';
    }
}

function asObjectId(value) {
    if (!value) return null;
    if (value instanceof ObjectId) return value;

    const raw = String(value).trim();
    if (!ObjectId.isValid(raw)) return null;
    return new ObjectId(raw);
}

function idToString(value) {
    if (!value) return '';
    if (value instanceof ObjectId) return value.toHexString();
    return String(value).trim();
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function toTs(value) {
    if (!value) return 0;
    const d = new Date(value);
    const t = d.getTime();
    return Number.isFinite(t) ? t : 0;
}

function makePairKey(tokens) {
    const unique = Array.from(new Set((tokens || []).map((t) => String(t || '').trim().toLowerCase()).filter(Boolean))).sort();
    if (unique.length !== 2) {
        return '';
    }
    return unique.join('|');
}

function getPairKeyFromChatRoom(room, userEmailById) {
    const participants = Array.isArray(room?.participants) ? room.participants : [];
    const emailTokens = participants
        .map((p) => normalizeEmail(userEmailById.get(idToString(p?.userId))))
        .filter(Boolean);

    const emailKey = makePairKey(emailTokens);
    if (emailKey) return emailKey;

    const userIdTokens = participants
        .map((p) => idToString(p?.userId))
        .filter(Boolean);

    return makePairKey(userIdTokens);
}

function getPairKeyFromVideoParticipants(participants) {
    const list = Array.isArray(participants) ? participants : [];

    const emailTokens = list
        .map((p) => normalizeEmail(p?.email))
        .filter(Boolean);

    const emailKey = makePairKey(emailTokens);
    if (emailKey) return emailKey;

    const userIdTokens = list
        .map((p) => idToString(p?.userId))
        .filter(Boolean);

    return makePairKey(userIdTokens);
}

async function main() {
    const args = parseArgs(process.argv);
    const config = loadConfig();
    const uri = resolveMongoUri(config);

    if (!uri) {
        console.error('No Mongo URI found. Set MONGO_URI or provide backend/config.json mongoCloudConnection/mongoConnection.');
        process.exit(1);
    }

    if (args.mode === 'delete' && !args.yes) {
        console.error('Refusing to delete without --yes confirmation.');
        process.exit(1);
    }

    const dbName = resolveDbName(uri, config);
    const client = new MongoClient(uri, {
        tls: true,
        tlsAllowInvalidCertificates: true,
        serverSelectionTimeoutMS: 20000,
    });

    console.log('[cleanup] mode:', args.mode);
    console.log('[cleanup] db:', dbName);

    try {
        await client.connect();
        const db = client.db(dbName);

        const chatRoomsCol = db.collection('chat-rooms');
        const usersCol = db.collection('users');
        const videoRoomsCol = db.collection('video-chat-rooms');
        const videoParticipantsCol = db.collection('video-chat-room-participants');

        const directChatRooms = await chatRoomsCol
            .find({ type: 'direct' }, { projection: { _id: 1, participants: 1, createdDate: 1, modifiedDate: 1 } })
            .toArray();

        const allUserIds = new Set();
        for (const room of directChatRooms) {
            for (const participant of (room.participants || [])) {
                const id = idToString(participant?.userId);
                if (id) allUserIds.add(id);
            }
        }

        const userIdObjs = Array.from(allUserIds)
            .map((id) => asObjectId(id))
            .filter(Boolean);

        const users = userIdObjs.length
            ? await usersCol
                .find({ _id: { $in: userIdObjs } }, { projection: { _id: 1, email: 1 } })
                .toArray()
            : [];

        const userEmailById = new Map(users.map((u) => [idToString(u._id), normalizeEmail(u.email)]));

        const canonicalChatRoomByPair = new Map();
        for (const room of directChatRooms) {
            const pairKey = getPairKeyFromChatRoom(room, userEmailById);
            if (!pairKey) continue;

            const existing = canonicalChatRoomByPair.get(pairKey);
            if (!existing) {
                canonicalChatRoomByPair.set(pairKey, room);
                continue;
            }

            const existingTs = Math.max(toTs(existing.modifiedDate), toTs(existing.createdDate));
            const candidateTs = Math.max(toTs(room.modifiedDate), toTs(room.createdDate));
            if (candidateTs >= existingTs) {
                canonicalChatRoomByPair.set(pairKey, room);
            }
        }

        const directVideoRooms = await videoRoomsCol
            .find({ type: 'direct' }, { projection: { _id: 1, type: 1, name: 1, createdDate: 1, modifiedDate: 1 } })
            .toArray();

        const directVideoRoomIds = directVideoRooms.map((room) => room._id);

        const videoParticipants = directVideoRoomIds.length
            ? await videoParticipantsCol
                .find({ videoChatRoomId: { $in: directVideoRoomIds } }, { projection: { _id: 1, videoChatRoomId: 1, email: 1, userId: 1 } })
                .toArray()
            : [];

        const participantsByRoomId = new Map();
        for (const participant of videoParticipants) {
            const roomId = idToString(participant.videoChatRoomId);
            if (!participantsByRoomId.has(roomId)) {
                participantsByRoomId.set(roomId, []);
            }
            participantsByRoomId.get(roomId).push(participant);
        }

        const groupsByPair = new Map();
        const unresolvedRooms = [];

        for (const room of directVideoRooms) {
            const roomId = idToString(room._id);
            const pairParticipants = participantsByRoomId.get(roomId) || [];
            const pairKey = getPairKeyFromVideoParticipants(pairParticipants);

            if (!pairKey) {
                unresolvedRooms.push(roomId);
                continue;
            }

            if (!groupsByPair.has(pairKey)) {
                groupsByPair.set(pairKey, []);
            }
            groupsByPair.get(pairKey).push({ room, participants: pairParticipants });
        }

        const cleanupPlan = [];
        const needsManualReview = [];

        for (const [pairKey, groupedRooms] of groupsByPair.entries()) {
            if (groupedRooms.length < 2) {
                continue;
            }

            const canonicalChatRoom = canonicalChatRoomByPair.get(pairKey);
            const canonicalId = canonicalChatRoom ? idToString(canonicalChatRoom._id) : '';

            if (!canonicalId) {
                needsManualReview.push({ pairKey, reason: 'no-direct-chat-room', roomIds: groupedRooms.map((g) => idToString(g.room._id)) });
                continue;
            }

            const canonicalVideoRoom = groupedRooms.find((entry) => idToString(entry.room._id) === canonicalId);
            if (!canonicalVideoRoom) {
                needsManualReview.push({
                    pairKey,
                    reason: 'canonical-video-room-missing',
                    canonicalChatRoomId: canonicalId,
                    roomIds: groupedRooms.map((g) => idToString(g.room._id)),
                });
                continue;
            }

            const duplicates = groupedRooms
                .map((entry) => entry.room)
                .filter((room) => idToString(room._id) !== canonicalId)
                .sort((a, b) => Math.max(toTs(b.modifiedDate), toTs(b.createdDate)) - Math.max(toTs(a.modifiedDate), toTs(a.createdDate)));

            if (!duplicates.length) {
                continue;
            }

            cleanupPlan.push({
                pairKey,
                canonicalId,
                duplicateIds: duplicates.map((room) => idToString(room._id)),
            });
        }

        const duplicateIds = cleanupPlan.flatMap((item) => item.duplicateIds);
        const duplicateObjectIds = duplicateIds.map((id) => asObjectId(id)).filter(Boolean);

        console.log('[cleanup] direct chat pairs:', canonicalChatRoomByPair.size);
        console.log('[cleanup] direct video rooms:', directVideoRooms.length);
        console.log('[cleanup] duplicate groups:', cleanupPlan.length);
        console.log('[cleanup] duplicate rooms:', duplicateIds.length);
        console.log('[cleanup] unresolved direct video rooms (missing 2-participant key):', unresolvedRooms.length);
        console.log('[cleanup] manual review groups:', needsManualReview.length);

        if (args.verbose) {
            console.log('\n[cleanup] plan:');
            for (const item of cleanupPlan) {
                console.log(`- pair=${item.pairKey}`);
                console.log(`  keep=${item.canonicalId}`);
                console.log(`  drop=${item.duplicateIds.join(', ')}`);
            }

            if (needsManualReview.length) {
                console.log('\n[cleanup] manual-review groups:');
                for (const item of needsManualReview) {
                    console.log(`- pair=${item.pairKey} reason=${item.reason}`);
                    console.log(`  rooms=${(item.roomIds || []).join(', ')}`);
                    if (item.canonicalChatRoomId) {
                        console.log(`  expectedCanonical=${item.canonicalChatRoomId}`);
                    }
                }
            }
        }

        if (!duplicateObjectIds.length) {
            console.log('[cleanup] nothing to clean.');
            return;
        }

        if (args.mode === 'dry-run') {
            console.log('[cleanup] dry-run complete. No data changed.');
            return;
        }

        if (args.mode === 'archive') {
            const now = new Date();
            const roomUpdate = await videoRoomsCol.updateMany(
                { _id: { $in: duplicateObjectIds } },
                {
                    $set: {
                        isArchived: true,
                        archivedAt: now,
                        archivedReason: 'legacy-direct-room-duplicate',
                    },
                },
            );

            const participantUpdate = await videoParticipantsCol.updateMany(
                { videoChatRoomId: { $in: duplicateObjectIds } },
                {
                    $set: {
                        isArchived: true,
                        archivedAt: now,
                        archivedReason: 'legacy-direct-room-duplicate',
                    },
                },
            );

            console.log('[cleanup] archived rooms:', roomUpdate.modifiedCount);
            console.log('[cleanup] archived participants:', participantUpdate.modifiedCount);
            return;
        }

        if (args.mode === 'delete') {
            const participantDelete = await videoParticipantsCol.deleteMany({
                videoChatRoomId: { $in: duplicateObjectIds },
            });

            const roomDelete = await videoRoomsCol.deleteMany({
                _id: { $in: duplicateObjectIds },
            });

            console.log('[cleanup] deleted participants:', participantDelete.deletedCount);
            console.log('[cleanup] deleted rooms:', roomDelete.deletedCount);
            return;
        }
    } catch (error) {
        console.error('[cleanup] failed:', error);
        process.exitCode = 1;
    } finally {
        await client.close();
    }
}

main();
