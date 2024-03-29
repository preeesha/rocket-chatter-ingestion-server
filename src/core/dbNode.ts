import { LLM } from "./llm"
import { TreeNode } from "./treeNode"

const DBNODE_NAMES_MAP: Record<string, string> = {
	File: "File",
	FunctionDeclaration: "Function",

	Parameter: "Variable",
	BindingElement: "Variable",
	VariableDeclaration: "Variable",
	VariableStatement: "Variable",

	EnumDeclaration: "Enum",
	ClassDeclaration: "Class",
	TypeAliasDeclaration: "Type",
	InterfaceDeclaration: "Interface",
	NamespaceDeclaration: "Namespace",

	MethodDeclaration: "Member",
	PropertyDeclaration: "Member",
	GetAccessor: "Member",
	SetAccessor: "Member",

	ImportDeclaration: "Import",
	ExpressionStatement: "Variable",

	ModuleDeclaration: "Module",
}

export type DBNodeRelation = "USED_IN" | "IN_FILE" | "CALLED_BY" | "LOCAL_OF"

export class DBNode {
	id: string
	name: string
	kind: string
	type: string

	code: string
	comments: string[]

	filePath: string
	relations: { target: string; relation: DBNodeRelation }[]

	nameEmbeddings: number[]
	codeEmbeddings: number[]

	isFile: boolean
	descriptor: "Node" | string

	constructor(node: {
		id: string
		name: string
		kind: string
		type: string
		code: string
		comments: string[]
		filePath: string
		relations: { target: string; relation: DBNodeRelation }[]
		nameEmbeddings: number[]
		codeEmbeddings: number[]
		descriptor: "Node" | string

		isFile?: boolean
	}) {
		this.id = node.id
		this.name = node.name
		this.kind = node.kind
		this.type = node.type

		this.code = node.code
		this.comments = node.comments

		this.filePath = node.filePath
		this.relations = node.relations

		this.nameEmbeddings = node.nameEmbeddings
		this.codeEmbeddings = node.codeEmbeddings

		this.isFile = node.isFile || false
		this.descriptor = node.descriptor
	}

	static async fromTreeNode(node: TreeNode): Promise<DBNode> {
		let name = node.getName()

		const contents = node.node.getText().trim()
		const comments =
			node.node.getFullText().match(/\/\*[\s\S]*?\*\/|\/\/.*/g) || []

		const n: DBNode = new DBNode({
			id: node.getID(),
			relations: [],

			nameEmbeddings: await LLM.generateEmbeddings(name),
			codeEmbeddings: await LLM.generateEmbeddings(contents),

			name: name,
			kind: node.getKindName(),
			type: node.getType(),

			code: contents,
			comments: comments.map((c) => c.trim()),

			filePath: node.node.getSourceFile().getFilePath(),

			descriptor: "Node",
		})

		return n
	}

	getNodeName(): string {
		return DBNODE_NAMES_MAP[this.kind] || "Node"
	}

	getDBInsertQuery(): string {
		let query = ""
		query += `
         CREATE (n:${this.descriptor} {
            id: $id,
            name: $name,
            kind: $kind,
            type: $type,
            code: $code,
            comments: $comments,
            filePath: $filePath,

            nameEmbeddings: $nameEmbeddings,
            codeEmbeddings: $codeEmbeddings
         })
      `

		return query
	}
}
