import { Request, Response } from "express"

import { writeFileSync } from "fs"
import { DBNode } from "../core/dbNode"
import { insertStyleguides } from "../core/styleguides"
import { insertDataIntoDB } from "../ingestion/ingest"
import { prepareCodebase, prepareNodesEmbeddings } from "../ingestion/prepare"

const DIR = ["./project"]

export async function ingestRoute(_: Request, res: Response) {
	const startTime = Date.now()

	let nodes: Record<string, DBNode> = {}
	nodes = await prepareCodebase(DIR.at(-1)!)
	nodes = await prepareNodesEmbeddings(nodes)
	writeFileSync("ingested.data.json", JSON.stringify(nodes, null, 2))

	await insertDataIntoDB(nodes)
	await insertStyleguides()

	const endTime = Date.now()

	res.status(200).send({
		status: 200,
		message: "INGESTION SUCCESSFUL",
		timeTaken: `${(endTime - startTime) / 1000}s`,
	})
}
