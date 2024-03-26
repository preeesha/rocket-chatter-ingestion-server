import { Request, Response } from "express"

import { insertDataIntoDB } from "../ingestion/ingest"
import { processCodebase } from "../ingestion/prepare"

const DIR = ["./project"]

export async function ingestRoute(_: Request, res: Response) {
	const nodes = await processCodebase(DIR.at(-1)!, "ingested")
	await insertDataIntoDB(nodes)

	res.json("OK")
}
