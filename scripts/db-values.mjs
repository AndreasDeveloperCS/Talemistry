import mongoose from "mongoose"
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 12000 })
const db = mongoose.connection.db
const tpp = db.collection("talent-pipeline-progress")
console.log("== distinct status ==", await tpp.distinct("status"))
console.log("== distinct stageName ==", await tpp.distinct("stageName"))
console.log("== distinct stageType ==", await tpp.distinct("stageType"))
console.log("== distinct finalDecision ==", await tpp.distinct("finalDecision"))
console.log("== distinct positionName ==", (await tpp.distinct("positionName")).slice(0,20))
const one = await tpp.find({}).limit(2).toArray()
console.log("== 2 sample docs ==")
console.log(JSON.stringify(one, null, 1).slice(0, 1600))
console.log("\n== users roles distribution ==")
const users = await db.collection("users").find({}, {projection:{firstname:1,lastname:1,role:1,title:1}}).toArray()
const roleCount = {}
for (const u of users) for (const r of (u.role||[])) roleCount[r]=(roleCount[r]||0)+1
console.log(roleCount)
console.log("== sample users ==", users.slice(0,8).map(u=>`${u.firstname||''} ${u.lastname||''} [${(u.role||[]).join(',')}]`))
console.log("\n== roles codes ==", (await db.collection("roles").find({},{projection:{code:1,description:1}}).toArray()).map(r=>r.code))
await mongoose.disconnect()
