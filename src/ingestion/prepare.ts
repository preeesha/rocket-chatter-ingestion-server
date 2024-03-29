import { Node, Project, SourceFile, ts } from "ts-morph"
import { DBNode } from "../core/dbNode"
import { TreeNode } from "../core/treeNode"
import { RefNode } from "./prepare.types"

let nodes: Record<string, DBNode> = {}

const unhandledRefKinds = new Set<string>()

const TRACKED_KINDS = [
	ts.SyntaxKind.FunctionDeclaration,
	ts.SyntaxKind.ArrowFunction,
	ts.SyntaxKind.SourceFile,
	ts.SyntaxKind.MethodDeclaration,
	ts.SyntaxKind.PropertyDeclaration,
	ts.SyntaxKind.ClassDeclaration,
	ts.SyntaxKind.InterfaceDeclaration,
	ts.SyntaxKind.ModuleDeclaration,
	ts.SyntaxKind.TemplateExpression,
	ts.SyntaxKind.EnumDeclaration,
	ts.SyntaxKind.TypeAliasDeclaration,
	ts.SyntaxKind.VariableDeclaration,
]

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
	async function processRefNode(node: Node<ts.Node>, fileNode: DBNode) {
		const refNode = await DBNode.fromTreeNode(new TreeNode(node))
		const fnID = refNode.id
		nodes[fnID] = refNode
		nodes[fnID].relations.push({
			relation: fileNode.isFile ? "IN_FILE" : "LOCAL_OF",
			target: fileNode.id,
		})

		// Establish relations between nodes
		if ((node as any).findReferencesAsNodes) {
			;(node as RefNode).findReferencesAsNodes().forEach((ref) => {
				switch (ref.getKind()) {
					case ts.SyntaxKind.ArrowFunction:
					case ts.SyntaxKind.FunctionDeclaration:
					case ts.SyntaxKind.FunctionExpression: {
						const nodeLocation = ref.getFirstAncestorByKind(
							ts.SyntaxKind.CallExpression
						)
						if (!nodeLocation) return

						const parent = Helpers.moveUpWhileParentFound(
							nodeLocation,
							TRACKED_KINDS
						)
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

						const parent = Helpers.moveUpWhileParentFound(
							nodeLocation,
							TRACKED_KINDS
						)
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
					}
				}
			})

			for (const type of TRACKED_KINDS) {
				;(node as RefNode).getChildrenOfKind(type).forEach((child) => {
					processRefNode(child, fileNode)
				})
			}
		}

		node.getLocals().forEach((local) => {
			const declaration = local.getDeclarations()[0]
			if (!declaration) return
			processRefNode(declaration, refNode)
		})
	}

	export async function processSourceFile(sourceFile: SourceFile) {
		const fileNode = await DBNode.fromTreeNode(new TreeNode(sourceFile, true))
		nodes[fileNode.id] = fileNode
		const allNodes = TRACKED_KINDS.map((kind) =>
			sourceFile.getDescendantsOfKind(kind)
		).flat()

		console.log(
			`🕒 Processing ${allNodes.length.toString().padStart(3, " ")} nodes in ${
				fileNode.filePath
			}`
		)

		const jobs = allNodes.map((x) => processRefNode(x, fileNode))
		await Promise.all(jobs)
	}
}

export async function prepareCodebase(
	path: string
): Promise<Record<string, DBNode>> {
	console.log("🕒 Preparing Nodes")

	nodes = {}

	const project = new Project()
	project.addSourceFilesAtPaths(`${path}/**/*.ts`)

	const jobs = project
		.getSourceFiles()
		.map((x) => Algorithms.processSourceFile(x))
	await Promise.all(jobs)

	console.log(`✅ Prepared ${Object.keys(nodes).length} nodes`)

	return nodes
}

export async function prepareNodesEmbeddings(
	nodes: Record<string, DBNode>
): Promise<Record<string, DBNode>> {
	console.log("🕒 Preparing Embeddings")

	const jobs = Object.values(nodes).map((x) => DBNode.fillEmbeddings(x))
	await Promise.all(jobs)

	console.log(`✅ Prepared embeddings for ${Object.keys(nodes).length} nodes`)

	return nodes
}
