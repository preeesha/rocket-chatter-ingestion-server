import { insertStyleguides } from "./core/styleguides"

const DIR = [
	//
	"/home/yogesh/Desktop/Rocket.Chat",
	"./project",
]

async function main() {
	// const nodes = await processCodebase(DIR.at(-1)!, "ingested")
	// // const nodes = JSON.parse(readFileSync("ingested.data.json", "utf-8"))
	// await insertDataIntoDB(nodes)

	await insertStyleguides()
}

main()
