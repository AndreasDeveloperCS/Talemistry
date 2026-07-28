import mammoth from "mammoth"

const files = [
  "data/Recruitment_Platform-Features_and_Roadmap-5a0355.docx",
  "data/Talemistry_Brand_Book_v1.0-e18f09.docx",
]

for (const path of files) {
  const { value } = await mammoth.extractRawText({ path })
  console.log("\n\n========== " + path + " ==========\n")
  console.log(value)
}
