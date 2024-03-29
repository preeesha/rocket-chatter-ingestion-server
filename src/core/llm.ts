import OpenAI from "openai"
import { OPENAI_KEY } from "../constants"

const openai = new OpenAI({ apiKey: OPENAI_KEY })

const INTERVAL_MS = 60_000
const MAX_CALLS_PER_INTERVAL = 2200

export namespace LLM {
	let proceed = 0
	let waitCounter = 0
	let tokenBucket = MAX_CALLS_PER_INTERVAL
	let lastRefillTimestamp = Date.now()

	export async function generateEmbeddings(data: string): Promise<number[]> {
		if (tokenBucket-- < 0) {
			// Bucket empty, wait for refill
			const now = Date.now()
			if (now - lastRefillTimestamp > INTERVAL_MS) {
				tokenBucket = MAX_CALLS_PER_INTERVAL // Refill bucket
				lastRefillTimestamp = now
			} else {
				waitCounter++
				const waitTime =
					INTERVAL_MS * (Math.trunc(waitCounter / MAX_CALLS_PER_INTERVAL) + 1)
				await new Promise((resolve) => setTimeout(resolve, waitTime))
				--waitCounter
			}
		}

		console.log("Proceed", ++proceed)

		const content = await openai.embeddings.create({
			input: data,
			model: "text-embedding-3-small",
			dimensions: 768,
			encoding_format: "float",
		})

		return content.data[0].embedding
	}
}
