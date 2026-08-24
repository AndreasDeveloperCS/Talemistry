import mongoose from "mongoose"

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error("NO_URI")
  process.exit(2)
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 9000 })
  const db = mongoose.connection.db.databaseName
  const cols = await mongoose.connection.db.listCollections().toArray()
  console.log("CONNECTED db=" + db + " collections=[" + cols.map((c) => c.name).join(",") + "]")
  await mongoose.disconnect()
  process.exit(0)
} catch (e) {
  console.error("CONN_ERR:", e.message)
  process.exit(1)
}
