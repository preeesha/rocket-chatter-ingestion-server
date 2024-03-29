import { closeDBConnection, verifyConnectivity } from "./core/neo4j"
import { insertStyleguides } from "./core/styleguides"
import { insertDataIntoDB } from "./ingestion/ingest"
import { processCodebase } from "./ingestion/prepare"

const DIR = [
	//
	"/home/yogesh/Desktop/Rocket.Chat",
	"./project2",
]

async function main() {
	await verifyConnectivity()

	const nodes = await processCodebase(DIR.at(-1)!, "ingested")

	// const nodes = JSON.parse(readFileSync("ingested.data.json", "utf-8"))
	await insertDataIntoDB(nodes)

	await insertStyleguides()
	closeDBConnection()
}

main()
