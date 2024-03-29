import { writeFileSync } from "fs"
import { DBNode } from "./core/dbNode"
import { insertStyleguides } from "./core/styleguides"
import { insertDataIntoDB } from "./ingestion/ingest"
import { prepareCodebase, prepareNodesEmbeddings } from "./ingestion/prepare"

const DIR = [
	//
	"./project2",
	"/home/yogesh/Desktop/Rocket.Chat",
]

async function main() {
	const startTime = Date.now()
	{
		let nodes: Record<string, DBNode> = {}
		nodes = await prepareCodebase(DIR.at(-1)!)
		writeFileSync("ingested.data.json", JSON.stringify(nodes, null, 2))
		// nodes = await prepareNodesEmbeddings(nodes)
		// writeFileSync("embedded.data.json", JSON.stringify(nodes, null, 2))

		// await insertDataIntoDB(nodes)
		// await insertStyleguides()
	}
	const endTime = Date.now()

	console.log("🕒 Done in", (endTime - startTime) / 1000, "seconds")
}

main()
