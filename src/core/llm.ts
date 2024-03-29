import OpenAI from "openai"
import { OPENAI_KEY } from "../constants"

const openai = new OpenAI({ apiKey: OPENAI_KEY })

const MAX_CALLS_PER_INTERVAL = 2800

type EmbedQueueItem = {
	data: string
	resolve: (value: number[]) => any
}

export namespace LLM {
	const queue: EmbedQueueItem[] = []
	let lastMinute = new Date().getMinutes()

	let executeCount = 0
	let executeQueueStatus: NodeJS.Timeout | null = null

	async function executeQueue() {
		/* HANDLE RATE LIMITING */
		{
			const now = new Date().getMinutes()
			if (now === lastMinute) {
				if (executeQueueStatus) clearTimeout(executeQueueStatus)
				executeQueueStatus = setTimeout(() => {
					executeQueue()
				}, 5000)
				return
			}
			lastMinute = now
		}

		/* GENERATING EMBEDDINGS */
		{
			const items = queue.splice(0, MAX_CALLS_PER_INTERVAL)

			executeCount += items.length
			console.log(executeCount, items.length, queue.length)

			await Promise.allSettled(
				items.map((x) => async () => {
					try {
						const content = await openai.embeddings.create({
							input: x.data,
							model: "text-embedding-3-small",
							dimensions: 768,
							encoding_format: "float",
						})
						x.resolve(content.data[0].embedding)
					} catch (e) {
						console.error(e)
						console.log(x.data)
						x.resolve(new Array(768).fill(0))
					}
				})
			)
		}
	}

	export async function generateEmbeddings(data: string): Promise<number[]> {
		return new Promise((resolve) => {
			if (!data) return resolve(new Array(768).fill(0))
			queue.push({ data: data.trim(), resolve })
			executeQueue()
		})
	}
}
