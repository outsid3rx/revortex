import type { SourceFile } from 'typescript'
import { createSourceFile, ScriptKind, ScriptTarget } from 'typescript'

export class Parser {
  private source!: SourceFile

  public setup(source: string) {
    this.source = createSourceFile(
      'index.ts',
      source,
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    )

    return this
  }

  public getNodes() {
    return this.source.statements
  }
}
