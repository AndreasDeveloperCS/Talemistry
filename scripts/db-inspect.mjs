import mongoose from "mongoose"

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error("NO_URI")
  process.exit(2)
}

function shape(doc, depth = 0) {
  if (doc === null) return "null"
  if (Array.isArray(doc)) return `Array<${doc.length ? shape(doc[0], depth + 1) : "any"}>`
  if (doc instanceof Date) return "Date"
  if (typeof doc === "object") {
    if (doc._bsontype === "ObjectId") return "ObjectId"
    if (depth > 1) return "Object"
    const keys = Object.keys(doc).slice(0, 40)
    return "{ " + keys.map((k) => `${k}: ${shape(doc[k], depth + 1)}`).join(", ") + " }"
  }
  return typeof doc
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 })
  const db = mongoose.connection.db
  console.log("DB:", db.databaseName)
  const cols = (await db.listCollections().toArray()).map((c) => c.name).sort()
  console.log("TOTAL_COLLECTIONS:", cols.length)

  // Focus collections most relevant to the Talemistry UI
  const focus = process.argv.slice(2).length
    ? process.argv.slice(2)
    : cols

  for (const name of focus) {
    if (!cols.includes(name)) continue
    const coll = db.collection(name)
    const count = await coll.estimatedDocumentCount()
    const sample = await coll.findOne({})
    console.log("\n===== " + name + " (count~" + count + ") =====")
    console.log(sample ? shape(sample) : "(empty)")
  }
  await mongoose.disconnect()
  process.exit(0)
} catch (e) {
  console.error("ERR:", e.message)
  process.exit(1)
}
