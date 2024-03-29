import { closeDBConnection, verifyConnectivity } from "./core/neo4j"
import { insertStyleguides } from "./core/styleguides"
import { insertDataIntoDB } from "./ingestion/ingest"
import { processCodebase } from "./ingestion/prepare"

const DIR = [
	//
	"./project2",
	"/home/yogesh/Desktop/Rocket.Chat",
]

async function main() {
	const startTime = Date.now()
	{
		await verifyConnectivity()
		{
			const nodes = await processCodebase(DIR.at(-1)!, "ingested")
			// const nodes = JSON.parse(readFileSync("ingested.data.json", "utf-8"))
			await insertDataIntoDB(nodes)
			await insertStyleguides()
		}
		closeDBConnection()
	}
	const endTime = Date.now()

	console.log("🕒 Done in", (endTime - startTime) / 1000, "seconds")
}

main()
