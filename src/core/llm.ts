import OpenAI from "openai"
import { OPENAI_KEY } from "../constants"

const openai = new OpenAI({ apiKey: OPENAI_KEY })

export namespace LLM {
	export async function generateEmbeddings(name: string): Promise<number[]> {
		return []
		const content = await openai.embeddings.create({
			model: "text-embedding-3-small",
			input: name,
			dimensions: 768,
			encoding_format: "float",
		})

		return content.data[0].embedding
	}
}
