import { Request, Response } from "express"

export async function ingestRoute(req: Request, res: Response) {
	console.log("REQUEST:", req.body)

	const query = req.body.query

	res.json("OK")

	// await resolveQuery(query).then((result) => res.json(result))
}
