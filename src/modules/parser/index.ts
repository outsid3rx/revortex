import ts from 'typescript'

export {
  isCallExpression,
  isExpressionStatement,
  isFunctionDeclaration,
  isPropertyAccessExpression,
  isStringLiteral,
} from './utils'

export class Parser {
  private source!: ts.SourceFile

  public setup(source: string) {
    this.source = ts.createSourceFile(
      'index.ts',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    )

    return this
  }

  public getNodes() {
    return this.source.statements
  }
}
