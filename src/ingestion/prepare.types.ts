import {
	ClassDeclaration,
	EnumDeclaration,
	FunctionDeclaration,
	InterfaceDeclaration,
	NamespaceDeclaration,
	TypeAliasDeclaration,
} from "ts-morph"

export type RefNode =
	| FunctionDeclaration
	| TypeAliasDeclaration
	| EnumDeclaration
	| InterfaceDeclaration
	| ClassDeclaration
	| NamespaceDeclaration
