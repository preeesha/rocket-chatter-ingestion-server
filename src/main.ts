import cors from "cors"
import express from "express"
import { PORT } from "./constants"
import { healthRoute } from "./routes/health"
import { ingestRoute } from "./routes/ingest"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: "*" }))

app.get("/health", healthRoute)
app.post("/ingest", ingestRoute)

app.listen(PORT, () =>
	console.log(`🚀 Server running on port http://localhost:${PORT}`)
)

// import { insertDataIntoDB } from "./ingestion/ingest"
// import { processCodebase } from "./ingestion/prepare"

// const DIR = ["./project", "/home/yogesh/Desktop/Rocket.Chat"]

// async function main() {
// 	const nodes = await processCodebase(DIR.at(-1)!, "ingested")
// 	// const nodes = JSON.parse(readFileSync("ingested.data.json", "utf-8"))
// 	await insertDataIntoDB(nodes)
// }

// main()
