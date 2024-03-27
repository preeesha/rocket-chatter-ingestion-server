import cliProgress from "cli-progress"
import { Transaction } from "neo4j-driver"
import { DBNode } from "../core/dbNode"
import { db, verifyConnectivity } from "../core/neo4j"

namespace Helpers {
	export function prepareProgressBar(total: number) {
		const bar = new cliProgress.Bar(
			{
				etaBuffer: 1,
				forceRedraw: true,
				fps: 60,
				format:
					"Inserting nodes [{bar}] {percentage}% | {value}/{total} | {duration}s",
			},
			cliProgress.Presets.legacy
		)
		bar.start(total, 0)
		return bar
	}

	export async function insertNode(tx: Transaction, node: DBNode) {
		const query = `CREATE (n:Node {
			id: $id,
			name: $name,
			kind: $kind,
			type: $type,
			text: $text,
			comments: $comments,
			filePath: $filePath,

			embeddings: $embeddings
		}) RETURN n`
		try {
			await tx.run(query, node)
		} catch (e) {
			console.error(e, query, node)
		}
	}

	export async function establishRelation(
		tx: Transaction,
		sourceID: string,
		targetID: string,
		relation: string
	) {
		const query = [
			`MATCH (n { id: $sourceID })`,
			`MATCH (m { id: $targetID })`,
			`CREATE (n)-[:${relation}]->(m)\n`,
		].join("\n")
		try {
			await tx.run(query, { sourceID, targetID })
		} catch (e) {
			console.error(e)
		}
	}
}

namespace Algorithms {
	export async function emptyDB(tx: Transaction, progressBar: cliProgress.Bar) {
		const query = `MATCH (n) DETACH DELETE n`
		try {
			await tx.run(query)
		} catch {
			console.error("Failed to empty DB")
		}

		progressBar.increment()
	}

	export async function insertNodes(
		tx: Transaction,
		nodes: DBNode[],
		progressBar: cliProgress.Bar
	) {
		await Promise.all(
			nodes.map(async (node) => {
				await Helpers.insertNode(tx, node)
				progressBar.increment()
			})
		)
	}

	export async function establishRelations(
		tx: Transaction,
		nodes: DBNode[],
		progressBar: cliProgress.Bar
	) {
		const jobs: Promise<any>[] = []
		for (const node of nodes) {
			for (const relation of node.relations) {
				const job = Helpers.establishRelation(
					tx,
					node.id,
					relation.target,
					relation.relation
				).then(() => {
					progressBar.increment()
				})
				jobs.push(job)
			}
		}
		await Promise.all(jobs)
	}
}

export async function insertDataIntoDB(data: Record<string, DBNode>) {
	console.log(await verifyConnectivity())

	console.log("🕒 Inserting")

	const tx = db.beginTransaction()
	const nodes = Object.values(data)
	const totalOperations =
		nodes.length + nodes.map((x) => x.relations).flat().length + 1

	// -----------------------------------------------------------------------------------

	const progressBar = Helpers.prepareProgressBar(totalOperations)

	await Algorithms.emptyDB(tx, progressBar)
	await Algorithms.insertNodes(tx, nodes, progressBar)
	await Algorithms.establishRelations(tx, nodes, progressBar)

	progressBar.stop()

	// -----------------------------------------------------------------------------------

	try {
		console.log("Committing transaction")
		await tx.commit()
	} catch (e) {
		console.error(e)
		await tx.rollback()
	}

	console.log("✅ Inserted")
}
