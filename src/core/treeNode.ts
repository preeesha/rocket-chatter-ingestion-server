import { Node, VariableStatement, ts } from "ts-morph"

export const notFoundKindNames = new Set<string>()

export class TreeNode {
	node: Node<ts.Node>
	isFile: boolean

	constructor(node: Node<ts.Node>, isFile?: boolean) {
		this.node = node
		this.isFile = isFile || false
	}

	getName(): string {
		switch (this.node.getKind()) {
			case ts.SyntaxKind.SourceFile:
				return this.node.getSourceFile().getBaseName()
			case ts.SyntaxKind.VariableStatement:
			case ts.SyntaxKind.ExpressionStatement:
				return (
					(this.node as VariableStatement).getDeclarations()?.[0]?.getName() ||
					""
				)
			case ts.SyntaxKind.TypeAliasDeclaration:
			case ts.SyntaxKind.EnumDeclaration:
			case ts.SyntaxKind.MethodDeclaration:
			case ts.SyntaxKind.FunctionDeclaration:
			case ts.SyntaxKind.VariableDeclaration:
			case ts.SyntaxKind.InterfaceDeclaration:
			case ts.SyntaxKind.PropertyDeclaration:
			case ts.SyntaxKind.ClassDeclaration:
			case ts.SyntaxKind.ModuleDeclaration:
				return this.node.getSymbol()?.getName() || ""
			default:
				notFoundKindNames.add(this.node.getKindName())
				return (
					this.node.getSymbol()?.getFullyQualifiedName().split(".")[1] || ""
				)
		}
	}

	getID(): string {
		const nodeName = this.getName()
		const kind = this.node.getKind()
		const filePath = this.node.getSourceFile().getFilePath()

		if (this.isFile) return `${filePath}`

		return `${filePath}:${nodeName}:${kind}`
	}

	getKindName(): string {
		if (this.isFile) return "File"
		return this.node.getKindName()
	}

	getType(): string {
		if (this.isFile) return "File"
		return this.node.getType().getText() || "any"
	}
}
