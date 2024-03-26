import { writeFileSync } from "fs"
import { Node, Project, SourceFile, ts } from "ts-morph"
import { DBNode } from "../core/dbNode"
import { TreeNode, notFoundKindNames } from "../core/treeNode"
import { RefNode } from "./prepare.types"

let nodes: Record<string, DBNode> = {}

const kindNames = new Set<string>()
const unhandledRefKinds = new Set<string>()

namespace Helpers {
	export function moveUpWhileParentFound(
		node: Node,
		allowedParents: ts.SyntaxKind[]
	): Node<ts.FunctionDeclaration> | undefined {
		const parent = node.getParent()
		if (!parent) {
			return undefined // Reached the top of the file
		}

		if (allowedParents.includes(parent.getKind())) {
			return parent as Node<ts.FunctionDeclaration>
		}

		return moveUpWhileParentFound(parent, allowedParents)
	}
}

namespace Algorithms {
	async function processRefNode(node: RefNode, fileNode: DBNode) {
		const refNode = await DBNode.fromTreeNode(new TreeNode(node))
		const fnID = refNode.id
		nodes[fnID] = refNode
		nodes[fnID].relations.push({
			relation: "IN_FILE",
			target: fileNode.id,
		})

		// Find call expressions for this function
		node.findReferencesAsNodes().forEach((ref) => {
			kindNames.add(ref.getKindName())
			switch (ref.getKind()) {
				case ts.SyntaxKind.ArrowFunction:
				case ts.SyntaxKind.FunctionDeclaration:
				case ts.SyntaxKind.FunctionExpression: {
					const nodeLocation = ref.getFirstAncestorByKind(
						ts.SyntaxKind.CallExpression
					)
					if (!nodeLocation) return

					const parent = Helpers.moveUpWhileParentFound(nodeLocation, [
						ts.SyntaxKind.FunctionDeclaration,
						ts.SyntaxKind.ArrowFunction,
						ts.SyntaxKind.SourceFile,
					])
					if (!parent) return

					const parentID = new TreeNode(parent).getID()

					const isAlreadyRelated = nodes[fnID].relations.some((rel) => {
						return rel.target === parentID
					})
					if (isAlreadyRelated) return

					nodes[fnID].relations.push({
						relation: "CALLED_BY",
						target: parentID,
					})

					break
				}

				case ts.SyntaxKind.Identifier: {
					const nodeLocation = ref.getFirstAncestor()
					if (!nodeLocation) return

					const parent = Helpers.moveUpWhileParentFound(nodeLocation, [
						ts.SyntaxKind.TypeAliasDeclaration,
						ts.SyntaxKind.FunctionDeclaration,
						ts.SyntaxKind.ArrowFunction,
						ts.SyntaxKind.SourceFile,
					])
					if (!parent) return

					const parentID = new TreeNode(parent).getID()
					const isAlreadyRelated = nodes[fnID].relations.some((rel) => {
						return rel.target === parentID
					})
					if (isAlreadyRelated) return

					nodes[fnID].relations.push({
						relation: "USED_IN",
						target: parentID,
					})

					break
				}

				default: {
					unhandledRefKinds.add(ref.getKindName())
					console.log("Unhandled ref", ref.getKindName())
				}
			}
		})
	}

	export async function processSourceFile(sourceFile: SourceFile) {
		const fileNode = await DBNode.fromTreeNode(new TreeNode(sourceFile))
		nodes[fileNode.id] = fileNode

		const allNodes = [
			...sourceFile.getFunctions(),
			...sourceFile.getTypeAliases(),
			...sourceFile.getEnums(),
			...sourceFile.getInterfaces(),
			...sourceFile.getClasses(),
			...sourceFile.getNamespaces(),
		]

		const jobs = allNodes.map((x) => processRefNode(x, fileNode))
		await Promise.all(jobs)
	}
}

export async function processCodebase(path: string, filename: string) {
	console.log("🕒 Ingesting")

	nodes = {}

	const project = new Project()
	project.addSourceFilesAtPaths(`${path}/**/*.{ts,tsx}`)

	const jobs = project
		.getSourceFiles()
		.map((x) => Algorithms.processSourceFile(x))
	await Promise.all(jobs)

	writeFileSync(`${filename}.data.json`, JSON.stringify(nodes, null, 2))

	console.log()
	console.log()
	console.log("UNIQUE KIND NAMES:\n", kindNames)
	console.log()
	console.log("UNHANDLED REF KIND NAMES:\n", unhandledRefKinds)
	console.log()
	console.log("UNHANDLED KIND NAMES:\n", notFoundKindNames)
	console.log()
	console.log()
	console.log("✅ Ingested")

	return nodes
}
