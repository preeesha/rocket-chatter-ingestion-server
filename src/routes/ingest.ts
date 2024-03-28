import { Request, Response } from "express"

import { insertStyleguides } from "../core/styleguides"
import { insertDataIntoDB } from "../ingestion/ingest"
import { processCodebase } from "../ingestion/prepare"

const DIR = ["./project"]

export async function ingestRoute(_: Request, res: Response) {
	const startTime = Date.now()

	const nodes = await processCodebase(DIR.at(-1)!, "ingested")
	await insertDataIntoDB(nodes)

	await insertStyleguides()

	const endTime = Date.now()

	res.status(200).send({
		status: 200,
		message: "INGESTION SUCCESSFUL",
		timeTaken: `${(endTime - startTime) / 1000}s`,
	})
}
