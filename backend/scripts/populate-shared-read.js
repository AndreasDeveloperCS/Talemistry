// Simple migration script to populate sharedReadEmails and sharedReadIds
// Usage: node populate-shared-read.js [mongoUri]

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function main() {
  const provided = process.argv[2];
  let mongoUri = provided;
  if (!mongoUri) {
    try {
      const cfg = require('../config.json');
      mongoUri = cfg.mongoConnection || cfg.mongoCloudConnection;
    } catch (e) {
      console.error('No config.json found and no URI provided. Exiting.');
      process.exit(1);
    }
  }

  const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const dbName = (() => {
    try {
      const cfg = require('../config.json');
      return cfg.cloudDBName || (new URL(mongoUri).pathname.replace('/', '')) || 'evryka';
    } catch { return 'evryka'; }
  })();

  const db = client.db(dbName);
  const col = db.collection('video-chat-rooms');

  console.log('Scanning video-chat-rooms...');
  const cursor = col.find({});
  let count = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const participants = Array.isArray(doc.participants) ? doc.participants : [];
    const emails = Array.from(new Set(participants.map(p => (p && p.email ? String(p.email).trim().toLowerCase() : null)).filter(Boolean)));
    const ids = Array.from(new Set(participants.map(p => (p && p.userId ? (p.userId._bsontype ? p.userId : (ObjectId.isValid(String(p.userId)) ? new ObjectId(String(p.userId)) : null)) : null)).filter(Boolean)));

    const update = {};
    if (emails.length) update.sharedReadEmails = emails;
    if (ids.length) update.sharedReadIds = ids;

    if (Object.keys(update).length) {
      await col.updateOne({ _id: doc._id }, { $set: update });
      count++;
    }
  }

  console.log('Updated', count, 'documents');
  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
