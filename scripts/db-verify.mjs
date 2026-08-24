import mongoose from "mongoose"
async function check(label, uri) {
  if (!uri) { console.log(label, "MISSING_URI"); return }
  try {
    const c = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 9000 }).asPromise()
    const cols = await c.db.listCollections().toArray()
    console.log(label, "OK db=" + c.db.databaseName, "collections=" + cols.length)
    await c.close()
  } catch (e) { console.log(label, "ERR:", e.message) }
}
await check("[SOURCE evryka]", process.env.MONGODB_URI)
await check("[TARGET talemistry]", process.env.TALEMISTRY_MONGODB_URI)
process.exit(0)
