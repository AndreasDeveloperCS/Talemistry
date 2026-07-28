import mongoose from "mongoose"
const uri = process.env.MONGODB_URI
await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 })
const db = mongoose.connection.db
const cols = (await db.listCollections().toArray()).map(c=>c.name).sort()
const rows = []
for (const name of cols) {
  const c = await db.collection(name).estimatedDocumentCount()
  rows.push([name, c])
}
rows.sort((a,b)=>b[1]-a[1])
for (const [n,c] of rows) console.log(String(c).padStart(7), n)
await mongoose.disconnect()
