import { insertStyleguides } from "./core/styleguides"
import { insertDataIntoDB } from "./ingestion/ingest"
import { prepareCodebase, prepareNodesEmbeddings } from "./ingestion/prepare"

const DIR = [
	//
	"/home/yogesh/Desktop/Rocket.Chat",
	// "./project",
	"./project2",
]

async function main() {
	const startTime = Date.now()
	{
		const batchSize = 250
		await prepareCodebase(DIR.at(-1)!, batchSize)
		await prepareNodesEmbeddings("data", batchSize)

		await insertDataIntoDB(batchSize)
		await insertStyleguides()
	}
	const endTime = Date.now()

	console.log("🕒 Done in", (endTime - startTime) / 1000, "seconds")
}

main()
