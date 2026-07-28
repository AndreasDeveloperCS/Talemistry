import mongoose from "mongoose"
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 12000 })
const db = mongoose.connection.db
const tpp = db.collection("talent-pipeline-progress")
const talentIds = await tpp.distinct("talentId")
console.log("distinct talentIds in pipeline:", talentIds.length)
// how many map to a talent-profile?
const tp = db.collection("talent-profile")
const cp = db.collection("candidate-profile")
let matchTp=0, matchCp=0
for (const t of talentIds) {
  const idStr = String(t)
  const a = await tp.findOne({ $or: [ {userId: t}, {userId: idStr}, {"user._id": idStr} ] })
  if (a) matchTp++
  const b = await cp.findOne({ $or: [ {userId: idStr}, {"user._id": idStr} ] })
  if (b) matchCp++
}
console.log("talentIds matching talent-profile:", matchTp, "candidate-profile:", matchCp)
// sample skill shape
const sp = await tp.findOne({})
console.log("talent-profile.skills sample:", JSON.stringify((sp?.skills||sp?.hardSkills||[]).slice(0,3)))
console.log("skills taxonomy types:", await db.collection("skills").distinct("skillType"))
console.log("createdBy distinct in pipeline:", (await tpp.distinct("createdBy")).length)
// month spread
const dates = await tpp.find({},{projection:{createdDate:1}}).toArray()
const months = {}
for (const d of dates){ const dt=new Date(d.createdDate); const k=dt.getFullYear()+'-'+(dt.getMonth()+1); months[k]=(months[k]||0)+1 }
console.log("createdDate month spread:", months)
await mongoose.disconnect()
