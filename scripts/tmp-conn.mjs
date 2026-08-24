import mongoose from "mongoose"
function repair(u){ u=(u||"").trim().replace(/^['"]|['"]$/g,""); if(/^mongodb(\+srv)?:\/\//.test(u))return u; const i=u.indexOf("+srv://"); if(i!==-1)return "mongodb"+u.slice(i); return u }
const u = repair(process.env.MONGODB_CONNECTION_STRING)
// show host only, never credentials
const host = (u.match(/@([^/?]+)/)||[])[1] || "?"
console.log("target host:", host)
try {
  const c = await mongoose.createConnection(u, { dbName:"talemistry", serverSelectionTimeoutMS: 12000 }).asPromise()
  console.log("CONNECTED ok, db:", c.db.databaseName)
  await c.close()
} catch(e){ console.log("ERR:", e.message.slice(0,180)) }
process.exit(0)
