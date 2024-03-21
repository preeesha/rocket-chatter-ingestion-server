import cors from "cors"
import express from "express"
import { ingestRoute } from "./routes/ingest"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: "*" }))

app.post("/ingest", ingestRoute)

app.listen(4000, () =>
	console.log("Server running on port http://localhost:4000")
)
