// test-mongo.js
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
if (!uri) {
    console.error('MONGO_URI is not set');
    process.exit(1);
}

(async () => {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        const result = await client.db().admin().ping();
        console.log('✅ Ping result:', result);
    } catch (err) {
        console.error('❌ Test connection failed:');
        console.error(err);
    } finally {
        await client.close();
    }
})();
