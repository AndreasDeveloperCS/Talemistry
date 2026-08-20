/**
 * One-time script: Set isOpenMeeting=true on the "Brainstorming" video-chat room
 * Room _id: 693952a5c331d0b0bedcf01e
 *
 * Usage: node scripts/set-open-meeting.js
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not set');
    process.exit(1);
}

const ROOM_ID = '693952a5c331d0b0bedcf01e';

async function main() {
    const client = new MongoClient(MONGO_URI, {
        tls: true,
        tlsAllowInvalidCertificates: true,
        serverSelectionTimeoutMS: 15000,
    });

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('evryka');
        const collection = db.collection('video-chat-rooms');

        // Find room first
        const room = await collection.findOne({ _id: new ObjectId(ROOM_ID) });
        if (!room) {
            console.error('Room not found:', ROOM_ID);
            process.exit(1);
        }

        console.log('Found room:', { _id: room._id, name: room.name, type: room.type, isOpenMeeting: room.isOpenMeeting });

        // Update
        const result = await collection.updateOne(
            { _id: new ObjectId(ROOM_ID) },
            { $set: { isOpenMeeting: true } },
        );

        console.log('Update result:', { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });

        // Verify
        const updated = await collection.findOne({ _id: new ObjectId(ROOM_ID) });
        console.log('Updated room:', { _id: updated._id, name: updated.name, type: updated.type, isOpenMeeting: updated.isOpenMeeting });
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    } finally {
        await client.close();
    }
}

main();
